import { NextResponse } from 'next/server'

/**
 * GET /api/categories
 *
 * Thin proxy to the Fastify backend's category list.
 *
 * Why this route exists:
 *  - Client components call a same-origin URL (/api/categories) instead of
 *    the raw backend URL, so there are no CORS issues and the backend URL is
 *    never exposed in client bundles.
 *  - next: { revalidate: 300 } caches the response on the Next.js edge for
 *    5 minutes, reducing round-trips to the backend on every page load.
 *
 * Environment variables used (set both in Railway + local .env):
 *  INTERNAL_API_URL      — Railway internal network URL (server-side only)
 *  NEXT_PUBLIC_API_URL   — public URL, used as fallback
 */

// Prefer the Railway private network URL when running on the server;
// it's faster, free of egress charges, and never reaches the public internet.
const BACKEND =
  process.env.INTERNAL_API_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  'http://localhost:8080'

export async function GET() {
  try {
    const res = await fetch(`${BACKEND}/api/v1/categories`, {
      // Cache on the Next.js data cache for 5 minutes.
      // Revalidated automatically when stale; safe to call on every render.
      next: { revalidate: 300 },
    })

    if (!res.ok) {
      console.error(`[/api/categories] upstream ${res.status}`)
      return NextResponse.json({ data: [] }, { status: res.status })
    }

    const json: unknown = await res.json()
    return NextResponse.json(json)
  } catch (err) {
    console.error('[/api/categories] fetch error:', err)
    return NextResponse.json({ data: [] }, { status: 502 })
  }
}
