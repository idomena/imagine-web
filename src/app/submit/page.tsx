'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  CheckCircle, AlertCircle, Loader2, Upload, ImagePlus, LogIn, Camera, ArrowLeft, X,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/context/AuthContext'

// ---------------------------------------------------------------------------
// /submit page — dedicated submission flow
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

type FormStatus = 'idle' | 'loading' | 'success' | 'error' | 'duplicate'

interface UploadedFile {
  file:    File
  preview: string
}

function toSlug(name: string) {
  return name.toLowerCase().trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 100)
}

export default function SubmitPage() {
  const { user, accessToken } = useAuth()
  const router = useRouter()

  // ── Logo state ─────────────────────────────────────────────────────────────
  const [logoFile,    setLogoFile]    = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const logoInputRef = useRef<HTMLInputElement>(null)

  // ── Screenshots state ──────────────────────────────────────────────────────
  const [uploads,    setUploads]    = useState<UploadedFile[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // ── Form state ─────────────────────────────────────────────────────────────
  const [name,         setName]         = useState('')
  const [slug,         setSlug]         = useState('')
  const [slugTouched,  setSlugTouched]  = useState(false)
  const [tagline,      setTagline]      = useState('')
  const [description,  setDescription]  = useState('')
  const [launchUrl,    setLaunchUrl]    = useState('')
  const [categoryId,   setCategoryId]   = useState('')
  const [primaryColor, setPrimaryColor] = useState<string | null>(null)
  const [formStatus,    setFormStatus]    = useState<FormStatus>('idle')
  const [formError,     setFormError]     = useState('')
  const [duplicateApp,  setDuplicateApp]  = useState<{ id: string; name: string } | null>(null)
  const [autoPublished, setAutoPublished] = useState(false)
  const [categories,   setCategories]   = useState<{ id: string; name: string }[]>([])

  const bypassDupeCheck = useRef(false)

  // Fetch categories once
  useEffect(() => {
    fetch(`${API_BASE}/api/v1/categories`)
      .then(r => r.json())
      .then((json: { data?: { id: string; name: string }[] }) => {
        setCategories(json.data ?? [])
      })
      .catch(() => {})
  }, [])

  // Auto-derive slug from name
  useEffect(() => {
    if (!slugTouched) setSlug(toSlug(name))
  }, [name, slugTouched])

  // ── Logo file pick ─────────────────────────────────────────────────────────

  function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (logoPreview) URL.revokeObjectURL(logoPreview)
    setLogoFile(file)
    setLogoPreview(URL.createObjectURL(file))
    e.target.value = ''
  }

  // ── Screenshots ────────────────────────────────────────────────────────────

  function addFiles(incoming: FileList | null) {
    if (!incoming) return
    const imageFiles = Array.from(incoming).filter(f => f.type.startsWith('image/'))
    setUploads(prev => {
      const combined = [...prev, ...imageFiles.map(file => ({
        file,
        preview: URL.createObjectURL(file),
      }))]
      return combined.slice(0, MAX_FILES)
    })
  }

  const onDrop = useCallback((e: React.DragEvent) => {
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

  // ── Submit ─────────────────────────────────────────────────────────────────

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (uploads.length === 0) {
      setFormError('Please upload at least one screenshot.'); setFormStatus('error'); return
    }
    if (!accessToken) {
      setFormError('You must be signed in to submit an app.'); setFormStatus('error'); return
    }

    // Duplicate check
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
      if (dupe) {
        setDuplicateApp({ id: dupe.id, name: dupe.name })
        setFormStatus('duplicate'); return
      }
    } catch { /* non-fatal */ }
    bypassDupeCheck.current = false

    setFormStatus('loading'); setFormError('')
    const authHeader = { Authorization: `Bearer ${accessToken}` }

    try {
      // Step 1 — create app
      const appRes = await fetch(`${API_BASE}/api/v1/apps`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', ...authHeader },
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
        const details = appJson.error?.details
        if (details && Object.keys(details).length > 0) {
          throw new Error(
            Object.entries(details).map(([f, msgs]) => `${f}: ${msgs.join(', ')}`).join('\n')
          )
        }
        throw new Error(appJson.error?.message ?? appJson.message ?? `Error ${appRes.status}`)
      }

      const appId = appJson.data?.id
      if (!appId) throw new Error('No app ID returned from server.')

      // Step 2 — upload logo (optional)
      if (logoFile) {
        const logoForm = new FormData()
        logoForm.append('icon', logoFile)
        await fetch(`${API_BASE}/api/v1/apps/${appId}/icon`, {
          method: 'POST', headers: { ...authHeader }, body: logoForm,
        }).catch(() => {})
      }

      // Step 3 — upload screenshots
      const form = new FormData()
      uploads.forEach(u => form.append('screenshots', u.file))
      const screenshotRes = await fetch(`${API_BASE}/api/v1/apps/${appId}/screenshots`, {
        method: 'POST', headers: { ...authHeader }, body: form,
      })
      const screenshotJson = await screenshotRes.json().catch(() => ({})) as {
        error?: { message?: string }; message?: string
      }
      if (!screenshotRes.ok) {
        throw new Error(
          screenshotJson.error?.message ?? screenshotJson.message ?? `Screenshot upload failed (${screenshotRes.status})`
        )
      }

      // Step 4 — submit for review + security audit (waits for result)
      const submitRes  = await fetch(`${API_BASE}/api/v1/apps/${appId}/submit`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeader },
      })
      const submitJson = await submitRes.json().catch(() => ({})) as {
        success?: boolean
        autoPublished?: boolean
        error?: { message?: string; details?: string[] }
      }
      if (submitRes.status === 422) {
        // Security scan rejected the app — surface the reason to the user
        const detail = submitJson.error?.details?.join(' ') ?? submitJson.error?.message ?? 'Submission rejected by security scan.'
        throw new Error(detail)
      }
      // For any other non-OK response (timeout, server error), don't block —
      // the app stays in SUBMITTED for manual review.
      setAutoPublished(submitJson.autoPublished === true)
      setFormStatus('success')
    } catch (err) {
      setFormStatus('error')
      setFormError(err instanceof Error ? err.message : 'Something went wrong.')
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="relative min-h-screen -mt-[88px] bg-[#FDFDF9]">

      {/* ── Cloud background ─────────────────────────────────────────────────── */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: 'linear-gradient(175deg, #adc8e8 0%, #c4d9f0 18%, #d6e7f5 40%, #e8f2fb 65%, #f4f9fd 85%, #FDFDF9 100%)',
        }}
        aria-hidden
      />

      <svg
        className="pointer-events-none absolute inset-0 h-full w-full"
        viewBox="0 0 1440 900"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden
      >
        <defs>
          <filter id="wc-a" x="-60%" y="-60%" width="220%" height="220%">
            <feTurbulence type="fractalNoise" baseFrequency="0.011 0.008" numOctaves="4" seed="3" result="n"/>
            <feDisplacementMap in="SourceGraphic" in2="n" scale="90" xChannelSelector="R" yChannelSelector="G" result="d"/>
            <feGaussianBlur in="d" stdDeviation="11"/>
          </filter>
          <filter id="wc-b" x="-55%" y="-55%" width="210%" height="210%">
            <feTurbulence type="fractalNoise" baseFrequency="0.014 0.010" numOctaves="4" seed="7" result="n"/>
            <feDisplacementMap in="SourceGraphic" in2="n" scale="70" xChannelSelector="R" yChannelSelector="G" result="d"/>
            <feGaussianBlur in="d" stdDeviation="13"/>
          </filter>
          <filter id="wc-c" x="-45%" y="-45%" width="190%" height="190%">
            <feTurbulence type="fractalNoise" baseFrequency="0.019 0.014" numOctaves="3" seed="11" result="n"/>
            <feDisplacementMap in="SourceGraphic" in2="n" scale="48" xChannelSelector="R" yChannelSelector="G" result="d"/>
            <feGaussianBlur in="d" stdDeviation="9"/>
          </filter>
          <filter id="blur-depth">
            <feGaussianBlur stdDeviation="28"/>
          </filter>
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

      {/* ── Page content ─────────────────────────────────────────────────────── */}
      <div className="relative z-10 flex min-h-screen flex-col items-center px-4 pb-20 pt-36 sm:px-6">

        {/* Back link */}
        <div className="mb-8 w-full max-w-4xl">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-stone-500 hover:text-stone-800 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>
        </div>

        {/* Frosted glass container */}
        <div className={cn(
          'w-full max-w-4xl rounded-3xl overflow-hidden',
          'bg-white/80 backdrop-blur-xl',
          'border border-white/60',
          'shadow-[0_32px_80px_-8px_rgba(0,0,0,0.18)]',
        )}>

          {/* Colour accent strip */}
          <div
            className="h-[3px] w-full transition-colors duration-500"
            style={{ background: primaryColor ?? 'linear-gradient(90deg,#2D8B7A,#14b8a6)' }}
          />

          {/* Header */}
          <div className="px-10 pt-10 pb-8">
            <h1 className="text-2xl font-bold text-stone-900">Submit Your App</h1>
            <p className="mt-1.5 text-sm font-light text-stone-400">
              Share your creation with the community — it only takes a minute.
            </p>
          </div>

          <div className="h-px bg-stone-100/80" />

          {/* Body */}
          {!user ? (

            /* ── Not signed in ────────────────────────────────────────────── */
            <div className="flex flex-col items-center justify-center gap-6 px-10 py-24 text-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-teal-50 border border-teal-100">
                <LogIn className="h-9 w-9 text-teal-600" />
              </div>
              <div>
                <p className="text-lg font-semibold text-stone-900">Sign in to submit</p>
                <p className="mt-2 text-sm font-light text-stone-400 max-w-sm">
                  You need to be signed in to share your app with the community.
                </p>
              </div>
              <Link
                href="/sign-in"
                className="inline-flex items-center gap-2 rounded-full bg-teal-700 px-10 py-3.5 text-sm font-semibold text-white shadow-lg shadow-teal-700/20 hover:bg-teal-600 transition-all active:scale-95"
              >
                Sign In
              </Link>
            </div>

          ) : formStatus === 'duplicate' && duplicateApp ? (

            /* ── Duplicate ────────────────────────────────────────────────── */
            <div className="flex flex-col items-center justify-center gap-6 px-10 py-24 text-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-amber-50 border border-amber-100">
                <AlertCircle className="h-9 w-9 text-amber-500" />
              </div>
              <div>
                <p className="text-lg font-semibold text-stone-900">Already submitted</p>
                <p className="mt-2 text-sm font-light text-stone-400 max-w-sm">
                  You&apos;ve already submitted{' '}
                  <strong className="font-medium text-stone-700">{duplicateApp.name}</strong>.
                  Would you like to view it instead?
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={async () => {
                    bypassDupeCheck.current = true
                    setDuplicateApp(null); setFormStatus('idle')
                    await handleSubmit({ preventDefault: () => {} } as React.FormEvent)
                  }}
                  className="px-6 py-2.5 text-sm font-medium text-stone-500 rounded-full hover:bg-stone-100 transition-colors"
                >
                  Submit anyway
                </button>
                <Link
                  href={`/apps/${duplicateApp.id}`}
                  className="inline-flex items-center gap-2 rounded-full bg-teal-700 px-10 py-3.5 text-sm font-semibold text-white shadow-lg shadow-teal-700/20 hover:bg-teal-600 transition-all active:scale-95"
                >
                  View app
                </Link>
              </div>
            </div>

          ) : formStatus === 'success' ? (

            /* ── Success ──────────────────────────────────────────────────── */
            <div className="flex flex-col items-center justify-center gap-6 px-10 py-24 text-center">
              <div
                className="flex h-24 w-24 items-center justify-center rounded-full"
                style={{
                  background: primaryColor ? `${primaryColor}18` : '#f0fdf9',
                  border:     `2px solid ${primaryColor ?? '#14b8a6'}35`,
                }}
              >
                <CheckCircle className="h-11 w-11" style={{ color: primaryColor ?? '#0d9488' }} />
              </div>
              <div>
                <p className="text-2xl font-bold text-stone-900">
                  {autoPublished ? 'You\'re Live!' : 'App Submitted!'}
                </p>
                <p className="mt-2 text-sm font-light text-stone-400">
                  {autoPublished
                    ? 'Your app passed security check and is now LIVE!'
                    : 'Your app is under review. We\'ll let you know when it\'s published.'}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    setFormStatus('idle')
                    setName(''); setSlug(''); setTagline(''); setDescription('')
                    setLaunchUrl(''); setCategoryId(''); setPrimaryColor(null)
                    setLogoFile(null); setLogoPreview(null); setUploads([])
                    setSlugTouched(false); bypassDupeCheck.current = false
                  }}
                  className="px-6 py-2.5 text-sm font-medium text-stone-500 rounded-full hover:bg-stone-100 transition-colors"
                >
                  Submit another
                </button>
                <Link
                  href="/"
                  className="inline-flex items-center gap-2 rounded-full bg-teal-700 px-10 py-3.5 text-sm font-semibold text-white shadow-lg shadow-teal-700/20 hover:bg-teal-600 transition-all active:scale-95"
                >
                  Back to Home
                </Link>
              </div>
            </div>

          ) : (

            /* ── Form ─────────────────────────────────────────────────────── */
            <form onSubmit={handleSubmit} className="flex flex-col gap-8 px-10 py-10">

              {/* ── Logo + Colour ────────────────────────────────────────── */}
              <div className="flex items-start gap-8">

                {/* Logo picker */}
                <div className="flex flex-col items-center gap-2 shrink-0">
                  <p className={sectionLabel}>App Logo</p>
                  <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
                  <button
                    type="button"
                    onClick={() => logoInputRef.current?.click()}
                    className="group relative h-[100px] w-[100px] overflow-hidden rounded-2xl border-2 border-dashed border-stone-200 bg-stone-50/80 hover:border-teal-400 transition-all"
                    style={primaryColor ? { borderColor: `${primaryColor}70` } : undefined}
                    title="Upload app logo"
                  >
                    {logoPreview ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={logoPreview} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div
                        className="flex h-full w-full flex-col items-center justify-center gap-1.5"
                        style={primaryColor ? { background: `${primaryColor}12` } : undefined}
                      >
                        <Camera className="h-7 w-7 text-stone-300 group-hover:text-teal-500 transition-colors" />
                        <span className="text-[10px] font-medium text-stone-300 group-hover:text-teal-500 transition-colors">Upload</span>
                      </div>
                    )}
                    {logoPreview && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/25 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Camera className="h-5 w-5 text-white" />
                      </div>
                    )}
                  </button>
                  {logoPreview && (
                    <button
                      type="button"
                      onClick={() => { URL.revokeObjectURL(logoPreview); setLogoFile(null); setLogoPreview(null) }}
                      className="text-[10px] text-stone-400 hover:text-red-500 transition-colors"
                    >
                      Remove
                    </button>
                  )}
                </div>

                {/* Colour palette */}
                <div className="flex-1 min-w-0">
                  <p className={cn(sectionLabel, 'mb-4')}>Brand Colour</p>
                  <div className="grid grid-cols-6 gap-2.5">
                    {PALETTE.map(({ hex, label }) => (
                      <button
                        key={hex}
                        type="button"
                        title={label}
                        onClick={() => setPrimaryColor(c => c === hex ? null : hex)}
                        className={cn(
                          'h-9 w-full rounded-xl transition-all hover:scale-105 active:scale-95',
                          primaryColor === hex && 'ring-2 ring-offset-2 ring-stone-400 scale-105',
                        )}
                        style={{ background: hex }}
                        aria-pressed={primaryColor === hex}
                        aria-label={label}
                      />
                    ))}
                  </div>
                  {primaryColor && (
                    <button
                      type="button"
                      onClick={() => setPrimaryColor(null)}
                      className="mt-2.5 text-[10px] text-stone-400 hover:text-stone-600 transition-colors"
                    >
                      Clear colour
                    </button>
                  )}
                </div>
              </div>

              {/* ── Screenshots ─────────────────────────────────────────────── */}
              <div>
                <p className={cn(sectionLabel, 'mb-4')}>
                  Screenshots <span className="ml-1 text-teal-600 normal-case tracking-normal font-normal text-xs">* required</span>
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={e => addFiles(e.target.files)}
                />
                {uploads.length === 0 ? (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    onDrop={onDrop} onDragOver={onDragOver} onDragLeave={onDragLeave}
                    className={cn(
                      'flex w-full flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed py-14 text-center transition-all',
                      isDragging
                        ? 'border-teal-400 bg-teal-50/60 scale-[0.995]'
                        : 'border-stone-200/80 bg-stone-50/40 hover:border-teal-300 hover:bg-teal-50/30',
                    )}
                  >
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-teal-50 border border-teal-100">
                      <Upload className="h-6 w-6 text-teal-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-stone-700">
                        Drop images here or <span className="text-teal-600">browse</span>
                      </p>
                      <p className="mt-1 text-xs font-light text-stone-400">PNG, JPG up to 15 MB · max 4 files</p>
                    </div>
                  </button>
                ) : (
                  <div className="grid grid-cols-4 gap-3">
                    {uploads.map((u, i) => (
                      <div key={i} className="relative aspect-[9/16] overflow-hidden rounded-xl border border-stone-200/80 bg-stone-50">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={u.preview} alt="" className="h-full w-full object-cover" />
                        <button
                          type="button"
                          onClick={() => removeFile(i)}
                          className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
                          aria-label="Remove"
                        >
                          <X className="h-2.5 w-2.5" />
                        </button>
                      </div>
                    ))}
                    {uploads.length < MAX_FILES && (
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="flex aspect-[9/16] flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-stone-200 bg-stone-50/60 text-stone-400 transition-all hover:border-teal-300 hover:bg-teal-50/30"
                      >
                        <ImagePlus className="h-5 w-5" />
                        <span className="text-[10px] font-medium">Add</span>
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* ── App Details ──────────────────────────────────────────────── */}
              <div>
                <p className={cn(sectionLabel, 'mb-6')}>App Details</p>

                <div className="flex flex-col gap-5">

                  {/* Name + Slug */}
                  <div className="grid grid-cols-2 gap-5">
                    <Field label="App Name" required>
                      <input
                        type="text" value={name} onChange={e => setName(e.target.value)}
                        placeholder="My Awesome App" maxLength={100} required
                        className={inputCls}
                      />
                    </Field>
                    <Field label="Slug" hint="Auto-generated · editable" required>
                      <input
                        type="text" value={slug}
                        onChange={e => { setSlug(e.target.value); setSlugTouched(true) }}
                        placeholder="my-awesome-app" maxLength={100}
                        pattern="^[a-z0-9]+(?:-[a-z0-9]+)*$"
                        title="Lowercase letters, numbers, and hyphens only"
                        required className={inputCls}
                      />
                    </Field>
                  </div>

                  {/* Tagline */}
                  <Field label="Tagline" required>
                    <input
                      type="text" value={tagline} onChange={e => setTagline(e.target.value)}
                      placeholder="One sentence describing your app" maxLength={200}
                      required className={inputCls}
                    />
                  </Field>

                  {/* App Link + Category */}
                  <div className="grid grid-cols-2 gap-5">
                    <Field label="App Link" hint="Live URL to try your app" required>
                      <input
                        type="url" value={launchUrl} onChange={e => setLaunchUrl(e.target.value)}
                        placeholder="https://myapp.vercel.app" required
                        className={inputCls}
                      />
                    </Field>
                    <Field label="Category" required>
                      <select
                        value={categoryId}
                        onChange={e => setCategoryId(e.target.value)}
                        required
                        className={cn(inputCls, 'cursor-pointer')}
                      >
                        <option value="" disabled>Select…</option>
                        {categories.map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </Field>
                  </div>

                  {/* Description */}
                  <Field label="Description">
                    <textarea
                      value={description} onChange={e => setDescription(e.target.value)}
                      placeholder="What does your app do? Who is it for?" maxLength={5000}
                      rows={4} className={cn(inputCls, 'resize-y')}
                    />
                    <p className="mt-1 text-right text-[10px] text-stone-400">{description.length} / 5000</p>
                  </Field>
                </div>
              </div>

              {/* Error banner */}
              {formStatus === 'error' && (
                <div className="flex items-start gap-3 rounded-xl border border-red-200/80 bg-red-50/80 px-5 py-4 text-sm text-red-600">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span className="whitespace-pre-line font-light">{formError}</span>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-between pt-2 pb-2">
                <Link
                  href="/"
                  className="text-sm font-medium text-stone-400 hover:text-stone-600 transition-colors"
                >
                  Cancel
                </Link>
                <button
                  type="submit"
                  disabled={formStatus === 'loading'}
                  className="inline-flex items-center gap-2 rounded-full px-10 py-3.5 text-sm font-semibold text-white shadow-lg transition-all duration-200 hover:-translate-y-px active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none"
                  style={{
                    backgroundColor: primaryColor ?? '#0f766e',
                    boxShadow: `0 8px 24px -4px ${primaryColor ?? '#0f766e'}40`,
                  }}
                >
                  {formStatus === 'loading'
                    ? <><Loader2 className="h-4 w-4 animate-spin" /> We are checking your app security...</>
                    : 'Submit App'
                  }
                </button>
              </div>

            </form>
          )}
        </div>

        {/* Bottom padding */}
        <div className="h-16" />
      </div>
    </div>
  )
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function Field({
  label, hint, required, children,
}: {
  label: string; hint?: string; required?: boolean; children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium text-stone-500">
        {label}{required && <span className="ml-0.5 text-teal-500">*</span>}
      </label>
      {hint && <p className="text-[10px] font-light text-stone-400 -mt-0.5">{hint}</p>}
      {children}
    </div>
  )
}

const sectionLabel = 'text-[11px] font-semibold uppercase tracking-wider text-stone-400'

const inputCls =
  'w-full rounded-xl border border-stone-200/80 bg-white/60 px-4 py-3 text-sm text-stone-800 ' +
  'placeholder:text-stone-300 placeholder:font-light outline-none transition-all duration-150 ' +
  'focus:border-teal-400/70 focus:bg-white focus:ring-2 focus:ring-teal-400/15'
