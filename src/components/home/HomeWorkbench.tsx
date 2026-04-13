'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {
  Shield, Loader2, Rocket, ExternalLink,
  AlertCircle, Flame, RotateCcw,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/context/AuthContext'

// ---------------------------------------------------------------------------
// HomeWorkbench — logged-in users' landing experience
//
// Flow:
//   1. User pastes a URL  → calls /api/scan-preview (server-side metadata fetch)
//   2. Preview card shows logo / title / description + security shield
//   3. "Confirm & Launch" → POST /api/v1/apps (create draft) + POST /:id/submit
//   4. Trending row (horizontal scroll) always visible below
// ---------------------------------------------------------------------------

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080'

type ScanStatus = 'Clean' | 'Protected' | 'Adult'
type Phase      = 'idle' | 'scanning' | 'preview' | 'launching' | 'done' | 'error'

interface ScanResult {
  status:            ScanStatus
  title:             string | null
  description:       string | null
  logo:              string | null
  suggestedCategory: string | null
}

interface TrendingApp {
  id:      string
  name:    string
  slug:    string
  iconUrl: string | null
}

interface Category {
  id:   string
  name: string
}

function toSlug(name: string): string {
  const base   = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 55)
  const suffix = Math.random().toString(36).slice(2, 7)
  return base ? `${base}-${suffix}` : suffix
}

function safeHostname(url: string): string {
  try { return new URL(url).hostname } catch { return url }
}

// ── Shield badge ─────────────────────────────────────────────────────────────

const SHIELD_STYLES: Record<ScanStatus, string> = {
  Clean:     'border-teal-200 bg-teal-50 text-teal-700',
  Protected: 'border-stone-200 bg-stone-100 text-stone-500',
  Adult:     'border-red-200 bg-red-50 text-red-700',
}

const SHIELD_LABELS: Record<ScanStatus, string> = {
  Clean:     'No threats detected',
  Protected: 'Site is protected — scan limited',
  Adult:     'Content Violation — Adult content is not allowed on Imagine.',
}

// ── Main component ────────────────────────────────────────────────────────────

export function HomeWorkbench({ displayName }: { displayName: string }) {
  const { accessToken } = useAuth()

  const [url,        setUrl]        = useState('')
  const [phase,      setPhase]      = useState<Phase>('idle')
  const [result,     setResult]     = useState<ScanResult | null>(null)
  const [errorMsg,   setErrorMsg]   = useState('')
  const [trending,   setTrending]   = useState<TrendingApp[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [launchedId, setLaunchedId] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetch(`${API_BASE}/api/v1/apps?limit=20`)
      .then(r => r.json())
      .then((j: unknown) => {
        const items = (j as { data?: { items?: TrendingApp[] } }).data?.items ?? []
        setTrending(items)
      })
      .catch(() => {})

    fetch('/api/categories')
      .then(r => r.json())
      .then((j: unknown) => {
        const cats = (j as { data?: Category[] }).data ?? []
        setCategories(cats)
      })
      .catch(() => {})
  }, [])

  const reset = useCallback(() => {
    setPhase('idle')
    setResult(null)
    setUrl('')
    setErrorMsg('')
    setLaunchedId(null)
    setTimeout(() => inputRef.current?.focus(), 50)
  }, [])

  async function handleScan() {
    const trimmed = url.trim()
    if (!trimmed) { setErrorMsg('Paste a URL first'); return }
    if (!/^https?:\/\//i.test(trimmed)) { setErrorMsg('URL must start with https://'); return }

    setErrorMsg('')
    setPhase('scanning')
    setResult(null)

    try {
      const res  = await fetch('/api/scan-preview', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ url: trimmed }),
      })
      const data = await res.json() as ScanResult
      if (!res.ok) throw new Error('Scan failed')
      setResult(data)
      setPhase('preview')
    } catch {
      setPhase('error')
      setErrorMsg('Scanner failed to reach the site. Please try again.')
    }
  }

  async function handleLaunch() {
    if (!result || !accessToken) return
    setPhase('launching')

    const trimmed    = url.trim()
    const hostname   = safeHostname(trimmed)
    const appName    = (result.title ?? hostname).slice(0, 100)
    const tagline    = (result.description ?? `App at ${hostname}`).slice(0, 200)
    const slug       = toSlug(result.title ?? hostname)

    const categoryId = result.suggestedCategory
      ? categories.find(c => c.name.toLowerCase() === result.suggestedCategory!.toLowerCase())?.id
      : undefined

    try {
      const createRes = await fetch(`${API_BASE}/api/v1/apps`, {
        method:  'POST',
        headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug,
          name:      appName,
          tagline,
          launchUrl: trimmed,
          ...(result.description ? { description: result.description } : {}),
          ...(result.logo        ? { iconUrl: result.logo }             : {}),
          ...(categoryId         ? { categoryId }                       : {}),
        }),
      })
      const createJson = await createRes.json() as {
        data?: { id: string }
        error?: { message?: string }
      }
      if (!createRes.ok) throw new Error(createJson.error?.message ?? `Error ${createRes.status}`)
      const appId = createJson.data?.id
      if (!appId) throw new Error('No app ID returned')

      await fetch(`${API_BASE}/api/v1/apps/${appId}/submit`, {
        method:  'POST',
        headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body:    JSON.stringify({}),
      })

      setLaunchedId(appId)
      setPhase('done')
    } catch (err) {
      setPhase('error')
      setErrorMsg(err instanceof Error ? err.message : 'Launch failed. Please try again.')
    }
  }

  const isScanning  = phase === 'scanning'
  const isLaunching = phase === 'launching'
  const showPreview = phase === 'preview' || phase === 'launching' || phase === 'done'

  return (
    <section className="w-full min-h-[100svh] pt-20 sm:pt-32 pb-20 px-4">
      <div className="mx-auto max-w-lg">

        {/* ── Brand header ─────────────────────────────────────────────── */}
        <div className="mb-12 flex flex-col items-center text-center">

          {/* Single wordmark logo — this IS the brand, no title repetition */}
          <Image
            src="/imagine-logo.png"
            alt="Imagine"
            width={180}
            height={54}
            className="h-11 w-auto object-contain"
            priority
          />

          {/* Page title — "Marketplace" pairs with the wordmark above */}
          <h1 className="mt-5 text-3xl sm:text-4xl font-bold tracking-tight text-stone-900">
            Marketplace
          </h1>

          {/* Subtitle */}
          <p className="mt-3 text-sm sm:text-base text-stone-500 leading-relaxed max-w-sm">
            Transform any URL into a published AI app in seconds.
          </p>

          {/* Greeting whisper */}
          <p className="mt-2 text-xs text-stone-400">
            Welcome back,{' '}
            <span className="font-medium">{displayName.split(' ')[0]}</span>
          </p>
        </div>

        {/* ── URL input row ─────────────────────────────────────────────── */}
        <div className="mb-3">
          <div className="flex gap-2">
            <input
              ref={inputRef}
              type="url"
              value={url}
              onChange={e => { setUrl(e.target.value); setErrorMsg('') }}
              onKeyDown={e => e.key === 'Enter' && phase === 'idle' && void handleScan()}
              placeholder="https://your-ai-app.com"
              disabled={isScanning || isLaunching || phase === 'done'}
              aria-label="Paste URL to scan and launch"
              className={cn(
                'flex-1 rounded-xl border px-4 py-3 text-sm outline-none transition-all duration-150',
                'border-stone-200 bg-white placeholder:text-stone-400 text-stone-900',
                'shadow-sm',
                'focus:border-teal-400 focus:ring-2 focus:ring-teal-500/15',
                'disabled:opacity-50 disabled:bg-stone-50',
              )}
            />

            {/* Reset / Scan button */}
            {showPreview || phase === 'error' ? (
              <button
                type="button"
                onClick={reset}
                disabled={isLaunching}
                className={cn(
                  'flex shrink-0 items-center gap-1.5 rounded-xl border border-stone-200 bg-white',
                  'px-4 py-3 text-sm font-medium text-stone-600',
                  'hover:bg-stone-50 hover:border-stone-300 transition-colors duration-150',
                  'disabled:opacity-50',
                )}
                aria-label="Reset"
              >
                <RotateCcw className="h-4 w-4" />
                <span className="hidden sm:inline">Reset</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => void handleScan()}
                disabled={isScanning || !url.trim()}
                className={cn(
                  'flex shrink-0 items-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold transition-all duration-150',
                  'bg-teal-700 text-white',
                  'hover:bg-teal-600 active:scale-95',
                  'disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100',
                )}
              >
                {isScanning
                  ? <Loader2 className="h-4 w-4 animate-spin" />
                  : null}
                {isScanning ? 'Scanning…' : 'Scan & Launch'}
              </button>
            )}
          </div>

          {/* Hint / error */}
          <div className="mt-2 min-h-[1.125rem]">
            {errorMsg ? (
              <p className="flex items-center gap-1.5 text-xs text-red-500">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                {errorMsg}
              </p>
            ) : phase === 'idle' ? (
              <p className="text-[11px] text-stone-400">
                Paste any URL · Security scan runs automatically
              </p>
            ) : null}
          </div>
        </div>

        {/* ── Scanning placeholder ─────────────────────────────────────── */}
        {isScanning && (
          <div className="mt-4 flex items-center justify-center gap-2.5 rounded-xl border border-stone-100 bg-stone-50 py-10">
            <Loader2 className="h-4 w-4 animate-spin text-stone-400" />
            <span className="text-sm text-stone-500">Fetching site metadata…</span>
          </div>
        )}

        {/* ── Preview card ─────────────────────────────────────────────── */}
        {showPreview && result && (
          <div className="mt-4 overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm">
            <div className="p-5">

              {/* App identity row */}
              <div className="flex items-start gap-3.5">
                {/* Logo / fallback */}
                <div className="relative shrink-0 h-12 w-12 rounded-lg overflow-hidden border border-stone-100 bg-stone-50">
                  {result.logo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={result.logo}
                      alt=""
                      className="h-full w-full object-cover"
                      onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-stone-100">
                      <ExternalLink className="h-5 w-5 text-stone-400" />
                    </div>
                  )}
                </div>

                {/* Title + description */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-stone-900 leading-snug line-clamp-1">
                    {result.title ?? safeHostname(url)}
                  </p>
                  {result.description && (
                    <p className="mt-1 text-xs text-stone-500 line-clamp-2 leading-relaxed">
                      {result.description}
                    </p>
                  )}
                  <p className="mt-1 text-[10px] text-stone-400 truncate">{url}</p>
                </div>
              </div>

              {/* Security shield */}
              <div className={cn(
                'mt-4 flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium',
                SHIELD_STYLES[result.status],
              )}>
                <Shield className="h-3.5 w-3.5 shrink-0" />
                {SHIELD_LABELS[result.status]}
              </div>
            </div>

            {/* Confirm & Launch footer */}
            {phase !== 'done' && result.status !== 'Adult' && (
              <div className="border-t border-stone-100 bg-stone-50/70 px-5 py-4">
                <button
                  type="button"
                  onClick={() => void handleLaunch()}
                  disabled={isLaunching}
                  className={cn(
                    'w-full flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold transition-all duration-150',
                    'bg-teal-700 text-white hover:bg-teal-600 active:scale-[0.99]',
                    'disabled:opacity-60 disabled:cursor-not-allowed disabled:active:scale-100',
                  )}
                >
                  {isLaunching
                    ? <><Loader2 className="h-4 w-4 animate-spin" /> Launching…</>
                    : <><Rocket className="h-4 w-4" /> Confirm &amp; Launch</>}
                </button>
              </div>
            )}

            {/* Adult content hard-block */}
            {result.status === 'Adult' && (
              <div className="border-t border-red-100 bg-red-50 px-5 py-3">
                <p className="text-center text-xs font-medium text-red-600">
                  This URL cannot be submitted to Imagine.
                </p>
              </div>
            )}

            {/* Done state */}
            {phase === 'done' && (
              <div className="border-t border-teal-100 bg-teal-50 px-5 py-3.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-teal-100">
                      <svg className="h-3 w-3 text-teal-600" viewBox="0 0 12 12" fill="none">
                        <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                    <p className="text-sm font-semibold text-teal-700">Launched!</p>
                  </div>
                  <Link
                    href="/dashboard"
                    className="text-xs font-medium text-teal-600 hover:underline underline-offset-2"
                  >
                    View in Dashboard →
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Trending row ─────────────────────────────────────────────── */}
        {trending.length > 0 && (
          <div className="mt-12">
            <div className="mb-4 flex items-center gap-1.5">
              <Flame className="h-3.5 w-3.5 text-orange-400" aria-hidden />
              <span className="text-[11px] font-semibold uppercase tracking-wider text-stone-400">
                Trending
              </span>
            </div>

            <div className="-mx-4 px-4 overflow-x-auto scrollbar-hide">
              <div className="flex gap-3 pb-2" style={{ width: 'max-content' }}>
                {trending.map(app => {
                  const hue = (app.name.charCodeAt(0) * 137) % 360
                  return (
                    <Link
                      key={app.id}
                      href={`/apps/${app.slug}`}
                      title={app.name}
                      className="group flex flex-col items-center gap-1.5"
                    >
                      <div className={cn(
                        'h-12 w-12 overflow-hidden rounded-xl',
                        'border border-stone-200 bg-stone-100',
                        'transition-all duration-150 ease-out',
                        'group-hover:scale-110 group-hover:border-teal-300 group-hover:shadow-md group-hover:shadow-teal-500/15',
                      )}>
                        {app.iconUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={app.iconUrl}
                            alt={app.name}
                            className="h-full w-full object-cover"
                            onError={e => {
                              const el = e.currentTarget as HTMLImageElement
                              el.style.display = 'none'
                              const parent = el.parentElement
                              if (parent) {
                                parent.style.background = `hsl(${hue}deg 40% 88%)`
                                parent.innerHTML = `<span class="flex h-full w-full items-center justify-center text-sm font-bold text-stone-600 select-none">${app.name[0]?.toUpperCase() ?? '?'}</span>`
                              }
                            }}
                          />
                        ) : (
                          <div
                            className="flex h-full w-full items-center justify-center text-sm font-bold text-stone-600 select-none"
                            style={{ background: `hsl(${hue}deg 40% 88%)` }}
                          >
                            {app.name[0]?.toUpperCase()}
                          </div>
                        )}
                      </div>
                      <span className="w-12 text-center text-[10px] leading-tight text-stone-400 group-hover:text-stone-600 transition-colors line-clamp-1">
                        {app.name}
                      </span>
                    </Link>
                  )
                })}
              </div>
            </div>
          </div>
        )}

      </div>
    </section>
  )
}
