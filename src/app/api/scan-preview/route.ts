import { NextRequest, NextResponse } from 'next/server'

// ---------------------------------------------------------------------------
// POST /api/scan-preview
//
// Server-side URL fetch + metadata extraction for the Home Workbench.
// Runs in the Next.js server layer so there are no CORS issues and the
// Chrome UA headers come from a real server IP.
//
// Returns:
//   { status: 'Clean' | 'Protected', title, description, logo, suggestedCategory }
//
// 'Protected' is returned whenever the site blocks or fails the fetch —
// it is not a security judgement, just "we couldn't read it".
// The full security analysis happens later in the backend scanApp() call.
// ---------------------------------------------------------------------------

// ── Category keyword detection (mirrors backend CATEGORY_RULES) ───────────────

const CATEGORY_RULES: Array<{ keywords: string[]; name: string }> = [
  { keywords: ['fitness', 'nutrition', 'workout', 'gym', 'exercise', 'yoga', 'diet',
               'calories', 'running', 'sport', 'training', 'health', 'wellness'],
    name: 'Sports & Health' },
  { keywords: ['ai', 'chat', 'gpt', 'llm', 'assistant', 'productivity', 'notes',
               'task', 'todo', 'workflow', 'automation', 'copilot', 'summarize'],
    name: 'Productivity' },
  { keywords: ['code', 'developer', 'api', 'github', 'programming', 'debug',
               'deploy', 'devops', 'cli', 'sdk', 'repository', 'coding'],
    name: 'Developer Tools' },
  { keywords: ['finance', 'budget', 'money', 'invest', 'crypto', 'payment',
               'invoice', 'accounting', 'expense', 'trading', 'bank'],
    name: 'Finance' },
  { keywords: ['game', 'gaming', 'play', 'puzzle', 'quiz', 'fun', 'entertainment',
               'stream', 'music', 'video', 'movie'],
    name: 'Entertainment' },
  { keywords: ['education', 'learn', 'course', 'study', 'tutor', 'school',
               'lesson', 'exam', 'language', 'math'],
    name: 'Education' },
  { keywords: ['design', 'image', 'photo', 'art', 'creative', 'canvas',
               'editor', 'drawing', 'illustration', 'ui', 'mockup'],
    name: 'Design & Creative' },
  { keywords: ['social', 'community', 'forum', 'network', 'friend', 'message',
               'connect', 'team', 'collaboration'],
    name: 'Social' },
  { keywords: ['analytics', 'data', 'dashboard', 'metrics', 'report',
               'insight', 'chart', 'stats', 'tracking', 'monitor'],
    name: 'Analytics' },
  { keywords: ['security', 'privacy', 'vpn', 'protection', 'safe',
               'scanner', 'firewall', 'threat', 'password', 'encrypt'],
    name: 'Security' },
]

function suggestCategoryName(text: string): string | null {
  const lower = text.toLowerCase()
  for (const { keywords, name } of CATEGORY_RULES) {
    if (keywords.some(kw => lower.includes(kw))) return name
  }
  return null
}

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

// Adult platform hostnames — mirrors backend ADULT_PLATFORM_HOSTNAMES
const ADULT_PLATFORM_HOSTNAMES = [
  'pornhub', 'xvideos', 'xhamster', 'xnxx', 'xnn',
  'brazzers', 'bangbros', 'realitykings', 'naughtyamerica',
  'mofos', 'fakehub', 'teamskeet', 'digitalplayground',
  'blacked', 'tushy', 'vixen',
  'xtube', 'youporn', 'redtube', 'tube8', 'spankbang', 'eporner',
  'chaturbate', 'stripchat', 'myfreecams', 'cam4', 'bongacams',
  'adultempire', 'adultime', 'nubiles',
]

const PROTECTED = { status: 'Protected' as const, title: null, description: null, logo: null, suggestedCategory: null }
const ADULT     = { status: 'Adult'     as const, title: null, description: null, logo: null, suggestedCategory: null }

export async function POST(req: NextRequest) {
  let body: { url?: string }
  try { body = await req.json() as { url?: string } } catch { return NextResponse.json(PROTECTED) }

  const url = body.url?.trim()
  if (!url || !/^https:\/\//i.test(url)) {
    return NextResponse.json({ error: 'Invalid URL' }, { status: 400 })
  }

  // Reject obviously internal targets; also block known adult platforms immediately
  try {
    const parsed   = new URL(url)
    const hostname = parsed.hostname.toLowerCase()

    if (parsed.hostname === 'localhost' || parsed.hostname.endsWith('.local') || /^(127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(parsed.hostname)) {
      return NextResponse.json({ error: 'URL not allowed' }, { status: 400 })
    }

    // Block known adult platforms before any fetch
    if (ADULT_PLATFORM_HOSTNAMES.some(p => hostname === p || hostname.endsWith(`.${p}`) || hostname.includes(p))) {
      return NextResponse.json(ADULT)
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

    const html              = new TextDecoder().decode(Buffer.concat(chunks.map(c => Buffer.from(c))))
    const meta              = extractMeta(html, url)
    const suggestedCategory = suggestCategoryName(`${meta.title ?? ''} ${meta.description ?? ''}`)

    return NextResponse.json({ status: 'Clean' as const, ...meta, suggestedCategory })
  } catch {
    return NextResponse.json(PROTECTED)
  }
}
