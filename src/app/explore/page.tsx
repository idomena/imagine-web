'use client'

import { useEffect, useState, useMemo, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Search, X, Compass, ArrowUpRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { apiClient } from '@/lib/api/client'

// ---------------------------------------------------------------------------
// Explore page  — /explore?category=Finance
// ---------------------------------------------------------------------------

interface App {
  id:           string
  slug:         string
  name:         string
  tagline:      string
  iconUrl:      string | null
  primaryColor: string | null
  categoryId:   string | null
  _count?:      { launchEvents: number }
}

interface Category {
  id:   string
  name: string
  slug: string
}

// ---------------------------------------------------------------------------
// Inner component
// ---------------------------------------------------------------------------

function ExploreInner() {
  const searchParams = useSearchParams()
  const router       = useRouter()

  const categoryParam = searchParams.get('category') ?? ''

  const [query,      setQuery]      = useState('')
  const [apps,       setApps]       = useState<App[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading,    setLoading]    = useState(true)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const [appsJson, catsJson] = await Promise.all([
          apiClient.get<{ data: { items: App[] } }>('/api/v1/apps?limit=100'),
          apiClient.get<{ data: Category[] }>('/api/v1/categories'),
        ])
        if (!cancelled) {
          setApps(appsJson.data?.items ?? [])
          setCategories(catsJson.data ?? [])
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void load()
    return () => { cancelled = true }
  }, [])

  const activeCategory = useMemo(
    () => categoryParam
      ? categories.find(c => c.name.toLowerCase() === categoryParam.toLowerCase()) ?? null
      : null,
    [categoryParam, categories],
  )

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return apps.filter(app => {
      const matchesSearch = !q
        || app.name.toLowerCase().includes(q)
        || app.tagline.toLowerCase().includes(q)
      const matchesCategory = !activeCategory || app.categoryId === activeCategory.id
      return matchesSearch && matchesCategory
    })
  }, [apps, query, activeCategory])

  function selectCategory(name: string | null) {
    const params = new URLSearchParams(searchParams.toString())
    if (name) params.set('category', name)
    else      params.delete('category')
    router.replace(`/explore?${params.toString()}`)
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#FDFCF8] animate-fade-in">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 py-10">

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2.5 mb-1">
            <Compass className="h-5 w-5 text-teal-600" />
            <h1 className="text-2xl font-bold text-stone-900">Explore Apps</h1>
          </div>
          <p className="text-sm text-stone-500">Discover published apps from the community.</p>
        </div>

        {/* Search bar */}
        <div className="relative mb-6">
          <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
          <input
            type="search"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search apps…"
            className={cn(
              'w-full rounded-2xl border border-stone-200 bg-white py-3.5 pl-11 pr-10 text-sm text-stone-800',
              'placeholder:text-stone-400 outline-none transition shadow-sm',
              'focus:border-violet-400 focus:ring-2 focus:ring-violet-400/20',
            )}
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 transition-colors"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Category filter pills */}
        {categories.length > 0 && (
          <div className="mb-8 flex flex-wrap gap-2">
            <FilterPill label="All" active={!activeCategory} onClick={() => selectCategory(null)} />
            {categories.map(cat => (
              <FilterPill
                key={cat.id}
                label={cat.name}
                active={activeCategory?.id === cat.id}
                onClick={() => selectCategory(cat.name)}
              />
            ))}
          </div>
        )}

        {/* Results */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-52 rounded-2xl bg-stone-100 animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState category={activeCategory?.name ?? null} hasQuery={query.trim().length > 0} />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {filtered.map(app => (
              <AppCard key={app.id} app={app} />
            ))}
          </div>
        )}

      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Page wrapper
// ---------------------------------------------------------------------------

export default function ExplorePage() {
  return (
    <Suspense fallback={
      <div className="min-h-[calc(100vh-4rem)] bg-[#FDFCF8] flex items-center justify-center">
        <div className="h-8 w-8 rounded-full border-2 border-violet-500 border-t-transparent animate-spin" />
      </div>
    }>
      <ExploreInner />
    </Suspense>
  )
}

// ---------------------------------------------------------------------------
// AppCard — fun vertical grid card
// ---------------------------------------------------------------------------

function AppCard({ app }: { app: App }) {
  const color = app.primaryColor ?? '#0D9488'

  return (
    <Link
      href={`/apps/${app.slug}`}
      className="group flex flex-col rounded-2xl overflow-hidden border border-stone-200/80 bg-white shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-200 cursor-pointer"
    >
      {/* Colored top with floating icon */}
      <div
        className="relative flex h-[88px] shrink-0 items-center justify-center"
        style={{ background: `linear-gradient(135deg, ${color}28 0%, ${color}55 100%)` }}
      >
        <div className="h-14 w-14 overflow-hidden rounded-2xl bg-white shadow-md ring-2 ring-white/80">
          {app.iconUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={app.iconUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <div
              className="flex h-full w-full items-center justify-center text-xl font-bold text-white"
              style={{ background: color }}
            >
              {app.name[0]?.toUpperCase() ?? '?'}
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col p-3.5">
        <h3 className="text-sm font-bold text-stone-900 truncate group-hover:text-teal-700 transition-colors">
          {app.name}
        </h3>
        <p className="mt-1 text-xs text-stone-500 line-clamp-2 leading-relaxed flex-1">
          {app.tagline}
        </p>
        <div className="mt-3 flex items-center justify-between">
          <span className="text-[10px] font-medium text-stone-400">
            {app._count?.launchEvents
              ? `${app._count.launchEvents} launch${app._count.launchEvents === 1 ? '' : 'es'}`
              : 'New'}
          </span>
          <span
            className="inline-flex items-center gap-0.5 rounded-full px-2.5 py-1 text-[10px] font-semibold text-white transition-all duration-150 group-hover:gap-1"
            style={{ background: color }}
          >
            Open <ArrowUpRight className="h-3 w-3" />
          </span>
        </div>
      </div>
    </Link>
  )
}

// ---------------------------------------------------------------------------
// FilterPill
// ---------------------------------------------------------------------------

function FilterPill({ label, active, onClick }: {
  label:   string
  active:  boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-all duration-150',
        active
          ? 'border-stone-900 bg-stone-900 text-white shadow-sm'
          : 'border-stone-200 bg-white text-stone-600 hover:border-stone-400 hover:bg-stone-50',
      )}
    >
      {label}
    </button>
  )
}

// ---------------------------------------------------------------------------
// Empty state
// ---------------------------------------------------------------------------

function EmptyState({ category, hasQuery }: { category: string | null; hasQuery: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="mb-4 text-5xl">
        {hasQuery ? '🔍' : category ? '📂' : '✨'}
      </div>
      {category ? (
        <>
          <h2 className="text-base font-bold text-stone-800">Nothing in {category} yet</h2>
          <p className="mt-1.5 text-sm text-stone-500 max-w-xs">
            Be the first to submit an app in this category.
          </p>
        </>
      ) : hasQuery ? (
        <>
          <h2 className="text-base font-bold text-stone-800">No results</h2>
          <p className="mt-1.5 text-sm text-stone-500 max-w-xs">
            Try different keywords or browse everything.
          </p>
        </>
      ) : (
        <>
          <h2 className="text-base font-bold text-stone-800">No apps published yet</h2>
          <p className="mt-1.5 text-sm text-stone-500 max-w-xs">
            Check back soon — apps are being reviewed.
          </p>
        </>
      )}
    </div>
  )
}
