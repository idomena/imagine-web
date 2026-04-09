'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import {
  X, CheckCircle, AlertCircle, Loader2, ImagePlus, Camera,
  Upload, Trash2, Film,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/context/AuthContext'

// ---------------------------------------------------------------------------
// EditAppModal — update an existing app's branding, media and metadata.
//
//  Sections:
//    • Logo (circular, replace)
//    • Brand colour palette
//    • Video (replace or add)
//    • Screenshots (view existing + delete + add new)
//    • Name / Tagline / Description / App Link
// ---------------------------------------------------------------------------

const API_BASE  = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080'
const MAX_SHOTS = 4

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

export interface AppData {
  id:           string
  name:         string
  tagline:      string
  description:  string
  launchUrl:    string | null
  iconUrl:      string | null
  primaryColor: string | null
  videoUrl:     string | null
  categoryId:   string | null
}

interface ExistingAsset {
  id:  string
  url: string
}

interface Props {
  open:    boolean
  onClose: () => void
  app:     AppData
  onSaved: (updated: Partial<AppData>) => void
}

type SaveStatus = 'idle' | 'saving' | 'success' | 'error'

interface NewUpload { file: File; preview: string }

// ── Component ─────────────────────────────────────────────────────────────────

export function EditAppModal({ open, onClose, app, onSaved }: Props) {
  const { accessToken } = useAuth()

  // ── Logo ───────────────────────────────────────────────────────────────────
  const [logoFile,    setLogoFile]    = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(app.iconUrl)
  const logoInputRef = useRef<HTMLInputElement>(null)

  // ── Video ──────────────────────────────────────────────────────────────────
  const [videoFile,    setVideoFile]    = useState<File | null>(null)
  const [videoPreview, setVideoPreview] = useState<string | null>(app.videoUrl)
  const videoInputRef = useRef<HTMLInputElement>(null)

  // ── Screenshots ────────────────────────────────────────────────────────────
  const [existingShots, setExistingShots] = useState<ExistingAsset[]>([])
  const [newShots,      setNewShots]      = useState<NewUpload[]>([])
  const [deletingId,    setDeletingId]    = useState<string | null>(null)
  const [loadingAssets, setLoadingAssets] = useState(false)
  const screenshotInputRef = useRef<HTMLInputElement>(null)

  // ── Form fields ────────────────────────────────────────────────────────────
  const [name,         setName]         = useState(app.name)
  const [tagline,      setTagline]      = useState(app.tagline)
  const [description,  setDescription]  = useState(app.description ?? '')
  const [launchUrl,    setLaunchUrl]    = useState(app.launchUrl ?? '')
  const [categoryId,   setCategoryId]   = useState(app.categoryId ?? '')
  const [primaryColor, setPrimaryColor] = useState<string | null>(app.primaryColor)
  const [categories,   setCategories]   = useState<{ id: string; name: string }[]>([])

  // ── Status ─────────────────────────────────────────────────────────────────
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')
  const [saveError,  setSaveError]  = useState('')

  // Fetch categories once
  useEffect(() => {
    fetch(`${API_BASE}/api/v1/categories`)
      .then(r => r.json())
      .then((json: { data?: { id: string; name: string }[] }) => setCategories(json.data ?? []))
      .catch(() => {})
  }, [])

  // Sync state when the `app` prop changes (modal re-opened for a different app)
  useEffect(() => {
    setName(app.name); setTagline(app.tagline)
    setDescription(app.description ?? ''); setLaunchUrl(app.launchUrl ?? '')
    setCategoryId(app.categoryId ?? '')
    setPrimaryColor(app.primaryColor)
    setLogoPreview(app.iconUrl); setLogoFile(null)
    setVideoPreview(app.videoUrl); setVideoFile(null)
    setNewShots([]); setSaveStatus('idle'); setSaveError('')
  }, [app])

  // Fetch existing screenshots when modal opens
  useEffect(() => {
    if (!open || !accessToken) return
    setLoadingAssets(true)
    fetch(`${API_BASE}/api/v1/apps/${app.id}/assets`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
      .then(r => r.json())
      .then((json: { data?: Array<{ id: string; url: string; type: string }> }) => {
        setExistingShots(
          (json.data ?? [])
            .filter(a => a.type === 'SCREENSHOT')
            .map(a => ({ id: a.id, url: a.url })),
        )
      })
      .catch(() => {})
      .finally(() => setLoadingAssets(false))
  }, [open, app.id, accessToken])

  // Escape key
  useEffect(() => {
    if (!open) return
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', h); return () => window.removeEventListener('keydown', h)
  }, [open, onClose])

  // ── Logo ───────────────────────────────────────────────────────────────────
  function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return
    if (logoPreview && logoPreview !== app.iconUrl) URL.revokeObjectURL(logoPreview)
    setLogoFile(file); setLogoPreview(URL.createObjectURL(file))
    e.target.value = ''
  }

  // ── Video ──────────────────────────────────────────────────────────────────
  function handleVideoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return
    if (videoPreview && videoPreview !== app.videoUrl) URL.revokeObjectURL(videoPreview)
    setVideoFile(file); setVideoPreview(URL.createObjectURL(file))
    e.target.value = ''
  }

  // ── Screenshots ────────────────────────────────────────────────────────────
  function addScreenshots(fl: FileList | null) {
    if (!fl) return
    const remaining = MAX_SHOTS - existingShots.length - newShots.length
    if (remaining <= 0) return
    const fresh = Array.from(fl)
      .filter(f => f.type.startsWith('image/'))
      .slice(0, remaining)
      .map(file => ({ file, preview: URL.createObjectURL(file) }))
    setNewShots(prev => [...prev, ...fresh])
  }

  async function deleteExisting(assetId: string) {
    if (!accessToken) return
    setDeletingId(assetId)
    try {
      await fetch(`${API_BASE}/api/v1/apps/${app.id}/assets/${assetId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      setExistingShots(prev => prev.filter(a => a.id !== assetId))
    } catch {
      // silently ignore — item stays in list
    } finally {
      setDeletingId(null)
    }
  }

  function removeNew(i: number) {
    setNewShots(prev => { URL.revokeObjectURL(prev[i]!.preview); return prev.filter((_, idx) => idx !== i) })
  }

  // ── Save ───────────────────────────────────────────────────────────────────
  async function handleSave() {
    if (!accessToken) return
    setSaveStatus('saving'); setSaveError('')
    const auth = { Authorization: `Bearer ${accessToken}` }

    try {
      // 1. Patch text fields + color
      const patchRes = await fetch(`${API_BASE}/api/v1/apps/${app.id}`, {
        method:  'PATCH',
        headers: { ...auth, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          tagline: tagline.trim(),
          ...(categoryId         ? { categoryId }                      : {}),
          ...(description.trim() ? { description: description.trim() } : {}),
          ...(launchUrl.trim()   ? { launchUrl:   launchUrl.trim()   } : {}),
          ...(primaryColor       ? { primaryColor }                    : {}),
        }),
      })
      if (!patchRes.ok) {
        const j = await patchRes.json().catch(() => ({})) as { error?: { message?: string } }
        throw new Error(j.error?.message ?? `Error ${patchRes.status}`)
      }

      // 2. Upload new logo
      let newIconUrl = app.iconUrl
      if (logoFile) {
        const f = new FormData(); f.append('icon', logoFile)
        const r = await fetch(`${API_BASE}/api/v1/apps/${app.id}/icon`, { method: 'POST', headers: auth, body: f })
        const j = await r.json().catch(() => ({})) as { data?: { iconUrl: string } }
        if (r.ok && j.data?.iconUrl) newIconUrl = j.data.iconUrl
      }

      // 3. Upload new video
      let newVideoUrl = app.videoUrl
      if (videoFile) {
        const f = new FormData(); f.append('video', videoFile)
        const r = await fetch(`${API_BASE}/api/v1/apps/${app.id}/video`, { method: 'POST', headers: auth, body: f })
        const j = await r.json().catch(() => ({})) as { data?: { videoUrl: string } }
        if (r.ok && j.data?.videoUrl) newVideoUrl = j.data.videoUrl
      }

      // 4. Upload new screenshots
      if (newShots.length > 0) {
        const f = new FormData()
        newShots.forEach(u => f.append('screenshots', u.file))
        await fetch(`${API_BASE}/api/v1/apps/${app.id}/screenshots`, { method: 'POST', headers: auth, body: f })
      }

      setSaveStatus('success')
      onSaved({
        name:         name.trim(),
        tagline:      tagline.trim(),
        description:  description.trim(),
        launchUrl:    launchUrl.trim() || null,
        primaryColor: primaryColor,
        iconUrl:      newIconUrl,
        videoUrl:     newVideoUrl,
      })
    } catch (err) {
      setSaveStatus('error')
      setSaveError(err instanceof Error ? err.message : 'Save failed.')
    }
  }

  if (!open) return null

  const totalShots = existingShots.length + newShots.length
  const canAddMore = totalShots < MAX_SHOTS

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      role="dialog" aria-modal="true"
    >
      <div className="absolute inset-0 bg-stone-900/40 backdrop-blur-sm" onClick={onClose} aria-hidden />

      <div className="relative z-10 w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-stone-200 flex flex-col max-h-[92vh]">

        {/* Accent strip */}
        <div
          className="h-1 w-full rounded-t-2xl transition-colors duration-300"
          style={{ background: primaryColor ?? '#e7e5e4' }}
        />

        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-100 px-6 py-4 shrink-0">
          <div>
            <h2 className="text-base font-semibold text-stone-800">Edit App</h2>
            <p className="text-xs text-stone-400 mt-0.5">{app.name}</p>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-stone-400 hover:bg-stone-100 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {saveStatus === 'success' ? (
          <div className="flex flex-col items-center justify-center gap-3 px-6 py-14 text-center">
            <div
              className="flex h-16 w-16 items-center justify-center rounded-full"
              style={{ background: `${primaryColor ?? '#14b8a6'}22`, border: `2px solid ${primaryColor ?? '#14b8a6'}40` }}
            >
              <CheckCircle className="h-8 w-8" style={{ color: primaryColor ?? '#0d9488' }} />
            </div>
            <p className="text-lg font-semibold text-stone-800">Changes saved!</p>
            <button onClick={onClose} className="btn-primary mt-2">Close</button>
          </div>
        ) : (
          <div className="overflow-y-auto flex-1">
            <div className="flex flex-col gap-5 px-6 py-5">

              {/* ── Logo + Colour ──────────────────────────────────────────── */}
              <div className="flex items-start gap-5">

                {/* Circular logo */}
                <div className="flex flex-col items-center gap-1.5 shrink-0">
                  <p className="text-xs font-medium text-stone-600">Logo</p>
                  <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
                  <button
                    type="button"
                    onClick={() => logoInputRef.current?.click()}
                    className="group relative h-[72px] w-[72px] rounded-full overflow-hidden border-2 border-dashed border-stone-300 bg-stone-50 hover:border-teal-400 transition-colors"
                    style={primaryColor ? { borderColor: `${primaryColor}80` } : undefined}
                  >
                    {logoPreview ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={logoPreview} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full flex-col items-center justify-center gap-0.5">
                        <Camera className="h-5 w-5 text-stone-400 group-hover:text-teal-500 transition-colors" />
                      </div>
                    )}
                    {logoPreview && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Camera className="h-5 w-5 text-white" />
                      </div>
                    )}
                  </button>
                </div>

                {/* Colour palette */}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-stone-600 mb-2">Brand Colour</p>
                  <div className="grid grid-cols-6 gap-1.5">
                    {PALETTE.map(({ hex, label }) => (
                      <button
                        key={hex} type="button" title={label}
                        onClick={() => setPrimaryColor(c => c === hex ? null : hex)}
                        className={cn(
                          'h-7 w-full rounded-lg transition-transform hover:scale-110 active:scale-95',
                          primaryColor === hex && 'ring-2 ring-offset-1 ring-stone-400 scale-110',
                        )}
                        style={{ background: hex }}
                        aria-pressed={primaryColor === hex}
                        aria-label={label}
                      />
                    ))}
                  </div>
                  {primaryColor && (
                    <button type="button" onClick={() => setPrimaryColor(null)}
                      className="mt-1.5 text-[10px] text-stone-400 hover:text-stone-600 transition-colors">
                      Clear colour
                    </button>
                  )}
                </div>
              </div>

              {/* ── Video ──────────────────────────────────────────────────── */}
              <Divider label="Promo Video" />
              <div>
                <p className="text-xs text-stone-400 mb-2">Optional short video (max ~30s, 100 MB)</p>
                <input ref={videoInputRef} type="file" accept="video/*" className="hidden" onChange={handleVideoChange} />
                {videoPreview ? (
                  <div className="relative rounded-2xl overflow-hidden border border-stone-200 bg-stone-50">
                    <video
                      src={videoPreview}
                      controls
                      className="w-full rounded-2xl"
                      style={{ maxHeight: 180 }}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (videoPreview !== app.videoUrl) URL.revokeObjectURL(videoPreview)
                        setVideoFile(null); setVideoPreview(null)
                      }}
                      className="absolute top-2 right-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/50 text-white hover:bg-red-500 transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => videoInputRef.current?.click()}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-stone-200 bg-stone-50 py-6 text-sm text-stone-500 hover:border-teal-300 hover:bg-teal-50/40 transition-colors"
                  >
                    <Film className="h-4 w-4" />
                    Upload video
                  </button>
                )}
              </div>

              {/* ── Screenshots ────────────────────────────────────────────── */}
              <Divider label="Screenshots" />
              <div>
                <p className="text-xs text-stone-400 mb-2">Up to 4 screenshots total</p>
                <input
                  ref={screenshotInputRef} type="file" accept="image/*" multiple className="hidden"
                  onChange={e => addScreenshots(e.target.files)}
                />

                {loadingAssets ? (
                  <div className="flex justify-center py-4"><Loader2 className="h-4 w-4 animate-spin text-stone-400" /></div>
                ) : (
                  <div className="grid grid-cols-4 gap-2">
                    {/* Existing */}
                    {existingShots.map(a => (
                      <div key={a.id} className="relative rounded-xl overflow-hidden border border-stone-200 bg-stone-50 aspect-[9/16]">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={a.url} alt="" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => deleteExisting(a.id)}
                          disabled={deletingId === a.id}
                          className="absolute top-1 right-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/50 text-white hover:bg-red-500 transition-colors disabled:opacity-50"
                        >
                          {deletingId === a.id
                            ? <Loader2 className="h-2.5 w-2.5 animate-spin" />
                            : <X className="h-2.5 w-2.5" />}
                        </button>
                      </div>
                    ))}
                    {/* New uploads */}
                    {newShots.map((u, i) => (
                      <div key={i} className="relative rounded-xl overflow-hidden border border-teal-200 bg-stone-50 aspect-[9/16]">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={u.preview} alt="" className="w-full h-full object-cover" />
                        <button
                          type="button" onClick={() => removeNew(i)}
                          className="absolute top-1 right-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/50 text-white hover:bg-red-500 transition-colors"
                        >
                          <X className="h-2.5 w-2.5" />
                        </button>
                        <div className="absolute bottom-1 left-1 rounded-full bg-teal-500 px-1 py-px text-[9px] text-white font-semibold">NEW</div>
                      </div>
                    ))}
                    {/* Add slot */}
                    {canAddMore && (
                      <button
                        type="button"
                        onClick={() => screenshotInputRef.current?.click()}
                        className="flex flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-stone-200 bg-stone-50 aspect-[9/16] hover:border-teal-300 hover:bg-teal-50/40 transition-colors text-stone-400"
                      >
                        <Upload className="h-4 w-4" />
                        <span className="text-[10px]">Add</span>
                      </button>
                    )}
                    {!canAddMore && totalShots === 0 && (
                      <div className="col-span-4 text-center py-4 text-xs text-stone-400">No screenshots yet</div>
                    )}
                  </div>
                )}
              </div>

              {/* ── App Details ─────────────────────────────────────────────── */}
              <Divider label="App Details" />

              <Field label="App name" required>
                <input type="text" value={name} onChange={e => setName(e.target.value)}
                  maxLength={100} required className={inputCls} />
              </Field>

              <Field label="Tagline" required>
                <input type="text" value={tagline} onChange={e => setTagline(e.target.value)}
                  maxLength={200} required className={inputCls} />
              </Field>

              <Field label="App Link">
                <input type="url" value={launchUrl} onChange={e => setLaunchUrl(e.target.value)}
                  placeholder="https://myapp.vercel.app" className={inputCls} />
              </Field>

              <Field label="Category" required>
                <select
                  value={categoryId}
                  onChange={e => setCategoryId(e.target.value)}
                  required
                  className={cn(inputCls, 'cursor-pointer')}
                >
                  <option value="" disabled>Select a category…</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </Field>

              <Field label="Description">
                <textarea value={description} onChange={e => setDescription(e.target.value)}
                  placeholder="What does your app do?" maxLength={5000} rows={3}
                  className={cn(inputCls, 'resize-y')} />
                <p className="mt-1 text-right text-xs text-stone-400">{description.length} / 5000</p>
              </Field>

              {saveStatus === 'error' && (
                <div className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  {saveError}
                </div>
              )}

            </div>
          </div>
        )}

        {/* Footer */}
        {saveStatus !== 'success' && (
          <div className="flex items-center justify-end gap-3 border-t border-stone-100 px-6 py-4 shrink-0">
            <button type="button" onClick={onClose} className="btn-ghost">Cancel</button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saveStatus === 'saving'}
              className="btn-primary disabled:opacity-60 disabled:cursor-not-allowed"
              style={primaryColor ? { backgroundColor: primaryColor, borderColor: primaryColor } : undefined}
            >
              {saveStatus === 'saving'
                ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving…</>
                : 'Save Changes'
              }
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function Divider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 -mx-1">
      <div className="flex-1 h-px bg-stone-100" />
      <span className="text-xs text-stone-400 font-medium">{label}</span>
      <div className="flex-1 h-px bg-stone-100" />
    </div>
  )
}

function Field({ label, hint, required, children }: {
  label: string; hint?: string; required?: boolean; children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-stone-700">
        {label}{required && <span className="ml-0.5 text-teal-600">*</span>}
      </label>
      {hint && <p className="text-xs text-stone-400 -mt-0.5">{hint}</p>}
      {children}
    </div>
  )
}

const inputCls =
  'w-full rounded-xl border border-stone-200 bg-stone-50 px-3.5 py-2.5 text-sm text-stone-800 ' +
  'placeholder:text-stone-400 outline-none transition ' +
  'focus:border-teal-400 focus:bg-white focus:ring-2 focus:ring-teal-400/20'
