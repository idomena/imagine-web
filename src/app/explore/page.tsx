'use client'

import { useEffect, useState, useMemo, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Search, X, Compass } from 'lucide-react'
import { cn } from '@/lib/utils'
import { apiClient } from '@/lib/api/client'

// ---------------------------------------------------------------------------
// Explore page  — /explore?category=Finance
// Fetches all published apps + all categories; filters client-side.
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
// Inner component — needs useSearchParams, so must be inside Suspense
// ---------------------------------------------------------------------------

function ExploreInner() {
  const searchParams = useSearchParams()
  const router       = useRouter()

  const categoryParam = searchParams.get('category') ?? ''

  const [query,      setQuery]      = useState('')
  const [apps,       setApps]       = useState<App[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading,    setLoading]    = useState(true)

  // Fetch apps + categories once
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

  // Active category object (by name match from URL param)
  const activeCategory = useMemo(
    () => categoryParam
      ? categories.find(c => c.name.toLowerCase() === categoryParam.toLowerCase()) ?? null
      : null,
    [categoryParam, categories],
  )

  // Filtered apps
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
    <div className="min-h-[calc(100vh-4rem)] bg-[#FDFDF9] animate-fade-in">
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
          <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
          <input
            type="search"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search apps…"
            className={cn(
              'w-full rounded-2xl border border-stone-200 bg-white py-3 pl-10 pr-10 text-sm text-stone-800',
              'placeholder:text-stone-400 outline-none transition',
              'focus:border-teal-400 focus:ring-2 focus:ring-teal-400/20',
            )}
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Category filter pills */}
        {categories.length > 0 && (
          <div className="mb-8 flex flex-wrap gap-2">
            <FilterPill
              label="All"
              active={!activeCategory}
              onClick={() => selectCategory(null)}
            />
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-36 rounded-2xl bg-stone-100 animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState category={activeCategory?.name ?? null} hasQuery={query.trim().length > 0} />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
// Page wrapper — Suspense required for useSearchParams in App Router
// ---------------------------------------------------------------------------

export default function ExplorePage() {
  return (
    <Suspense fallback={
      <div className="min-h-[calc(100vh-4rem)] bg-[#FDFDF9] flex items-center justify-center">
        <div className="h-8 w-8 rounded-full border-2 border-teal-500 border-t-transparent animate-spin" />
      </div>
    }>
      <ExploreInner />
    </Suspense>
  )
}

// ---------------------------------------------------------------------------
// AppCard
// ---------------------------------------------------------------------------

function AppCard({ app }: { app: App }) {
  const color = app.primaryColor ?? '#14b8a6'
  return (
    <Link
      href={`/apps/${app.slug}`}
      className="group flex items-start gap-3 rounded-2xl border border-stone-200/80 bg-white p-4 shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5"
    >
      {/* Icon */}
      <div
        className="shrink-0 h-12 w-12 rounded-xl overflow-hidden border border-stone-100 flex items-center justify-center text-lg font-bold text-white select-none"
        style={{ background: app.iconUrl ? undefined : color }}
      >
        {app.iconUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={app.iconUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          app.name[0]?.toUpperCase() ?? '?'
        )}
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-stone-900 truncate group-hover:text-teal-700 transition-colors">
          {app.name}
        </p>
        <p className="mt-0.5 text-xs text-stone-500 line-clamp-2 leading-relaxed">
          {app.tagline}
        </p>
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
        'rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors',
        active
          ? 'border-teal-500 bg-teal-500 text-white'
          : 'border-stone-200 bg-white text-stone-600 hover:border-stone-300 hover:bg-stone-50',
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
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-stone-100 border border-stone-200">
        <Search className="h-7 w-7 text-stone-400" />
      </div>
      {category ? (
        <>
          <h2 className="text-base font-semibold text-stone-800">No apps in {category} yet</h2>
          <p className="mt-1.5 text-sm text-stone-500 max-w-xs">
            Be the first to submit an app in this category.
          </p>
        </>
      ) : hasQuery ? (
        <>
          <h2 className="text-base font-semibold text-stone-800">No results found</h2>
          <p className="mt-1.5 text-sm text-stone-500 max-w-xs">
            Try different keywords or browse all apps.
          </p>
        </>
      ) : (
        <>
          <h2 className="text-base font-semibold text-stone-800">No apps published yet</h2>
          <p className="mt-1.5 text-sm text-stone-500 max-w-xs">
            Check back soon — apps are being reviewed.
          </p>
        </>
      )}
    </div>
  )
}
