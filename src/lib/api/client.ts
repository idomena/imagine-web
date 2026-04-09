// ---------------------------------------------------------------------------
// Typed fetch wrapper for the AppMarket Fastify API.
//
// URL resolution (in priority order):
//   1. INTERNAL_API_URL  — server-only, runtime, Railway-internal network.
//                          Set to http://imagine-marketplace.railway.internal:8080
//                          Traffic stays inside Railway, no public round-trip.
//   2. NEXT_PUBLIC_API_URL — baked at build time, used by both server and
//                          browser. Must be the public https:// Railway domain.
//   3. localhost:8080     — local development fallback.
//
// Why the typeof window check?
//   Next.js replaces NEXT_PUBLIC_* at build time via webpack DefinePlugin.
//   Non-NEXT_PUBLIC vars (like INTERNAL_API_URL) are NOT replaced — they are
//   read from the real process.env at runtime, but ONLY in server bundles.
//   In client bundles, webpack statically removes the window===undefined branch
//   so process.env.INTERNAL_API_URL is never accessed in the browser.
// ---------------------------------------------------------------------------

const BASE_URL =
  (typeof window === 'undefined' ? process.env['INTERNAL_API_URL'] : undefined) ??
  process.env.NEXT_PUBLIC_API_URL ??
  'http://localhost:8080'

if (process.env.NODE_ENV === 'production' && !process.env.NEXT_PUBLIC_API_URL) {
  console.error(
    '[api/client] NEXT_PUBLIC_API_URL is not set — all browser API calls will fail. ' +
    'Add NEXT_PUBLIC_API_URL to your Railway web service Variables and redeploy.',
  )
}

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code:   string,
    message: string,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

type RequestOptions = Omit<RequestInit, 'body' | 'method'> & {
  token?: string
}

async function request<T>(
  method: string,
  path:   string,
  body?:  unknown,
  opts:   RequestOptions = {},
): Promise<T> {
  const { token, ...fetchOpts } = opts

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(fetchOpts.headers as Record<string, string> | undefined),
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    ...fetchOpts,
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })

  // Parse JSON regardless — error bodies are also JSON on this API.
  let json: unknown
  try {
    json = await res.json()
  } catch {
    json = {}
  }

  if (!res.ok) {
    const err = json as { code?: string; message?: string }
    throw new ApiError(
      res.status,
      err.code    ?? 'UNKNOWN',
      err.message ?? `HTTP ${res.status}`,
    )
  }

  return json as T
}

// ── Convenience methods ───────────────────────────────────────────────────────

export const apiClient = {
  get<T>(path: string, opts?: RequestOptions) {
    return request<T>('GET', path, undefined, opts)
  },

  post<T>(path: string, body: unknown, opts?: RequestOptions) {
    return request<T>('POST', path, body, opts)
  },

  patch<T>(path: string, body: unknown, opts?: RequestOptions) {
    return request<T>('PATCH', path, body, opts)
  },

  delete<T>(path: string, opts?: RequestOptions) {
    return request<T>('DELETE', path, undefined, opts)
  },
}
