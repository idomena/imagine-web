'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import {
  LayoutDashboard, Plus, MousePointerClick, CheckCircle,
  Loader2, AlertCircle, MoreVertical, Pencil, ExternalLink,
  Trash2, Archive, ImagePlus, Type, LogOut, Rocket,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/context/AuthContext'
import { EditAppModal, type AppData } from '@/components/submit/EditAppModal'

// ---------------------------------------------------------------------------
// Dashboard — creator's app grid with card-based UI
// ---------------------------------------------------------------------------

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

// Status → { label, dot color, badge bg/text }
const STATUS: Record<string, { label: string; dot: string; badge: string }> = {
  DRAFT:     { label: 'Draft',     dot: 'bg-amber-400',   badge: 'bg-amber-50 text-amber-700 border-amber-200'   },
  SUBMITTED: { label: 'Submitted', dot: 'bg-sky-400',     badge: 'bg-sky-50 text-sky-700 border-sky-200'         },
  IN_REVIEW: { label: 'In Review', dot: 'bg-blue-400',    badge: 'bg-blue-50 text-blue-700 border-blue-200'      },
  APPROVED:  { label: 'Approved',  dot: 'bg-teal-400',    badge: 'bg-teal-50 text-teal-700 border-teal-200'      },
  PUBLISHED: { label: 'Published', dot: 'bg-teal-500',    badge: 'bg-teal-50 text-teal-700 border-teal-200'      },
  REJECTED:  { label: 'Rejected',  dot: 'bg-red-400',     badge: 'bg-red-50 text-red-600 border-red-200'         },
  ARCHIVED:  { label: 'Archived',  dot: 'bg-red-300',     badge: 'bg-red-50 text-red-500 border-red-200'         },
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

  // ── Mutations ──────────────────────────────────────────────────────────────

  async function handleDelete(appId: string, appName: string) {
    if (!confirm(`Delete "${appName}"? This cannot be undone.`)) return
    try {
      const res = await fetch(`${API_BASE}/api/v1/apps/${appId}`, {
        method:  'DELETE',
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

  // ── Derived stats ──────────────────────────────────────────────────────────
  const totalVisits    = apps.reduce((s, a) => s + a._count.launchEvents, 0)
  const publishedCount = apps.filter(a => a.status === 'PUBLISHED').length
  const displayLabel   = user?.displayName || user?.email?.split('@')[0] || ''

  if (authLoading || (!user && !authLoading)) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-[#FDFDF9]">
        <Loader2 className="h-6 w-6 animate-spin text-stone-400" />
      </div>
    )
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#FDFDF9]">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 py-10">

        {/* Header */}
        <div className="mb-8 flex items-center gap-4">
          {user?.avatarUrl ? (
            <Image
              src={user.avatarUrl} alt={displayLabel}
              width={52} height={52}
              className="h-[52px] w-[52px] rounded-full object-cover border border-stone-200 shrink-0"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-full bg-teal-100 text-xl font-bold text-teal-700 uppercase select-none">
              {displayLabel[0] ?? '?'}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-stone-900">
              {displayLabel ? `Hi, ${displayLabel.split(' ')[0]}` : 'My Apps'}
            </h1>
            <p className="text-sm text-stone-500 truncate">{user?.email} — manage your apps</p>
          </div>
          {/* Add App button — always visible, prominent on mobile */}
          <Link
            href="/submit"
            className={cn(
              'relative z-10 flex shrink-0 items-center gap-1.5 rounded-full transition-colors',
              'bg-teal-700 text-white hover:bg-teal-600',
              'px-3 py-2 sm:px-4 sm:py-2',
              'text-xs sm:text-sm font-semibold shadow-sm',
            )}
            aria-label="Submit a new app"
          >
            <Plus className="h-4 w-4" aria-hidden />
            <span className="hidden xs:inline sm:inline">Add App</span>
          </Link>
          <button
            type="button"
            onClick={() => { logout(); router.replace('/') }}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-stone-400 hover:bg-stone-100 hover:text-stone-600 transition-colors"
            title="Sign out"
            aria-label="Sign out"
          >
            <LogOut className="h-4 w-4" aria-hidden />
          </button>
        </div>

        {/* Stats */}
        <div className="mb-8 grid grid-cols-3 gap-3 sm:gap-4">
          <StatCard label="Total Apps"   value={apps.length}    icon={<LayoutDashboard className="h-4 w-4" />} color="stone"  />
          <StatCard label="Published"    value={publishedCount} icon={<CheckCircle className="h-4 w-4" />}     color="teal"   />
          <StatCard label="Total Visits" value={totalVisits}    icon={<MousePointerClick className="h-4 w-4"/>} color="indigo" />
        </div>

        {/* Security alert — shown when apps are held for manual review */}
        {!loading && apps.some(a =>
          a.status === 'SUBMITTED' && a.securityAuditReport != null
        ) && (
          <div className="mb-6 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
            <div>
              <p className="font-semibold">Security Review Required</p>
              <p className="mt-0.5 font-light text-red-600">
                {apps.filter(a => a.status === 'SUBMITTED' && a.securityAuditReport != null).length === 1
                  ? 'One of your apps did not pass the automated security check and is awaiting manual review.'
                  : `${apps.filter(a => a.status === 'SUBMITTED' && a.securityAuditReport != null).length} of your apps did not pass the automated security check and are awaiting manual review.`}
              </p>
            </div>
          </div>
        )}

        {/* App grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-stone-400" />
          </div>
        ) : error ? (
          <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-600">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            {error}
          </div>
        ) : apps.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {apps.map(app => (
              <AppCard
                key={app.id}
                app={app}
                publishing={publishingId === app.id}
                onEdit={() => setEditingApp(app)}
                onDelete={() => handleDelete(app.id, app.name)}
                onArchive={() => handleArchive(app.id)}
                onPublish={() => handlePublish(app.id)}
                onRename={(name) => handleRename(app.id, name)}
                onIconUpload={(file) => handleIconUpload(app.id, file)}
              />
            ))}
          </div>
        )}

      </div>
      {/* Edit modal */}
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
  const menuRef    = useRef<HTMLDivElement>(null)
  const renameRef  = useRef<HTMLInputElement>(null)
  const iconInputRef = useRef<HTMLInputElement>(null)

  const hue    = ((app.name.charCodeAt(0) ?? 65) * 137) % 360
  const st     = STATUS[app.status] ?? STATUS['DRAFT']!
  const accent = app.primaryColor ?? null

  // Close menu on outside click
  useEffect(() => {
    if (!menuOpen) return
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [menuOpen])

  // Focus rename input when it opens
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

  return (
    <div
      className={cn(
        'relative flex flex-col rounded-2xl border border-stone-200/80 bg-white overflow-hidden',
        'shadow-sm hover:shadow-md transition-shadow duration-200',
        app.status === 'ARCHIVED' && 'opacity-70',
      )}
      style={{
        background: 'linear-gradient(145deg, #ffffff 0%, #f8f7f4 100%)',
      }}
    >
      {/* Top accent strip — primaryColor if set, else status dot color */}
      <div
        className={cn('h-0.5 w-full', !accent && st.dot)}
        style={accent ? { backgroundColor: accent } : undefined}
      />

      {/* Card body */}
      <div className="p-4 flex flex-col gap-3 flex-1">

        {/* Row 1: Icon + Name + Menu */}
        <div className="flex items-start gap-3">

          {/* App icon / logo */}
          <button
            type="button"
            title="Change logo"
            onClick={() => iconInputRef.current?.click()}
            className="group relative shrink-0 h-12 w-12 rounded-xl overflow-hidden border border-stone-200 bg-stone-100 hover:border-teal-300 transition-colors"
          >
            {app.iconUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={app.iconUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <div
                className="flex h-full w-full items-center justify-center text-lg font-bold text-white select-none"
                style={{ background: accent ?? `hsl(${hue}deg 35% 75%)` }}
              >
                {app.name[0]?.toUpperCase() ?? '?'}
              </div>
            )}
            <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl">
              <ImagePlus className="h-4 w-4 text-white" />
            </div>
          </button>
          <input
            ref={iconInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleIconFileChange}
          />

          {/* Name + status */}
          <div className="flex-1 min-w-0">
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
                className="w-full text-sm font-semibold text-stone-900 bg-white border border-teal-400 rounded-lg px-2 py-0.5 outline-none ring-2 ring-teal-400/20"
                maxLength={100}
              />
            ) : (
              <Link
                href={`/apps/${app.slug}`}
                className="text-sm font-semibold text-stone-900 truncate leading-snug hover:text-teal-700 transition-colors"
              >
                {app.name}
              </Link>
            )}
            {/* Status badge */}
            <span className={cn(
              'mt-1 inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium',
              st.badge,
            )}>
              <span className={cn('h-1.5 w-1.5 rounded-full', st.dot)} />
              {st.label}
            </span>
          </div>

          {/* Three-dot menu */}
          <div ref={menuRef} className="relative shrink-0">
            <button
              type="button"
              onClick={() => setMenuOpen(v => !v)}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-stone-400 hover:bg-stone-100 hover:text-stone-600 transition-colors"
              aria-label="More options"
            >
              <MoreVertical className="h-4 w-4" />
            </button>

            {menuOpen && (
              <div className="absolute right-0 top-8 z-20 min-w-[160px] rounded-xl border border-stone-200 bg-white py-1 shadow-lg">
                <MenuItem
                  icon={<Type className="h-3.5 w-3.5" />}
                  label="Rename"
                  onClick={() => { setMenuOpen(false); setRenaming(true) }}
                />
                <MenuItem
                  icon={<ImagePlus className="h-3.5 w-3.5" />}
                  label="Change logo"
                  onClick={() => { setMenuOpen(false); iconInputRef.current?.click() }}
                />
                {app.status === 'PUBLISHED' && (
                  <MenuItem
                    icon={<Archive className="h-3.5 w-3.5" />}
                    label="Archive"
                    onClick={() => { setMenuOpen(false); onArchive() }}
                  />
                )}
                <div className="my-1 h-px bg-stone-100" />
                <MenuItem
                  icon={<Trash2 className="h-3.5 w-3.5" />}
                  label="Delete"
                  danger
                  onClick={() => { setMenuOpen(false); onDelete() }}
                />
              </div>
            )}
          </div>
        </div>

        {/* Tagline */}
        <p className="text-xs text-stone-500 line-clamp-2 leading-relaxed">{app.tagline}</p>

        {/* Visits */}
        <div className="flex items-center gap-1 text-xs text-stone-400">
          <MousePointerClick className="h-3 w-3" />
          <span>{app._count.launchEvents} visit{app._count.launchEvents !== 1 ? 's' : ''}</span>
        </div>
      </div>

      {/* Footer actions */}
      <div className="flex items-center gap-2 border-t border-stone-100 px-4 py-3 bg-stone-50/50">
        <button
          type="button"
          onClick={onEdit}
          className={cn(
            'flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-1.5',
            'text-xs font-medium border transition-colors',
            'border-stone-200 text-stone-600 hover:bg-white hover:border-stone-300',
          )}
        >
          <Pencil className="h-3 w-3" />
          Edit
        </button>

        {app.status === 'DRAFT' ? (
          <button
            type="button"
            onClick={onPublish}
            disabled={publishing}
            className={cn(
              'flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-1.5',
              'text-xs font-medium border transition-colors',
              'bg-teal-600 border-teal-600 text-white hover:bg-teal-700 hover:border-teal-700',
              'disabled:opacity-60 disabled:cursor-not-allowed',
            )}
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
            className={cn(
              'flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-1.5',
              'text-xs font-medium border transition-colors',
              'bg-teal-600 border-teal-600 text-white hover:bg-teal-700 hover:border-teal-700',
            )}
          >
            <ExternalLink className="h-3 w-3" />
            Live Page
          </a>
        ) : (
          <span className={cn(
            'flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-1.5',
            'text-xs font-medium border border-stone-200 text-stone-300 cursor-not-allowed select-none',
          )}>
            <ExternalLink className="h-3 w-3" />
            No URL
          </span>
        )}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Menu item
// ---------------------------------------------------------------------------

function MenuItem({
  icon, label, onClick, danger = false,
}: {
  icon: React.ReactNode; label: string; onClick: () => void; danger?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex w-full items-center gap-2.5 px-3 py-1.5 text-xs transition-colors',
        danger
          ? 'text-red-500 hover:bg-red-50'
          : 'text-stone-700 hover:bg-stone-50',
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
  color: 'stone' | 'teal' | 'indigo'
}) {
  const bg   = { stone: 'bg-stone-100', teal: 'bg-teal-50',    indigo: 'bg-indigo-50'    }[color]
  const text = { stone: 'text-stone-600', teal: 'text-teal-700', indigo: 'text-indigo-700' }[color]
  return (
    <div className="rounded-2xl border border-stone-200 bg-white px-3 py-3 sm:px-5 sm:py-4">
      <div className={cn('mb-2 flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg', bg, text)}>{icon}</div>
      <p className="text-xl sm:text-2xl font-bold text-stone-900">{value}</p>
      <p className="text-[10px] sm:text-xs text-stone-500 mt-0.5">{label}</p>
    </div>
  )
}

// ---------------------------------------------------------------------------
// EmptyState
// ---------------------------------------------------------------------------

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-teal-50 border border-teal-100">
        <Plus className="h-7 w-7 text-teal-600" />
      </div>
      <h2 className="text-base font-semibold text-stone-800">No apps yet</h2>
      <p className="mt-1.5 text-sm text-stone-500 max-w-xs">
        Submit your first app using the &ldquo;Submit App&rdquo; button in the navigation.
      </p>
    </div>
  )
}
