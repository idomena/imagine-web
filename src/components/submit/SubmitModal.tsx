'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import {
  X, CheckCircle, CheckCircle2, AlertCircle, ShieldAlert, Loader2, Upload, ImagePlus, LogIn, Camera, ShieldCheck,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/context/AuthContext'

// ---------------------------------------------------------------------------
// SubmitModal — manual submission flow
//
//  1. Upload App Logo (circular, optional)
//  2. Pick a brand colour (preset palette)
//  3. Fill in Name / Slug / Tagline / Description / App Link
//  4. Upload 1–4 screenshots
//  5. On submit:
//     a. POST /api/v1/apps                → create app, get appId
//     b. POST /api/v1/apps/:id/icon       → upload logo (if provided)
//     c. POST /api/v1/apps/:id/screenshots → upload screenshots
// ---------------------------------------------------------------------------

const API_BASE  = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080'
const MAX_FILES = 4

// Brand colour presets
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

interface Props {
  open:    boolean
  onClose: () => void
}

type FormStatus = 'idle' | 'loading' | 'scanning' | 'success' | 'error' | 'duplicate' | 'rejected'

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

// ── Client-side category keyword detection ────────────────────────────────────

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

// ── Component ──────────────────────────────────────────────────────────────────

export function SubmitModal({ open, onClose }: Props) {
  const { user, accessToken } = useAuth()

  // ── Logo state ─────────────────────────────────────────────────────────────
  const [logoFile,    setLogoFile]    = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const logoInputRef = useRef<HTMLInputElement>(null)

  // ── Screenshots state ──────────────────────────────────────────────────────
  const [uploads,    setUploads]    = useState<UploadedFile[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // ── Form state ─────────────────────────────────────────────────────────────
  const [name,            setName]            = useState('')
  const [slug,            setSlug]            = useState('')
  const [slugTouched,     setSlugTouched]     = useState(false)
  const [tagline,         setTagline]         = useState('')
  const [description,     setDescription]     = useState('')
  const [launchUrl,       setLaunchUrl]       = useState('')
  const [categoryId,      setCategoryId]      = useState('')
  const [categoryTouched, setCategoryTouched] = useState(false)
  const [primaryColor,    setPrimaryColor]    = useState<string | null>(null)
  const [formStatus,       setFormStatus]       = useState<FormStatus>('idle')
  const [formError,        setFormError]        = useState('')
  const [rejectedThreats,  setRejectedThreats]  = useState<string[]>([])
  const [duplicateApp,     setDuplicateApp]     = useState<{ id: string; name: string } | null>(null)
  const [categories,   setCategories]   = useState<{ id: string; name: string }[]>([])

  const bypassDupeCheck = useRef(false)

  // Fetch categories from the Next.js proxy route (same-origin, cached 5 min)
  useEffect(() => {
    fetch('/api/categories')
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

  // Auto-detect category from name + description (only before user picks manually)
  useEffect(() => {
    if (categoryTouched || categories.length === 0) return
    const suggested = suggestCategoryName(`${name} ${description}`)
    if (!suggested) return
    const match = categories.find(c => c.name.toLowerCase() === suggested.toLowerCase())
    if (match) setCategoryId(match.id)
  }, [name, description, categories, categoryTouched])

  // Escape key
  useEffect(() => {
    if (!open) return
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [open, onClose])

  function reset() {
    if (logoPreview) URL.revokeObjectURL(logoPreview)
    uploads.forEach(u => URL.revokeObjectURL(u.preview))
    setLogoFile(null); setLogoPreview(null)
    setUploads([]); setIsDragging(false)
    setName(''); setSlug(''); setSlugTouched(false)
    setTagline(''); setDescription(''); setLaunchUrl(''); setCategoryId(''); setCategoryTouched(false)
    setPrimaryColor(null)
    setFormStatus('idle'); setFormError(''); setRejectedThreats([]); setDuplicateApp(null)
    bypassDupeCheck.current = false
  }

  function handleClose() { onClose(); setTimeout(reset, 300) }

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

    setFormStatus('scanning'); setFormError('')
    const scanStart = Date.now()
    const authHeader = { Authorization: `Bearer ${accessToken}` }

    try {
      // Step 1 — create app
      const appRes = await fetch(`${API_BASE}/api/v1/apps`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', ...authHeader },
        body: JSON.stringify({
          name, slug, tagline,
          ...(categoryId       ? { categoryId }   : {}),
          ...(description.trim() ? { description: description.trim() } : {}),
          ...(launchUrl        ? { launchUrl }    : {}),
          ...(primaryColor     ? { primaryColor } : {}),
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

      // Step 2 — upload logo (optional, non-blocking on failure)
      if (logoFile) {
        const logoForm = new FormData()
        logoForm.append('icon', logoFile)
        await fetch(`${API_BASE}/api/v1/apps/${appId}/icon`, {
          method: 'POST', headers: { ...authHeader }, body: logoForm,
        }).catch(() => {}) // logo failure doesn't block submission
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
        body: '{}',
      })
      const submitJson = await submitRes.json().catch(() => ({})) as {
        success?: boolean
        autoPublished?: boolean
        app?: { id: string }
        error?: { message?: string; details?: string[] }
      }

      if (submitRes.status === 422) {
        // Security scan rejected — show red shield overlay with threat list
        const threats = submitJson.error?.details ?? []
        setRejectedThreats(threats.length > 0 ? threats : [submitJson.error?.message ?? 'Submission rejected by security scan.'])
        setFormStatus('rejected')
        return
      }

      if (submitRes.ok) {
        // Scan passed — hold the overlay for at least 3.5 s so the checklist fully animates
        const elapsed = Date.now() - scanStart
        if (elapsed < 3500) {
          await new Promise<void>(resolve => setTimeout(resolve, 3500 - elapsed))
        }
        setFormStatus('success')
        setTimeout(() => { window.location.href = '/dashboard' }, 1500)
        return
      }

      // Any other non-ok status — surface the error
      throw new Error(submitJson.error?.message ?? `Submission failed (${submitRes.status})`)
    } catch (err) {
      setFormStatus('error')
      setFormError(err instanceof Error ? err.message : 'Something went wrong.')
    }
  }

  if (!open) return null

  return (
    <>
    <div
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 md:p-6"
      role="dialog" aria-modal="true" aria-labelledby="submit-modal-title"
    >
      {/* Backdrop — stronger blur for cloud context */}
      <div
        className="absolute inset-0 bg-stone-900/50 backdrop-blur-md"
        onClick={handleClose}
        aria-hidden
      />

      {/* Panel */}
      <div className={cn(
        'animate-modal-in relative z-10 flex w-full max-w-2xl flex-col',
        'rounded-t-2xl sm:rounded-3xl overflow-hidden',
        'bg-white/95 sm:bg-white/88 backdrop-blur-xl',
        'border border-white/60',
        'shadow-[0_-8px_40px_-4px_rgba(0,0,0,0.15)] sm:shadow-[0_32px_80px_-8px_rgba(0,0,0,0.22)]',
        'max-h-[92vh] sm:max-h-[90vh]',
      )}>

        {/* ── Colour accent strip ─────────────────────────────────────────── */}
        <div
          className="h-[3px] w-full shrink-0 transition-colors duration-500"
          style={{ background: primaryColor ?? 'linear-gradient(90deg,#2D8B7A,#14b8a6)' }}
        />

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-4 sm:px-8 py-4 sm:py-5 shrink-0">
          <div>
            <h2 id="submit-modal-title" className="text-lg font-semibold text-stone-900">
              Submit an App
            </h2>
            <p className="mt-0.5 text-xs font-light text-stone-400">
              Share your creation with the community
            </p>
          </div>
          <button
            onClick={handleClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-stone-400 hover:bg-stone-100 hover:text-stone-700 transition-colors"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="h-px bg-stone-100/80 shrink-0" />

        {/* ── Body ────────────────────────────────────────────────────────── */}

        {!user ? (
          /* ── Not signed in ── */
          <div className="flex flex-col items-center justify-center gap-5 px-8 py-20 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-teal-50 border border-teal-100">
              <LogIn className="h-7 w-7 text-teal-600" />
            </div>
            <div>
              <p className="text-base font-semibold text-stone-900">Sign in to submit</p>
              <p className="mt-1.5 text-sm font-light text-stone-400 max-w-xs">
                You need to be signed in to share your app with the community.
              </p>
            </div>
            <a
              href="/sign-in"
              className="inline-flex items-center gap-2 rounded-full bg-teal-700 px-8 py-3 text-sm font-semibold text-white shadow-lg shadow-teal-700/20 hover:bg-teal-600 transition-all active:scale-95"
            >
              Sign In
            </a>
          </div>

        ) : formStatus === 'duplicate' && duplicateApp ? (
          /* ── Duplicate ── */
          <div className="flex flex-col items-center justify-center gap-5 px-8 py-20 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-50 border border-amber-100">
              <AlertCircle className="h-7 w-7 text-amber-500" />
            </div>
            <div>
              <p className="text-base font-semibold text-stone-900">Already submitted</p>
              <p className="mt-1.5 text-sm font-light text-stone-400 max-w-xs">
                You&apos;ve already submitted <strong className="font-medium text-stone-700">{duplicateApp.name}</strong>.
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
              <a
                href={`/apps/${duplicateApp.id}`}
                className="inline-flex items-center gap-2 rounded-full bg-teal-700 px-8 py-3 text-sm font-semibold text-white shadow-lg shadow-teal-700/20 hover:bg-teal-600 transition-all active:scale-95"
                onClick={handleClose}
              >
                View app
              </a>
            </div>
          </div>

        ) : (
          /* ── Form ── */
          <form onSubmit={handleSubmit} className="flex flex-col gap-5 sm:gap-6 overflow-y-auto px-4 sm:px-8 py-4 sm:py-6">

            {/* ── Logo + Colour ─────────────────────────────────────────────── */}
            <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-6">

              {/* Logo picker */}
              <div className="flex sm:flex-col items-center gap-3 sm:gap-2 shrink-0">
                <p className="text-[11px] font-medium uppercase tracking-wider text-stone-400">Logo</p>
                <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
                <button
                  type="button"
                  onClick={() => logoInputRef.current?.click()}
                  className="group relative h-[90px] w-[90px] overflow-hidden rounded-2xl border-2 border-dashed border-stone-200 bg-stone-50/80 hover:border-teal-400 transition-all"
                  style={primaryColor ? { borderColor: `${primaryColor}70` } : undefined}
                  title="Upload app logo"
                >
                  {logoPreview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={logoPreview} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div
                      className="flex h-full w-full flex-col items-center justify-center gap-1"
                      style={primaryColor ? { background: `${primaryColor}12` } : undefined}
                    >
                      <Camera className="h-6 w-6 text-stone-300 group-hover:text-teal-500 transition-colors" />
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
                <p className="mb-3 text-[11px] font-medium uppercase tracking-wider text-stone-400">Brand Colour</p>
                <div className="grid grid-cols-6 gap-2">
                  {PALETTE.map(({ hex, label }) => (
                    <button
                      key={hex}
                      type="button"
                      title={label}
                      onClick={() => setPrimaryColor(c => c === hex ? null : hex)}
                      className={cn(
                        'h-8 w-full rounded-xl transition-all hover:scale-105 active:scale-95',
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
                    className="mt-2 text-[10px] text-stone-400 hover:text-stone-600 transition-colors"
                  >
                    Clear colour
                  </button>
                )}
              </div>
            </div>

            {/* ── Screenshots ─────────────────────────────────────────────────── */}
            <div>
              <p className="mb-3 text-[11px] font-medium uppercase tracking-wider text-stone-400">
                Screenshots <span className="text-teal-600 normal-case tracking-normal font-normal text-xs">* required</span>
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
                    'flex w-full flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed py-10 text-center transition-all',
                    isDragging
                      ? 'border-teal-400 bg-teal-50/60 scale-[0.995]'
                      : 'border-stone-200/80 bg-stone-50/40 hover:border-teal-300 hover:bg-teal-50/30',
                  )}
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-teal-50 border border-teal-100">
                    <Upload className="h-5 w-5 text-teal-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-stone-700">
                      Drop images here or <span className="text-teal-600">browse</span>
                    </p>
                    <p className="mt-1 text-xs font-light text-stone-400">PNG, JPG up to 15 MB · max 4 files</p>
                  </div>
                </button>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
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
                      className="flex aspect-[9/16] flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-stone-200 bg-stone-50/60 text-stone-400 transition-all hover:border-teal-300 hover:bg-teal-50/30"
                    >
                      <ImagePlus className="h-5 w-5" />
                      <span className="text-[10px] font-medium">Add</span>
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* ── App Details ─────────────────────────────────────────────────── */}
            <div>
              <p className="mb-4 text-[11px] font-medium uppercase tracking-wider text-stone-400">App Details</p>

              <div className="flex flex-col gap-4">
                {/* Name + Slug */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                      onChange={e => { setCategoryId(e.target.value); setCategoryTouched(true) }}
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
                    rows={3} className={cn(inputCls, 'resize-y')}
                  />
                  <p className="mt-1 text-right text-[10px] text-stone-400">{description.length} / 5000</p>
                </Field>
              </div>
            </div>

            {/* Error banner */}
            {formStatus === 'error' && (
              <div className="flex items-start gap-2.5 rounded-xl border border-red-200/80 bg-red-50/80 px-4 py-3 text-sm text-red-600">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span className="whitespace-pre-line text-sm font-light">{formError}</span>
              </div>
            )}

            {/* ── Actions ──────────────────────────────────────────────────── */}
            <div className="flex items-center justify-end gap-2 sm:gap-3 pt-2 pb-1">
              <button
                type="button"
                onClick={handleClose}
                className="px-6 py-2.5 text-sm font-medium text-stone-400 rounded-full hover:bg-stone-100 hover:text-stone-600 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={formStatus === 'loading' || formStatus === 'scanning'}
                className="inline-flex items-center gap-2 rounded-full px-8 py-3 text-sm font-semibold text-white shadow-lg transition-all duration-200 hover:-translate-y-px active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none"
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
    </div>

    {/* ── Security Scan Full-Screen Overlay ──────────────────────────────────── */}
    {(formStatus === 'scanning' || formStatus === 'success' || formStatus === 'rejected') && (
      <div className="fixed inset-0 z-[9999] overflow-hidden bg-stone-950">
        {/* Cyber grid */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(20,184,166,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(20,184,166,0.8) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />
        {/* Radial glow — transitions colour based on state */}
        <div
          className="pointer-events-none absolute inset-0 transition-all duration-700"
          style={{
            background: formStatus === 'rejected'
              ? 'radial-gradient(ellipse 60% 50% at 50% 50%, rgba(239,68,68,0.12) 0%, transparent 70%)'
              : 'radial-gradient(ellipse 60% 50% at 50% 50%, rgba(20,184,166,0.12) 0%, transparent 70%)',
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
                {/* Icon slot: spinner fades out, checkmark fades in */}
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
    </>
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

const inputCls =
  'w-full rounded-xl border border-stone-200/80 bg-stone-50/60 px-4 py-3 text-sm text-stone-800 ' +
  'placeholder:text-stone-300 placeholder:font-light outline-none transition-all duration-150 ' +
  'focus:border-teal-400/70 focus:bg-white focus:ring-2 focus:ring-teal-400/15'
