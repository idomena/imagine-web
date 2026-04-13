import { NextRequest, NextResponse } from 'next/server'

// ---------------------------------------------------------------------------
// POST /api/scan-preview
//
// Server-side URL fetch + metadata extraction for the Home Workbench.
// Runs in the Next.js server layer so there are no CORS issues and the
// Chrome UA headers come from a real server IP.
//
// Returns:
//   { status: 'Clean' | 'Protected', title, description, logo }
//
// 'Protected' is returned whenever the site blocks or fails the fetch —
// it is not a security judgement, just "we couldn't read it".
// The full security analysis happens later in the backend scanApp() call.
// ---------------------------------------------------------------------------

const FETCH_TIMEOUT_MS  = 8_000
const MAX_CONTENT_BYTES = 262_144 // 256 KB — enough to cover any <head>

const CHROME_HEADERS = {
  'User-Agent':                'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.6367.82 Safari/537.36',
  'Accept':                    'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
  'Accept-Language':           'en-US,en;q=0.9',
  'Accept-Encoding':           'gzip, deflate, br',
  'Cache-Control':             'no-cache',
  'Sec-CH-UA':                 '"Chromium";v="124", "Google Chrome";v="124", "Not-A.Brand";v="99"',
  'Sec-CH-UA-Mobile':          '?0',
  'Sec-CH-UA-Platform':        '"Windows"',
  'Sec-Fetch-Dest':            'document',
  'Sec-Fetch-Mode':            'navigate',
  'Sec-Fetch-Site':            'none',
  'Sec-Fetch-User':            '?1',
  'Upgrade-Insecure-Requests': '1',
}

function resolveUrl(href: string, baseUrl: string): string | null {
  try { return new URL(href, baseUrl).href } catch { return null }
}

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g,  '<')
    .replace(/&gt;/g,  '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&apos;/g, "'")
}

function extractMeta(html: string, pageUrl: string) {
  // title — og:title wins, then <title>
  const ogTitle  = html.match(/<meta[^>]+property\s*=\s*["']og:title["'][^>]+content\s*=\s*["']([^"']{1,200})["'][^>]*>/i)?.[1]
                ?? html.match(/<meta[^>]+content\s*=\s*["']([^"']{1,200})["'][^>]+property\s*=\s*["']og:title["'][^>]*>/i)?.[1]
  const tagTitle = html.match(/<title[^>]*>([^<]{1,200})<\/title>/i)?.[1]?.trim()
  const title    = decodeEntities((ogTitle ?? tagTitle ?? '').trim()) || null

  // description — og:description, then meta[name=description]
  const ogDesc   = html.match(/<meta[^>]+property\s*=\s*["']og:description["'][^>]+content\s*=\s*["']([^"']{1,400})["'][^>]*>/i)?.[1]
                ?? html.match(/<meta[^>]+content\s*=\s*["']([^"']{1,400})["'][^>]+property\s*=\s*["']og:description["'][^>]*>/i)?.[1]
  const metaDesc = html.match(/<meta[^>]+name\s*=\s*["']description["'][^>]+content\s*=\s*["']([^"']{1,400})["'][^>]*>/i)?.[1]
                ?? html.match(/<meta[^>]+content\s*=\s*["']([^"']{1,400})["'][^>]+name\s*=\s*["']description["'][^>]*>/i)?.[1]
  const description = decodeEntities((ogDesc ?? metaDesc ?? '').trim()) || null

  // logo — apple-touch-icon > og:image > shortcut icon > icon
  const appleIcon   = html.match(/<link[^>]+rel\s*=\s*["']apple-touch-icon["'][^>]+href\s*=\s*["']([^"']+)["'][^>]*>/i)?.[1]
                   ?? html.match(/<link[^>]+href\s*=\s*["']([^"']+)["'][^>]+rel\s*=\s*["']apple-touch-icon["'][^>]*>/i)?.[1]
  const ogImage     = html.match(/<meta[^>]+property\s*=\s*["']og:image["'][^>]+content\s*=\s*["']([^"']+)["'][^>]*>/i)?.[1]
                   ?? html.match(/<meta[^>]+content\s*=\s*["']([^"']+)["'][^>]+property\s*=\s*["']og:image["'][^>]*>/i)?.[1]
  const shortcut    = html.match(/<link[^>]+rel\s*=\s*["']shortcut icon["'][^>]+href\s*=\s*["']([^"']+)["'][^>]*>/i)?.[1]
                   ?? html.match(/<link[^>]+href\s*=\s*["']([^"']+)["'][^>]+rel\s*=\s*["']shortcut icon["'][^>]*>/i)?.[1]
  const icon        = html.match(/<link[^>]+rel\s*=\s*["']icon["'][^>]+href\s*=\s*["']([^"']+)["'][^>]*>/i)?.[1]
                   ?? html.match(/<link[^>]+href\s*=\s*["']([^"']+)["'][^>]+rel\s*=\s*["']icon["'][^>]*>/i)?.[1]

  const rawLogo = appleIcon ?? ogImage ?? shortcut ?? icon ?? null
  const logo    = rawLogo ? resolveUrl(rawLogo, pageUrl) : null

  return { title, description, logo }
}

const PROTECTED = { status: 'Protected' as const, title: null, description: null, logo: null }

export async function POST(req: NextRequest) {
  let body: { url?: string }
  try { body = await req.json() as { url?: string } } catch { return NextResponse.json(PROTECTED) }

  const url = body.url?.trim()
  if (!url || !/^https?:\/\//i.test(url)) {
    return NextResponse.json({ error: 'Invalid URL' }, { status: 400 })
  }

  // Reject obviously internal targets
  try {
    const parsed = new URL(url)
    if (parsed.hostname === 'localhost' || parsed.hostname.endsWith('.local') || /^(127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(parsed.hostname)) {
      return NextResponse.json({ error: 'URL not allowed' }, { status: 400 })
    }
  } catch {
    return NextResponse.json({ error: 'Invalid URL' }, { status: 400 })
  }

  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)

    const res = await fetch(url, {
      signal:   controller.signal,
      redirect: 'follow',
      headers:  CHROME_HEADERS,
    })
    clearTimeout(timer)

    if (!res.ok) return NextResponse.json(PROTECTED)

    const ct = res.headers.get('content-type') ?? ''
    if (!ct.includes('html') && !ct.includes('text')) return NextResponse.json(PROTECTED)

    const reader = res.body?.getReader()
    if (!reader) return NextResponse.json(PROTECTED)

    const chunks: Uint8Array[] = []
    let total = 0
    for (;;) {
      const { done, value } = await reader.read()
      if (done || !value) break
      total += value.length
      chunks.push(value)
      // Stop once we have the head — no need to read the whole page
      if (total > MAX_CONTENT_BYTES) { await reader.cancel(); break }
    }

    const html = new TextDecoder().decode(Buffer.concat(chunks.map(c => Buffer.from(c))))
    const meta = extractMeta(html, url)

    return NextResponse.json({ status: 'Clean' as const, ...meta })
  } catch {
    return NextResponse.json(PROTECTED)
  }
}
