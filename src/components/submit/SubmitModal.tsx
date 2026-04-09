'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import {
  X, CheckCircle, AlertCircle, Loader2, Upload, ImagePlus, LogIn, Camera,
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
  const [name,         setName]         = useState('')
  const [slug,         setSlug]         = useState('')
  const [slugTouched,  setSlugTouched]  = useState(false)
  const [tagline,      setTagline]      = useState('')
  const [description,  setDescription]  = useState('')
  const [launchUrl,    setLaunchUrl]    = useState('')
  const [categoryId,   setCategoryId]   = useState('')
  const [primaryColor, setPrimaryColor] = useState<string | null>(null)
  const [formStatus,   setFormStatus]   = useState<FormStatus>('idle')
  const [formError,    setFormError]    = useState('')
  const [duplicateApp, setDuplicateApp] = useState<{ id: string; name: string } | null>(null)
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
    setTagline(''); setDescription(''); setLaunchUrl(''); setCategoryId('')
    setPrimaryColor(null)
    setFormStatus('idle'); setFormError(''); setDuplicateApp(null)
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

    setFormStatus('loading'); setFormError('')
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

      setFormStatus('success')
    } catch (err) {
      setFormStatus('error')
      setFormError(err instanceof Error ? err.message : 'Something went wrong.')
    }
  }

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6"
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
        'rounded-3xl overflow-hidden',
        'bg-white/88 backdrop-blur-xl',
        'border border-white/60',
        'shadow-[0_32px_80px_-8px_rgba(0,0,0,0.22)]',
        'max-h-[90vh]',
      )}>

        {/* ── Colour accent strip ─────────────────────────────────────────── */}
        <div
          className="h-[3px] w-full shrink-0 transition-colors duration-500"
          style={{ background: primaryColor ?? 'linear-gradient(90deg,#2D8B7A,#14b8a6)' }}
        />

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-8 py-5 shrink-0">
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

        ) : formStatus === 'success' ? (
          /* ── Success ── */
          <div className="flex flex-col items-center justify-center gap-5 px-8 py-20 text-center">
            <div
              className="flex h-20 w-20 items-center justify-center rounded-full"
              style={{
                background: primaryColor ? `${primaryColor}18` : '#f0fdf9',
                border:     `2px solid ${primaryColor ?? '#14b8a6'}35`,
              }}
            >
              <CheckCircle className="h-9 w-9" style={{ color: primaryColor ?? '#0d9488' }} />
            </div>
            <div>
              <p className="text-xl font-semibold text-stone-900">App submitted!</p>
              <p className="mt-1.5 text-sm font-light text-stone-400">
                Your app is now live and ready to be discovered.
              </p>
            </div>
            <button
              onClick={handleClose}
              className="inline-flex items-center gap-2 rounded-full bg-teal-700 px-8 py-3 text-sm font-semibold text-white shadow-lg shadow-teal-700/20 hover:bg-teal-600 transition-all active:scale-95"
            >
              Done
            </button>
          </div>

        ) : (
          /* ── Form ── */
          <form onSubmit={handleSubmit} className="flex flex-col gap-6 overflow-y-auto px-8 py-6">

            {/* ── Logo + Colour ─────────────────────────────────────────────── */}
            <div className="flex items-start gap-6">

              {/* Logo picker */}
              <div className="flex flex-col items-center gap-2 shrink-0">
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
                <div className="grid grid-cols-4 gap-2.5">
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
                <div className="grid grid-cols-2 gap-4">
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
                <div className="grid grid-cols-2 gap-4">
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
            <div className="flex items-center justify-end gap-3 pt-2 pb-1">
              <button
                type="button"
                onClick={handleClose}
                className="px-6 py-2.5 text-sm font-medium text-stone-400 rounded-full hover:bg-stone-100 hover:text-stone-600 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={formStatus === 'loading'}
                className="inline-flex items-center gap-2 rounded-full px-8 py-3 text-sm font-semibold text-white shadow-lg transition-all duration-200 hover:-translate-y-px active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none"
                style={{
                  backgroundColor: primaryColor ?? '#0f766e',
                  boxShadow: `0 8px 24px -4px ${primaryColor ?? '#0f766e'}40`,
                }}
              >
                {formStatus === 'loading'
                  ? <><Loader2 className="h-4 w-4 animate-spin" /> Submitting…</>
                  : 'Submit App'
                }
              </button>
            </div>

          </form>
        )}
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

const inputCls =
  'w-full rounded-xl border border-stone-200/80 bg-stone-50/60 px-4 py-3 text-sm text-stone-800 ' +
  'placeholder:text-stone-300 placeholder:font-light outline-none transition-all duration-150 ' +
  'focus:border-teal-400/70 focus:bg-white focus:ring-2 focus:ring-teal-400/15'
