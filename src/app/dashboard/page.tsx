'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus, MousePointerClick, CheckCircle,
  Loader2, AlertCircle, MoreVertical, Pencil, ExternalLink,
  Trash2, Archive, ImagePlus, Type, LogOut, Rocket,
  Zap, TrendingUp,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/context/AuthContext'
import { EditAppModal, type AppData } from '@/components/submit/EditAppModal'

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080'

interface AppWithStats {
  id:           string
  name:         string
  slug:         string
  tagline:      string
  description:  string
  status:       string
  launchUrl:    string | null
  iconUrl:      string | null
  primaryColor: string | null
  videoUrl:     string | null
  categoryId:   string | null
  createdAt:    string
  _count:       { launchEvents: number }
  securityAuditReport?: { safetyScore: number; decision: string } | null
}

const STATUS: Record<string, { label: string; dot: string; badge: string }> = {
  DRAFT:     { label: 'Draft',     dot: 'bg-amber-400',  badge: 'bg-amber-50 text-amber-700 border-amber-200'  },
  SUBMITTED: { label: 'Submitted', dot: 'bg-sky-400',    badge: 'bg-sky-50 text-sky-700 border-sky-200'        },
  IN_REVIEW: { label: 'In Review', dot: 'bg-blue-400',   badge: 'bg-blue-50 text-blue-700 border-blue-200'     },
  APPROVED:  { label: 'Approved',  dot: 'bg-teal-400',   badge: 'bg-teal-50 text-teal-700 border-teal-200'     },
  PUBLISHED: { label: 'Live',      dot: 'bg-emerald-500',badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  REJECTED:  { label: 'Rejected',  dot: 'bg-red-400',    badge: 'bg-red-50 text-red-600 border-red-200'        },
  ARCHIVED:  { label: 'Archived',  dot: 'bg-slate-300',  badge: 'bg-slate-50 text-slate-500 border-slate-200'  },
}

function getGreeting(name: string): { greeting: string; emoji: string } {
  const h = new Date().getHours()
  if (h < 12) return { greeting: `Good morning, ${name}`, emoji: '☀️' }
  if (h < 17) return { greeting: `Good afternoon, ${name}`, emoji: '👋' }
  return              { greeting: `Good evening, ${name}`,  emoji: '🌙' }
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function DashboardPage() {
  const { user, accessToken, isLoading: authLoading, logout } = useAuth()
  const router = useRouter()

  const [apps,         setApps]         = useState<AppWithStats[]>([])
  const [loading,      setLoading]      = useState(true)
  const [error,        setError]        = useState('')
  const [editingApp,   setEditingApp]   = useState<AppWithStats | null>(null)
  const [publishingId, setPublishingId] = useState<string | null>(null)

  useEffect(() => {
    if (!authLoading && !user) router.replace('/sign-in')
  }, [authLoading, user, router])

  const fetchApps = useCallback(async () => {
    if (!accessToken) return
    setLoading(true); setError('')
    try {
      const res  = await fetch(`${API_BASE}/api/v1/apps/mine?limit=100`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      const json = await res.json().catch(() => ({})) as {
        data?: { items: AppWithStats[] }
        error?: { message?: string }
        message?: string
      }
      if (res.status === 401) { logout(); router.replace('/'); return }
      if (!res.ok) throw new Error(json.error?.message ?? json.message ?? `Error ${res.status}`)
      setApps(json.data?.items ?? [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load apps.')
    } finally {
      setLoading(false)
    }
  }, [accessToken])

  useEffect(() => { void fetchApps() }, [fetchApps])

  async function handleDelete(appId: string, appName: string) {
    if (!confirm(`Delete "${appName}"? This cannot be undone.`)) return
    try {
      const res = await fetch(`${API_BASE}/api/v1/apps/${appId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${accessToken ?? ''}` },
      })
      if (!res.ok && res.status !== 204) {
        const json = await res.json().catch(() => ({})) as { error?: { message?: string } }
        throw new Error(json.error?.message ?? `Error ${res.status}`)
      }
      setApps(prev => prev.filter(a => a.id !== appId))
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Delete failed.')
    }
  }

  async function handlePublish(appId: string) {
    if (!confirm('Run the security scan and publish this app?')) return
    setPublishingId(appId)
    try {
      const res = await fetch(`${API_BASE}/api/v1/apps/${appId}/submit`, {
        method:  'POST',
        headers: { Authorization: `Bearer ${accessToken ?? ''}`, 'Content-Type': 'application/json' },
        body:    '{}',
      })
      const json = await res.json().catch(() => ({})) as {
        success?: boolean
        autoPublished?: boolean
        error?: { message?: string; details?: string[] }
      }
      if (res.status === 422) {
        const details = json.error?.details ?? []
        alert(details.length > 0 ? details.join('\n') : (json.error?.message ?? 'Security scan rejected the app.'))
        return
      }
      if (!res.ok) throw new Error(json.error?.message ?? `Error ${res.status}`)
      setApps(prev => prev.map(a => a.id === appId ? { ...a, status: 'PUBLISHED' } : a))
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Publish failed.')
    } finally {
      setPublishingId(null)
    }
  }

  async function handleArchive(appId: string) {
    if (!confirm('Archive this app? It will no longer be visible to users.')) return
    try {
      const res = await fetch(`${API_BASE}/api/v1/apps/${appId}/archive`, {
        method:  'POST',
        headers: { Authorization: `Bearer ${accessToken ?? ''}` },
      })
      const json = await res.json().catch(() => ({})) as {
        data?: AppWithStats; error?: { message?: string }
      }
      if (!res.ok) throw new Error(json.error?.message ?? `Error ${res.status}`)
      setApps(prev => prev.map(a => a.id === appId ? { ...a, status: 'ARCHIVED' } : a))
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Archive failed.')
    }
  }

  async function handleRename(appId: string, newName: string) {
    try {
      const res = await fetch(`${API_BASE}/api/v1/apps/${appId}/rename`, {
        method:  'PATCH',
        headers: { Authorization: `Bearer ${accessToken ?? ''}`, 'Content-Type': 'application/json' },
        body:    JSON.stringify({ name: newName }),
      })
      const json = await res.json().catch(() => ({})) as {
        data?: AppWithStats; error?: { message?: string }
      }
      if (!res.ok) throw new Error(json.error?.message ?? `Error ${res.status}`)
      setApps(prev => prev.map(a => a.id === appId ? { ...a, name: newName } : a))
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Rename failed.')
    }
  }

  function handleEditSaved(appId: string, updated: Partial<AppData>) {
    setApps(prev => prev.map(a => a.id === appId ? { ...a, ...updated } : a))
    setEditingApp(null)
  }

  async function handleIconUpload(appId: string, file: File) {
    const form = new FormData()
    form.append('icon', file)
    try {
      const res = await fetch(`${API_BASE}/api/v1/apps/${appId}/icon`, {
        method:  'POST',
        headers: { Authorization: `Bearer ${accessToken ?? ''}` },
        body:    form,
      })
      const json = await res.json().catch(() => ({})) as {
        data?: { iconUrl: string }; error?: { message?: string }
      }
      if (!res.ok) throw new Error(json.error?.message ?? `Error ${res.status}`)
      const iconUrl = json.data?.iconUrl ?? null
      setApps(prev => prev.map(a => a.id === appId ? { ...a, iconUrl } : a))
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Logo upload failed.')
    }
  }

  const totalVisits    = apps.reduce((s, a) => s + a._count.launchEvents, 0)
  const publishedCount = apps.filter(a => a.status === 'PUBLISHED').length
  const firstName      = (user?.displayName || user?.email?.split('@')[0] || 'there').split(' ')[0] ?? 'there'
  const { greeting, emoji } = getGreeting(firstName)

  if (authLoading || (!user && !authLoading)) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ background: 'rgb(var(--color-background))' }}>
        <Loader2 className="h-6 w-6 animate-spin text-sky-400" />
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ background: 'rgb(var(--color-background))' }}>
      <div className="mx-auto max-w-5xl px-4 sm:px-6 py-10">

        {/* ── Personal header ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="mb-10 flex items-center gap-4"
        >
          {/* Avatar */}
          <div className="relative shrink-0">
            {user?.avatarUrl ? (
              <Image
                src={user.avatarUrl} alt={firstName}
                width={64} height={64}
                className="h-16 w-16 rounded-2xl object-cover border-2 border-white shadow-md"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 to-teal-400 text-2xl font-black text-white shadow-md select-none">
                {firstName[0]?.toUpperCase() ?? '?'}
              </div>
            )}
            <span className="absolute -bottom-1 -right-1 text-lg">{emoji}</span>
          </div>

          <div className="flex-1 min-w-0">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 leading-tight">{greeting}</h1>
            <p className="text-sm text-slate-400 mt-0.5 truncate">
              {publishedCount > 0
                ? `${publishedCount} app${publishedCount !== 1 ? 's' : ''} live · ${totalVisits} total visits`
                : 'Ready to launch your first app?'}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Link
              href="/submit"
              className="flex items-center gap-1.5 rounded-2xl bg-gradient-to-r from-sky-500 to-teal-400 px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-sky-200/60 transition-all hover:shadow-lg hover:opacity-90 active:scale-95"
            >
              <Plus className="h-4 w-4" />
              New App
            </Link>
            <button
              type="button"
              onClick={() => { logout(); router.replace('/') }}
              className="flex h-10 w-10 items-center justify-center rounded-2xl text-slate-400 hover:bg-white hover:text-slate-600 transition-colors shadow-sm border border-slate-100/80"
              title="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </motion.div>

        {/* ── Stats row ── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="mb-8 grid grid-cols-3 gap-3"
        >
          <StatCard
            label="Total Apps"
            value={apps.length}
            icon={<TrendingUp className="h-4 w-4" />}
            color="slate"
          />
          <StatCard
            label="Published"
            value={publishedCount}
            icon={<CheckCircle className="h-4 w-4" />}
            color="sky"
          />
          <StatCard
            label="Visits"
            value={totalVisits}
            icon={<MousePointerClick className="h-4 w-4" />}
            color="teal"
          />
        </motion.div>

        {/* ── Security alert ── */}
        {!loading && apps.some(a => a.status === 'SUBMITTED' && a.securityAuditReport != null) && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
            <div>
              <p className="font-bold">Security Review Required</p>
              <p className="mt-0.5 text-red-600 font-normal">
                {apps.filter(a => a.status === 'SUBMITTED' && a.securityAuditReport != null).length === 1
                  ? 'One of your apps is awaiting manual security review.'
                  : `${apps.filter(a => a.status === 'SUBMITTED' && a.securityAuditReport != null).length} apps are awaiting manual security review.`}
              </p>
            </div>
          </motion.div>
        )}

        {/* ── App grid ── */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-sky-400" />
          </div>
        ) : error ? (
          <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-600">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            {error}
          </div>
        ) : apps.length === 0 ? (
          <EmptyState name={firstName} />
        ) : (
          <AnimatePresence>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {apps.map((app, i) => (
                <motion.div
                  key={app.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                >
                  <AppCard
                    app={app}
                    publishing={publishingId === app.id}
                    onEdit={() => setEditingApp(app)}
                    onDelete={() => handleDelete(app.id, app.name)}
                    onArchive={() => handleArchive(app.id)}
                    onPublish={() => handlePublish(app.id)}
                    onRename={(name) => handleRename(app.id, name)}
                    onIconUpload={(file) => handleIconUpload(app.id, file)}
                  />
                </motion.div>
              ))}
            </div>
          </AnimatePresence>
        )}

      </div>

      {editingApp && (
        <EditAppModal
          open
          app={editingApp}
          onClose={() => setEditingApp(null)}
          onSaved={(updated) => handleEditSaved(editingApp.id, updated)}
        />
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// AppCard
// ---------------------------------------------------------------------------

interface AppCardProps {
  app:          AppWithStats
  publishing:   boolean
  onEdit:       () => void
  onDelete:     () => void
  onArchive:    () => void
  onPublish:    () => void
  onRename:     (name: string) => void
  onIconUpload: (file: File) => void
}

function AppCard({ app, publishing, onEdit, onDelete, onArchive, onPublish, onRename, onIconUpload }: AppCardProps) {
  const [menuOpen,    setMenuOpen]    = useState(false)
  const [renaming,    setRenaming]    = useState(false)
  const [renameValue, setRenameValue] = useState(app.name)
  const menuRef      = useRef<HTMLDivElement>(null)
  const renameRef    = useRef<HTMLInputElement>(null)
  const iconInputRef = useRef<HTMLInputElement>(null)

  const hue    = ((app.name.charCodeAt(0) ?? 65) * 137) % 360
  const st     = STATUS[app.status] ?? STATUS['DRAFT']!
  const accent = app.primaryColor ?? `hsl(${hue}deg 55% 60%)`

  useEffect(() => {
    if (!menuOpen) return
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [menuOpen])

  useEffect(() => {
    if (renaming) renameRef.current?.select()
  }, [renaming])

  function commitRename() {
    const trimmed = renameValue.trim()
    if (trimmed && trimmed !== app.name) onRename(trimmed)
    else setRenameValue(app.name)
    setRenaming(false)
  }

  function handleIconFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) onIconUpload(file)
    e.target.value = ''
  }

  const isPublished = app.status === 'PUBLISHED'
  const isDraft     = app.status === 'DRAFT'

  return (
    <div
      className={cn(
        'relative flex flex-col rounded-3xl bg-white overflow-hidden',
        'border border-slate-100',
        'shadow-sm hover:shadow-lg hover:shadow-slate-200/60 transition-all duration-200',
        app.status === 'ARCHIVED' && 'opacity-60',
      )}
    >
      {/* Top accent strip — app's brand color */}
      <div className="h-1 w-full shrink-0" style={{ background: accent }} />

      <div className="flex flex-col flex-1 p-4 gap-3">

        {/* Row: Icon + Name + Menu */}
        <div className="flex items-start gap-3">

          {/* Clickable icon */}
          <button
            type="button"
            title="Change logo"
            onClick={() => iconInputRef.current?.click()}
            className="group relative shrink-0 h-14 w-14 rounded-2xl overflow-hidden border border-slate-100 hover:border-sky-300 transition-all duration-150"
          >
            {app.iconUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={app.iconUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <div
                className="flex h-full w-full items-center justify-center text-xl font-black text-white select-none"
                style={{ background: accent }}
              >
                {app.name[0]?.toUpperCase() ?? '?'}
              </div>
            )}
            <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl">
              <ImagePlus className="h-4 w-4 text-white" />
            </div>
          </button>
          <input ref={iconInputRef} type="file" accept="image/*" className="hidden" onChange={handleIconFileChange} />

          {/* Name + status */}
          <div className="flex-1 min-w-0 pt-0.5">
            {renaming ? (
              <input
                ref={renameRef}
                value={renameValue}
                onChange={e => setRenameValue(e.target.value)}
                onBlur={commitRename}
                onKeyDown={e => {
                  if (e.key === 'Enter')  { e.preventDefault(); commitRename() }
                  if (e.key === 'Escape') { setRenameValue(app.name); setRenaming(false) }
                }}
                className="w-full text-sm font-bold text-slate-900 bg-white border border-sky-400 rounded-xl px-2.5 py-1 outline-none ring-2 ring-sky-400/20"
                maxLength={100}
              />
            ) : (
              <Link
                href={`/apps/${app.slug}`}
                className="block text-sm font-black text-slate-900 truncate leading-snug hover:text-sky-600 transition-colors"
              >
                {app.name}
              </Link>
            )}
            <span className={cn(
              'mt-1 inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold',
              st.badge,
            )}>
              <span className={cn('h-1.5 w-1.5 rounded-full', st.dot)} />
              {st.label}
            </span>
          </div>

          {/* Menu */}
          <div ref={menuRef} className="relative shrink-0">
            <button
              type="button"
              onClick={() => setMenuOpen(v => !v)}
              className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-colors"
            >
              <MoreVertical className="h-4 w-4" />
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-9 z-20 min-w-[160px] rounded-2xl border border-slate-100 bg-white py-1.5 shadow-xl shadow-slate-200/60">
                <MenuItem icon={<Type className="h-3.5 w-3.5" />}     label="Rename"       onClick={() => { setMenuOpen(false); setRenaming(true) }} />
                <MenuItem icon={<ImagePlus className="h-3.5 w-3.5" />} label="Change logo"  onClick={() => { setMenuOpen(false); iconInputRef.current?.click() }} />
                {isPublished && (
                  <MenuItem icon={<Archive className="h-3.5 w-3.5" />} label="Archive"     onClick={() => { setMenuOpen(false); onArchive() }} />
                )}
                <div className="my-1 h-px bg-slate-100" />
                <MenuItem icon={<Trash2 className="h-3.5 w-3.5" />}   label="Delete"       danger onClick={() => { setMenuOpen(false); onDelete() }} />
              </div>
            )}
          </div>
        </div>

        {/* Tagline */}
        <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">{app.tagline}</p>

        {/* Visits */}
        <div className="flex items-center gap-1.5 text-xs font-medium text-slate-400">
          <MousePointerClick className="h-3 w-3" />
          {app._count.launchEvents > 0
            ? <span><span className="text-slate-700 font-bold">{app._count.launchEvents}</span> visit{app._count.launchEvents !== 1 ? 's' : ''}</span>
            : <span>No visits yet</span>
          }
        </div>
      </div>

      {/* Footer actions */}
      <div className="flex items-center gap-2 border-t border-slate-50 bg-slate-50/60 px-4 py-3">
        <button
          type="button"
          onClick={onEdit}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-2xl px-3 py-2 text-xs font-semibold border border-slate-200 text-slate-600 bg-white hover:border-sky-300 hover:text-sky-600 transition-all duration-150"
        >
          <Pencil className="h-3 w-3" />
          Edit
        </button>

        {isDraft ? (
          <button
            type="button"
            onClick={onPublish}
            disabled={publishing}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-2xl px-3 py-2 text-xs font-bold bg-gradient-to-r from-sky-500 to-teal-400 text-white shadow-sm shadow-sky-200/60 hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {publishing
              ? <><Loader2 className="h-3 w-3 animate-spin" /> Publishing…</>
              : <><Rocket className="h-3 w-3" /> Publish</>
            }
          </button>
        ) : app.launchUrl ? (
          <a
            href={`${API_BASE}/api/v1/apps/${app.id}/visit`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-1 items-center justify-center gap-1.5 rounded-2xl px-3 py-2 text-xs font-bold bg-gradient-to-r from-sky-500 to-teal-400 text-white shadow-sm shadow-sky-200/60 hover:opacity-90 transition-all"
          >
            <ExternalLink className="h-3 w-3" />
            View Live
          </a>
        ) : (
          <span className="flex flex-1 items-center justify-center gap-1.5 rounded-2xl px-3 py-2 text-xs font-medium border border-slate-100 text-slate-300 cursor-not-allowed select-none">
            <ExternalLink className="h-3 w-3" />
            No URL
          </span>
        )}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// MenuItem
// ---------------------------------------------------------------------------

function MenuItem({ icon, label, onClick, danger = false }: {
  icon: React.ReactNode; label: string; onClick: () => void; danger?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex w-full items-center gap-2.5 px-3.5 py-2 text-xs font-medium transition-colors',
        danger ? 'text-red-500 hover:bg-red-50' : 'text-slate-700 hover:bg-slate-50',
      )}
    >
      {icon}
      {label}
    </button>
  )
}

// ---------------------------------------------------------------------------
// StatCard
// ---------------------------------------------------------------------------

function StatCard({ label, value, icon, color }: {
  label: string; value: number; icon: React.ReactNode
  color: 'slate' | 'sky' | 'teal'
}) {
  const styles = {
    slate: { icon: 'bg-slate-100 text-slate-600', value: 'text-slate-900' },
    sky:   { icon: 'bg-sky-50 text-sky-600',      value: 'text-sky-700'   },
    teal:  { icon: 'bg-teal-50 text-teal-600',    value: 'text-teal-700'  },
  }[color]

  return (
    <div className="rounded-3xl border border-slate-100 bg-white px-4 py-4 shadow-sm">
      <div className={cn('mb-3 flex h-8 w-8 items-center justify-center rounded-xl', styles.icon)}>
        {icon}
      </div>
      <p className={cn('text-2xl font-black', styles.value)}>{value}</p>
      <p className="text-[11px] font-medium text-slate-400 mt-0.5 uppercase tracking-wide">{label}</p>
    </div>
  )
}

// ---------------------------------------------------------------------------
// EmptyState
// ---------------------------------------------------------------------------

function EmptyState({ name }: { name: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="flex flex-col items-center justify-center py-20 text-center"
    >
      <div className="mb-6 relative">
        <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-sky-500 to-teal-400 shadow-lg shadow-sky-200/60">
          <Zap className="h-9 w-9 text-white" />
        </div>
        <span className="absolute -top-2 -right-2 text-2xl">🚀</span>
      </div>
      <h2 className="text-xl font-black text-slate-900">Let&apos;s build something, {name}!</h2>
      <p className="mt-2 text-sm text-slate-500 max-w-xs leading-relaxed">
        You haven&apos;t launched any apps yet. Submit your first one and start earning XP.
      </p>
      <Link href="/submit" className="btn-primary mt-6">
        <Plus className="h-4 w-4" />
        Launch Your First App
      </Link>
    </motion.div>
  )
}
