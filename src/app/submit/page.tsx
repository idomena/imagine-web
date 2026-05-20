'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import {
  CheckCircle, CheckCircle2, AlertCircle, ShieldAlert, Loader2, Upload, ImagePlus, LogIn, Camera, ArrowLeft, X, ShieldCheck, Rocket,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/context/AuthContext'

// ---------------------------------------------------------------------------
// /submit page — dedicated full-page submission flow
// ---------------------------------------------------------------------------

const API_BASE  = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080'
const MAX_FILES = 4

const PALETTE = [
  { hex: '#14b8a6', label: 'Teal'   },
  { hex: '#0ea5e9', label: 'Sky'    },
  { hex: '#6366f1', label: 'Indigo' },
  { hex: '#8b5cf6', label: 'Violet' },
  { hex: '#ec4899', label: 'Pink'   },
  { hex: '#ef4444', label: 'Red'    },
  { hex: '#f97316', label: 'Orange' },
  { hex: '#eab308', label: 'Yellow' },
  { hex: '#22c55e', label: 'Green'  },
  { hex: '#64748b', label: 'Slate'  },
  { hex: '#78716c', label: 'Stone'  },
  { hex: '#1c1917', label: 'Dark'   },
]

// scanning  — full-screen overlay active, waiting for backend
// success   — scan passed, green checkmark overlay, redirecting
// rejected  — scan failed, red shield overlay
// error     — pre-scan validation error (shown inline in form)
// duplicate — user already submitted this app
type FormStatus = 'idle' | 'scanning' | 'success' | 'rejected' | 'error' | 'duplicate'

interface UploadedFile { file: File; preview: string }

function toSlug(name: string) {
  return name.toLowerCase().trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 100)
}

export default function SubmitPage() {
  const { user, accessToken } = useAuth()

  const [logoFile,    setLogoFile]    = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const logoInputRef = useRef<HTMLInputElement>(null)

  const [uploads,    setUploads]    = useState<UploadedFile[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [name,         setName]         = useState('')
  const [slug,         setSlug]         = useState('')
  const [slugTouched,  setSlugTouched]  = useState(false)
  const [tagline,      setTagline]      = useState('')
  const [description,  setDescription]  = useState('')
  const [launchUrl,    setLaunchUrl]    = useState('')
  const [categoryId,   setCategoryId]   = useState('')
  const [primaryColor, setPrimaryColor] = useState<string | null>(null)
  const [formStatus,      setFormStatus]      = useState<FormStatus>('idle')
  const [formError,       setFormError]       = useState('')
  const [rejectedThreats, setRejectedThreats] = useState<string[]>([])
  const [duplicateApp,    setDuplicateApp]    = useState<{ id: string; name: string } | null>(null)
  const [categories,   setCategories]   = useState<{ id: string; name: string }[]>([])

  const bypassDupeCheck = useRef(false)

  useEffect(() => {
    fetch(`${API_BASE}/api/v1/categories`)
      .then(r => r.json())
      .then((json: { data?: { id: string; name: string }[] }) => setCategories(json.data ?? []))
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (!slugTouched) setSlug(toSlug(name))
  }, [name, slugTouched])

  function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (logoPreview) URL.revokeObjectURL(logoPreview)
    setLogoFile(file)
    setLogoPreview(URL.createObjectURL(file))
    e.target.value = ''
  }

  function addFiles(incoming: FileList | null) {
    if (!incoming) return
    const imageFiles = Array.from(incoming).filter(f => f.type.startsWith('image/'))
    setUploads(prev => [...prev, ...imageFiles.map(file => ({
      file, preview: URL.createObjectURL(file),
    }))].slice(0, MAX_FILES))
  }

  const onDrop     = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setIsDragging(false); addFiles(e.dataTransfer.files)
  }, [])
  const onDragOver  = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true) }
  const onDragLeave = () => setIsDragging(false)

  function removeFile(i: number) {
    setUploads(prev => {
      URL.revokeObjectURL(prev[i]!.preview)
      return prev.filter((_, idx) => idx !== i)
    })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (uploads.length === 0) {
      setFormError('Please upload at least one screenshot.'); setFormStatus('error'); return
    }
    if (!accessToken) {
      setFormError('You must be signed in to submit an app.'); setFormStatus('error'); return
    }

    // Duplicate check (pre-scan, non-blocking on failure)
    if (!bypassDupeCheck.current) try {
      const mineRes  = await fetch(`${API_BASE}/api/v1/apps/mine?limit=100`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      const mineJson = await mineRes.json().catch(() => ({ data: { items: [] } })) as {
        data?: { items: Array<{ id: string; name: string; launchUrl: string | null }> }
      }
      const existing = mineJson.data?.items ?? []
      const normUrl  = launchUrl.trim().replace(/\/+$/, '').toLowerCase()
      const normName = name.trim().toLowerCase()
      const dupe = existing.find(a =>
        a.name.trim().toLowerCase() === normName ||
        (a.launchUrl && a.launchUrl.trim().replace(/\/+$/, '').toLowerCase() === normUrl && normUrl !== ''),
      )
      if (dupe) { setDuplicateApp({ id: dupe.id, name: dupe.name }); setFormStatus('duplicate'); return }
    } catch { /* non-fatal */ }
    bypassDupeCheck.current = false

    // From this point on the full-screen overlay owns the UI
    setFormStatus('scanning')
    setFormError('')
    const scanStart = Date.now()
    const auth = { Authorization: `Bearer ${accessToken}` }

    try {
      // Step 1 — create app
      const appRes  = await fetch(`${API_BASE}/api/v1/apps`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...auth },
        body: JSON.stringify({
          name, slug, tagline,
          ...(categoryId         ? { categoryId }   : {}),
          ...(description.trim() ? { description: description.trim() } : {}),
          ...(launchUrl          ? { launchUrl }    : {}),
          ...(primaryColor       ? { primaryColor } : {}),
        }),
      })
      const appJson = await appRes.json().catch(() => ({})) as {
        data?: { id: string }
        error?: { message?: string; details?: Record<string, string[]> }
        message?: string
      }
      if (!appRes.ok) {
        const d = appJson.error?.details
        throw new Error(
          d && Object.keys(d).length > 0
            ? Object.entries(d).map(([f, msgs]) => `${f}: ${msgs.join(', ')}`).join('\n')
            : (appJson.error?.message ?? appJson.message ?? `Error ${appRes.status}`)
        )
      }
      const appId = appJson.data?.id
      if (!appId) throw new Error('No app ID returned from server.')

      // Step 2 — logo (optional, non-blocking)
      if (logoFile) {
        const lf = new FormData(); lf.append('icon', logoFile)
        await fetch(`${API_BASE}/api/v1/apps/${appId}/icon`, {
          method: 'POST', headers: { ...auth }, body: lf,
        }).catch(() => {})
      }

      // Step 3 — screenshots
      const sf = new FormData()
      uploads.forEach(u => sf.append('screenshots', u.file))
      const ssRes  = await fetch(`${API_BASE}/api/v1/apps/${appId}/screenshots`, {
        method: 'POST', headers: { ...auth }, body: sf,
      })
      const ssJson = await ssRes.json().catch(() => ({})) as { error?: { message?: string }; message?: string }
      if (!ssRes.ok) throw new Error(ssJson.error?.message ?? ssJson.message ?? `Screenshot upload failed (${ssRes.status})`)

      // Step 4 — sentinel scan + publish (synchronous on backend, 5 s timeout)
      const subRes  = await fetch(`${API_BASE}/api/v1/apps/${appId}/submit`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', ...auth },
        body: '{}',
      })
      const subJson = await subRes.json().catch(() => ({})) as {
        success?: boolean
        autoPublished?: boolean
        app?: { id: string }
        error?: { message?: string; details?: string[] }
      }

      if (subRes.status === 422) {
        // Security scan rejected — show red shield overlay with threat list
        const threats = subJson.error?.details ?? []
        setRejectedThreats(threats.length > 0 ? threats : [subJson.error?.message ?? 'Submission rejected by security scan.'])
        setFormStatus('rejected')
        return
      }

      if (subRes.ok) {
        // Scan passed — hold the overlay for at least 3.5 s so the checklist fully animates
        const elapsed = Date.now() - scanStart
        if (elapsed < 3500) await new Promise<void>(r => setTimeout(r, 3500 - elapsed))
        setFormStatus('success')
        setTimeout(() => { window.location.href = '/dashboard' }, 1500)
        return
      }

      // Any other non-ok status — surface the error
      throw new Error(subJson.error?.message ?? `Submission failed (${subRes.status})`)

    } catch (err) {
      // Pre-publish errors (network, validation) go back to the form
      setFormStatus('error')
      setFormError(err instanceof Error ? err.message : 'Something went wrong.')
    }
  }

  // ── Full-screen overlay (scanning / success / rejected) ───────────────────
  const showOverlay = formStatus === 'scanning' || formStatus === 'success' || formStatus === 'rejected'

  return (
    <>
      {/* ── Full-Screen Security Overlay ──────────────────────────────────── */}
      {showOverlay && (
        <div className="fixed inset-0 z-[9999] overflow-hidden bg-stone-950">
          {/* Cyber grid */}
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.07]"
            style={{
              backgroundImage:
                'linear-gradient(rgba(20,184,166,0.8) 1px,transparent 1px),linear-gradient(90deg,rgba(20,184,166,0.8) 1px,transparent 1px)',
              backgroundSize: '40px 40px',
            }}
          />
          {/* Radial glow — transitions colour */}
          <div
            className="pointer-events-none absolute inset-0 transition-all duration-700"
            style={{
              background: formStatus === 'rejected'
                ? 'radial-gradient(ellipse 60% 50% at 50% 50%,rgba(239,68,68,0.12) 0%,transparent 70%)'
                : 'radial-gradient(ellipse 60% 50% at 50% 50%,rgba(20,184,166,0.12) 0%,transparent 70%)',
            }}
          />

          {/* ── Scanning Panel ── */}
          <div
            className="absolute inset-0 flex flex-col items-center justify-center gap-10 transition-opacity duration-500"
            style={{ opacity: formStatus === 'scanning' ? 1 : 0, pointerEvents: formStatus === 'scanning' ? 'auto' : 'none' }}
          >
            <div className="relative flex items-center justify-center">
              <div className="absolute h-52 w-52 rounded-full border border-teal-500/10 animate-ping" style={{ animationDuration: '2.5s' }} />
              <div className="absolute h-40 w-40 rounded-full border border-teal-500/20 animate-ping" style={{ animationDuration: '1.8s', animationDelay: '0.4s' }} />
              <div className="relative flex h-28 w-28 items-center justify-center rounded-full border-2 border-teal-500/50 bg-teal-950 overflow-hidden animate-security-glow">
                <ShieldCheck className="h-14 w-14 text-teal-400" />
                <div className="animate-scan-sweep absolute inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-teal-400 to-transparent" />
              </div>
            </div>

            <div className="text-center">
              <p className="text-3xl font-bold tracking-tight text-white">Scanning Your App...</p>
              <p className="mt-2 text-base font-semibold text-teal-400">Running Security Audit</p>
            </div>

            {/* Dynamic checklist */}
            <div className="flex w-64 flex-col gap-3">
              {([
                ['Connection Secure',  '700ms'],
                ['Code Analysis',      '1500ms'],
                ['Threat Detection',   '2500ms'],
                ['Final Verification', '3500ms'],
              ] as const).map(([label, delay], i) => (
                <div
                  key={label}
                  className="flex items-center gap-3 opacity-0 animate-fade-in"
                  style={{ animationDelay: `${i * 100}ms`, animationFillMode: 'forwards' }}
                >
                  <div className="relative h-5 w-5 shrink-0">
                    <div
                      className="absolute inset-0 flex items-center justify-center animate-fade-in"
                      style={{ animationDelay: delay, animationDirection: 'reverse', animationFillMode: 'both' }}
                    >
                      <Loader2 className="h-4 w-4 animate-spin text-stone-500" />
                    </div>
                    <div
                      className="absolute inset-0 flex items-center justify-center opacity-0 animate-fade-in"
                      style={{ animationDelay: delay, animationFillMode: 'forwards' }}
                    >
                      <CheckCircle2 className="h-4 w-4 text-teal-400" />
                    </div>
                  </div>
                  <span className="text-sm font-medium text-stone-300">{label}</span>
                </div>
              ))}
            </div>

            {/* Progress bar */}
            <div className="w-64 h-0.5 overflow-hidden rounded-full bg-stone-800">
              <div className="h-full rounded-full bg-gradient-to-r from-teal-600 to-teal-300 animate-scan-progress" style={{ animationDuration: '3.5s' }} />
            </div>
          </div>

          {/* ── Success Panel ── */}
          <div
            className="absolute inset-0 flex flex-col items-center justify-center gap-8 transition-opacity duration-500"
            style={{ opacity: formStatus === 'success' ? 1 : 0, pointerEvents: formStatus === 'success' ? 'auto' : 'none' }}
          >
            <div className="relative flex items-center justify-center">
              <div className="absolute h-60 w-60 rounded-full bg-teal-500/5 animate-ping" style={{ animationDuration: '2s' }} />
              <div className="absolute h-44 w-44 rounded-full" style={{ background: 'rgba(20,184,166,0.08)', filter: 'blur(24px)' }} />
              <div className="relative flex h-32 w-32 items-center justify-center rounded-full border-2 border-teal-400/50 bg-teal-950 animate-security-glow">
                <CheckCircle2 className="h-16 w-16 text-teal-400" />
              </div>
            </div>
            <div className="text-center max-w-xs">
              <p className="text-4xl font-bold text-white">You&apos;re Good to Go!</p>
              <p className="mt-4 text-sm font-light text-stone-400 leading-relaxed">
                Your app passed all 24 security checks.<br />Taking you to your dashboard...
              </p>
            </div>
          </div>

          {/* ── Rejected Panel ── */}
          <div
            className="absolute inset-0 flex flex-col items-center justify-center gap-7 px-6 transition-opacity duration-500"
            style={{ opacity: formStatus === 'rejected' ? 1 : 0, pointerEvents: formStatus === 'rejected' ? 'auto' : 'none' }}
          >
            <div className="relative flex items-center justify-center">
              <div className="absolute h-44 w-44 rounded-full border border-red-500/15 animate-ping" style={{ animationDuration: '2s' }} />
              <div className="flex h-28 w-28 items-center justify-center rounded-full border-2 border-red-500/50 bg-red-950 animate-shield-pulse-red">
                <ShieldAlert className="h-14 w-14 text-red-400" />
              </div>
            </div>
            <div className="text-center max-w-sm">
              <p className="text-3xl font-bold text-white">Security Review Required</p>
              <p className="mt-3 text-sm font-light text-stone-400 leading-relaxed">
                Our automated system flagged a few items that need your attention before we can publish.
              </p>
            </div>
            {rejectedThreats.length > 0 && (
              <div className="w-full max-w-sm overflow-hidden rounded-xl border border-red-900/50 bg-red-950/30 divide-y divide-red-900/30">
                {rejectedThreats.map((threat, i) => (
                  <div key={i} className="flex items-start gap-3 px-4 py-3">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
                    <span className="text-sm text-stone-300 leading-relaxed">{threat}</span>
                  </div>
                ))}
              </div>
            )}
            <button
              onClick={() => { setFormStatus('idle'); setFormError(''); setRejectedThreats([]) }}
              className="rounded-full bg-stone-800 px-8 py-3 text-sm font-semibold text-white transition-all hover:bg-stone-700 active:scale-95"
            >
              ← Back to Edit
            </button>
          </div>

        </div>
      )}

      {/* ── Page (always rendered behind overlay) ─────────────────────────── */}
      <div className="relative min-h-screen -mt-[88px] bg-[#FDFDF9]">

        {/* Cloud background */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{ background: 'linear-gradient(175deg,#adc8e8 0%,#c4d9f0 18%,#d6e7f5 40%,#e8f2fb 65%,#f4f9fd 85%,#FDFDF9 100%)' }}
          aria-hidden
        />
        <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 1440 900" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice" aria-hidden>
          <defs>
            <filter id="wc-a" x="-60%" y="-60%" width="220%" height="220%"><feTurbulence type="fractalNoise" baseFrequency="0.011 0.008" numOctaves="4" seed="3" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="90" xChannelSelector="R" yChannelSelector="G" result="d"/><feGaussianBlur in="d" stdDeviation="11"/></filter>
            <filter id="wc-b" x="-55%" y="-55%" width="210%" height="210%"><feTurbulence type="fractalNoise" baseFrequency="0.014 0.010" numOctaves="4" seed="7" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="70" xChannelSelector="R" yChannelSelector="G" result="d"/><feGaussianBlur in="d" stdDeviation="13"/></filter>
            <filter id="wc-c" x="-45%" y="-45%" width="190%" height="190%"><feTurbulence type="fractalNoise" baseFrequency="0.019 0.014" numOctaves="3" seed="11" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="48" xChannelSelector="R" yChannelSelector="G" result="d"/><feGaussianBlur in="d" stdDeviation="9"/></filter>
            <filter id="blur-depth"><feGaussianBlur stdDeviation="28"/></filter>
          </defs>
          <ellipse cx="155"  cy="310" rx="420" ry="330" fill="white" fillOpacity="0.72" filter="url(#wc-a)"/>
          <ellipse cx="50"   cy="155" rx="210" ry="170" fill="white" fillOpacity="0.58" filter="url(#wc-c)"/>
          <ellipse cx="310"  cy="180" rx="160" ry="120" fill="white" fillOpacity="0.42" filter="url(#wc-c)"/>
          <ellipse cx="1295" cy="230" rx="390" ry="315" fill="white" fillOpacity="0.66" filter="url(#wc-b)"/>
          <ellipse cx="1415" cy="410" rx="185" ry="155" fill="white" fillOpacity="0.48" filter="url(#wc-c)"/>
          <ellipse cx="1100" cy="120" rx="170" ry="130" fill="white" fillOpacity="0.38" filter="url(#wc-c)"/>
          <ellipse cx="720"  cy="840" rx="540" ry="175" fill="white" fillOpacity="0.40" filter="url(#wc-a)"/>
          <ellipse cx="100"  cy="680" rx="310" ry="195" fill="#7ab0d8" fillOpacity="0.28" filter="url(#blur-depth)"/>
          <ellipse cx="1370" cy="590" rx="270" ry="175" fill="#7ab0d8" fillOpacity="0.22" filter="url(#blur-depth)"/>
          <ellipse cx="870"  cy="500" rx="225" ry="145" fill="white"   fillOpacity="0.26" filter="url(#wc-c)"/>
        </svg>

        <div className="relative z-10 flex min-h-screen flex-col items-center px-4 pb-20 pt-36 sm:px-6">

          <div className="mb-8 w-full max-w-4xl">
            <Link href="/" className="inline-flex items-center gap-1.5 text-sm font-medium text-stone-500 hover:text-stone-800 transition-colors">
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Link>
          </div>

          <div className={cn('w-full max-w-4xl rounded-3xl overflow-hidden', 'bg-white/80 backdrop-blur-xl', 'border border-white/60', 'shadow-[0_32px_80px_-8px_rgba(0,0,0,0.18)]')}>

            <div className="h-1 w-full transition-colors duration-500" style={{ background: primaryColor ?? 'linear-gradient(90deg,#0EA5E9,#14b8a6)' }} />

            <div className="px-8 sm:px-10 pt-10 pb-8">
              <div className="flex items-center gap-3 mb-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 to-teal-400 shadow-md shadow-sky-200/60">
                  <Rocket className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-black text-slate-900">Launch Your App</h1>
                  <p className="text-sm text-slate-400 font-normal">Share your creation with the world — it only takes a minute.</p>
                </div>
              </div>
            </div>

            <div className="h-px bg-stone-100/80" />

            {!user ? (
              <div className="flex flex-col items-center justify-center gap-6 px-10 py-24 text-center">
                <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-sky-50 border border-sky-100">
                  <LogIn className="h-9 w-9 text-sky-500" />
                </div>
                <div>
                  <p className="text-lg font-black text-slate-900">Sign in to launch</p>
                  <p className="mt-2 text-sm text-slate-400 max-w-sm">You need to be signed in to share your app with the community.</p>
                </div>
                <Link href="/sign-in" className="btn-primary">
                  Sign In
                </Link>
              </div>

            ) : formStatus === 'duplicate' && duplicateApp ? (
              <div className="flex flex-col items-center justify-center gap-6 px-10 py-24 text-center">
                <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-amber-50 border border-amber-100">
                  <AlertCircle className="h-9 w-9 text-amber-500" />
                </div>
                <div>
                  <p className="text-lg font-black text-slate-900">Already launched</p>
                  <p className="mt-2 text-sm text-slate-400 max-w-sm">
                    You&apos;ve already submitted <strong className="font-semibold text-slate-700">{duplicateApp.name}</strong>. Would you like to view it instead?
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={async () => {
                      bypassDupeCheck.current = true
                      setDuplicateApp(null); setFormStatus('idle')
                      await handleSubmit({ preventDefault: () => {} } as React.FormEvent)
                    }}
                    className="px-6 py-2.5 text-sm font-medium text-slate-500 rounded-2xl hover:bg-slate-100 transition-colors"
                  >
                    Submit anyway
                  </button>
                  <Link href={`/apps/${duplicateApp.id}`} className="btn-primary">
                    View app
                  </Link>
                </div>
              </div>

            ) : (
              /* ── Form — always shown; overlay covers it during scan ── */
              <form onSubmit={handleSubmit} className="flex flex-col gap-0 px-8 sm:px-10 pb-10">

                {/* ── Step 1: Identity ── */}
                <FormSection step={1} title="App Identity" subtitle="Logo and brand color">
                  <div className="flex items-start gap-8">
                    <div className="flex flex-col items-center gap-2 shrink-0">
                      <p className={sectionLabel}>Logo</p>
                      <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
                      <button
                        type="button"
                        onClick={() => logoInputRef.current?.click()}
                        className="group relative h-[100px] w-[100px] overflow-hidden rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/80 hover:border-sky-400 transition-all"
                        style={primaryColor ? { borderColor: `${primaryColor}70` } : undefined}
                        title="Upload app logo"
                      >
                        {logoPreview ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={logoPreview} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full w-full flex-col items-center justify-center gap-1.5" style={primaryColor ? { background: `${primaryColor}12` } : undefined}>
                            <Camera className="h-7 w-7 text-slate-300 group-hover:text-sky-500 transition-colors" />
                            <span className="text-[10px] font-medium text-slate-300 group-hover:text-sky-500 transition-colors">Upload</span>
                          </div>
                        )}
                        {logoPreview && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/25 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Camera className="h-5 w-5 text-white" />
                          </div>
                        )}
                      </button>
                      {logoPreview && (
                        <button type="button" onClick={() => { URL.revokeObjectURL(logoPreview); setLogoFile(null); setLogoPreview(null) }} className="text-[10px] text-slate-400 hover:text-red-500 transition-colors">
                          Remove
                        </button>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className={cn(sectionLabel, 'mb-4')}>Brand Colour</p>
                      <div className="grid grid-cols-6 gap-2.5">
                        {PALETTE.map(({ hex, label }) => (
                          <button
                            key={hex} type="button" title={label}
                            onClick={() => setPrimaryColor(c => c === hex ? null : hex)}
                            className={cn('h-9 w-full rounded-xl transition-all hover:scale-105 active:scale-95', primaryColor === hex && 'ring-2 ring-offset-2 ring-slate-400 scale-105')}
                            style={{ background: hex }} aria-pressed={primaryColor === hex} aria-label={label}
                          />
                        ))}
                      </div>
                      {primaryColor && (
                        <button type="button" onClick={() => setPrimaryColor(null)} className="mt-2.5 text-[10px] text-slate-400 hover:text-slate-600 transition-colors">
                          Clear colour
                        </button>
                      )}
                    </div>
                  </div>
                </FormSection>

                {/* ── Step 2: Screenshots ── */}
                <FormSection step={2} title="Screenshots" subtitle="At least one required · max 4">
                  <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={e => addFiles(e.target.files)} />
                  {uploads.length === 0 ? (
                    <button
                      type="button" onClick={() => fileInputRef.current?.click()}
                      onDrop={onDrop} onDragOver={onDragOver} onDragLeave={onDragLeave}
                      className={cn('flex w-full flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed py-14 text-center transition-all',
                        isDragging ? 'border-sky-400 bg-sky-50/60 scale-[0.995]' : 'border-slate-200/80 bg-slate-50/40 hover:border-sky-300 hover:bg-sky-50/30')}
                    >
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-50 border border-sky-100">
                        <Upload className="h-6 w-6 text-sky-500" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-700">Drop images here or <span className="text-sky-500">browse</span></p>
                        <p className="mt-1 text-xs text-slate-400">PNG, JPG up to 15 MB · max 4 files</p>
                      </div>
                    </button>
                  ) : (
                    <div className="grid grid-cols-4 gap-3">
                      {uploads.map((u, i) => (
                        <div key={i} className="relative aspect-[9/16] overflow-hidden rounded-xl border border-slate-200/80 bg-slate-50">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={u.preview} alt="" className="h-full w-full object-cover" />
                          <button type="button" onClick={() => removeFile(i)} className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors" aria-label="Remove">
                            <X className="h-2.5 w-2.5" />
                          </button>
                        </div>
                      ))}
                      {uploads.length < MAX_FILES && (
                        <button type="button" onClick={() => fileInputRef.current?.click()} className="flex aspect-[9/16] flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/60 text-slate-400 transition-all hover:border-sky-300 hover:bg-sky-50/30">
                          <ImagePlus className="h-5 w-5" />
                          <span className="text-[10px] font-medium">Add</span>
                        </button>
                      )}
                    </div>
                  )}
                </FormSection>

                {/* ── Step 3: Details ── */}
                <FormSection step={3} title="App Details" subtitle="Tell people what you built">
                  <div className="flex flex-col gap-5">
                    <div className="grid grid-cols-2 gap-5">
                      <Field label="App Name" required>
                        <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="My Awesome App" maxLength={100} required className={inputCls} />
                      </Field>
                      <Field label="Slug" hint="Auto-generated · editable" required>
                        <input type="text" value={slug} onChange={e => { setSlug(e.target.value); setSlugTouched(true) }} placeholder="my-awesome-app" maxLength={100} pattern="^[a-z0-9]+(?:-[a-z0-9]+)*$" title="Lowercase letters, numbers, and hyphens only" required className={inputCls} />
                      </Field>
                    </div>
                    <Field label="Tagline" required>
                      <input type="text" value={tagline} onChange={e => setTagline(e.target.value)} placeholder="One sentence describing your app" maxLength={200} required className={inputCls} />
                    </Field>
                    <div className="grid grid-cols-2 gap-5">
                      <Field label="App Link" hint="Live URL to try your app" required>
                        <input type="url" value={launchUrl} onChange={e => setLaunchUrl(e.target.value)} placeholder="https://myapp.vercel.app" required className={inputCls} />
                      </Field>
                      <Field label="Category" required>
                        <select value={categoryId} onChange={e => setCategoryId(e.target.value)} required className={cn(inputCls, 'cursor-pointer')}>
                          <option value="" disabled>Select…</option>
                          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                      </Field>
                    </div>
                    <Field label="Description">
                      <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="What does your app do? Who is it for?" maxLength={5000} rows={4} className={cn(inputCls, 'resize-y')} />
                      <p className="mt-1 text-right text-[10px] text-slate-400">{description.length} / 5000</p>
                    </Field>
                  </div>
                </FormSection>

                {/* Inline error */}
                {formStatus === 'error' && (
                  <div className="mx-0 mb-6 flex items-start gap-3 rounded-2xl border border-red-200/80 bg-red-50/80 px-5 py-4 text-sm text-red-600">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                    <span className="whitespace-pre-line">{formError}</span>
                  </div>
                )}

                {/* Submit */}
                <div className="flex items-center justify-between pt-2 pb-2">
                  <Link href="/" className="text-sm font-medium text-slate-400 hover:text-slate-600 transition-colors">Cancel</Link>
                  <button
                    type="submit"
                    disabled={formStatus === 'scanning'}
                    className="inline-flex items-center gap-2 rounded-2xl px-8 py-3.5 text-sm font-bold text-white shadow-lg transition-all duration-200 hover:-translate-y-px hover:shadow-xl active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none"
                    style={{
                      background: primaryColor ? `linear-gradient(135deg, ${primaryColor}, ${primaryColor}cc)` : 'linear-gradient(135deg, #0EA5E9, #14B8A6)',
                      boxShadow: `0 8px 24px -4px ${primaryColor ?? '#0EA5E9'}55`,
                    }}
                  >
                    <Loader2 className={cn('h-4 w-4 animate-spin', formStatus !== 'scanning' && 'hidden')} />
                    {formStatus === 'scanning' ? 'Running Security Audit…' : '🚀 Launch App'}
                  </button>
                </div>
              </form>
            )}
          </div>

          <div className="h-16" />
        </div>
      </div>
    </>
  )
}

function FormSection({ step, title, subtitle, children }: {
  step: number; title: string; subtitle: string; children: React.ReactNode
}) {
  return (
    <div className="py-8 border-b border-slate-100/80 last:border-0">
      <div className="flex items-center gap-3 mb-6">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-sky-500 to-teal-400 text-xs font-black text-white shadow-sm">
          {step}
        </div>
        <div>
          <p className="text-sm font-black text-slate-900">{title}</p>
          <p className="text-[11px] text-slate-400">{subtitle}</p>
        </div>
      </div>
      {children}
    </div>
  )
}

function Field({ label, hint, required, children }: { label: string; hint?: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold text-slate-500">
        {label}{required && <span className="ml-0.5 text-sky-500">*</span>}
      </label>
      {hint && <p className="text-[10px] text-slate-400 -mt-0.5">{hint}</p>}
      {children}
    </div>
  )
}

const sectionLabel = 'text-[11px] font-bold uppercase tracking-wider text-slate-400'

const inputCls =
  'w-full rounded-xl border border-slate-200/80 bg-white/60 px-4 py-3 text-sm text-slate-800 ' +
  'placeholder:text-slate-300 outline-none transition-all duration-150 ' +
  'focus:border-sky-400/70 focus:bg-white focus:ring-2 focus:ring-sky-400/15'
