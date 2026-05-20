'use client'

import { useEffect, useState, useMemo, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, X, Compass } from 'lucide-react'
import { cn } from '@/lib/utils'
import { apiClient } from '@/lib/api/client'
import { AppCard } from '@/components/apps/AppCard'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface App {
  id:           string
  slug:         string
  name:         string
  tagline:      string
  iconUrl:      string | null
  primaryColor: string | null
  categoryId:   string | null
  publishedAt:  string | null
  launchUrl:    string | null
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
      const matchesSearch   = !q || app.name.toLowerCase().includes(q) || app.tagline.toLowerCase().includes(q)
      const matchesCategory = !activeCategory || app.categoryId === activeCategory.id
      return matchesSearch && matchesCategory
    })
  }, [apps, query, activeCategory])

  const categoryMap = useMemo(
    () => new Map(categories.map(c => [c.id, c.name])),
    [categories],
  )

  function selectCategory(name: string | null) {
    const params = new URLSearchParams(searchParams.toString())
    if (name) params.set('category', name)
    else      params.delete('category')
    router.replace(`/explore?${params.toString()}`)
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] animate-fade-in" style={{ background: 'rgb(var(--color-background))' }}>
      <div className="mx-auto max-w-5xl px-4 sm:px-6 py-10">

        {/* ── Hero header ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="mb-10"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 to-teal-400 shadow-lg shadow-sky-200/60">
              <Compass className="h-5 w-5 text-white" aria-hidden />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">Explore Apps</h1>
              <p className="text-sm text-slate-500">Discover AI tools for every skill</p>
            </div>
          </div>

          {/* Stats chips */}
          {!loading && apps.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.25 }}
              className="flex items-center gap-2 mt-4"
            >
              <span className="rounded-full bg-sky-50 border border-sky-200 px-3 py-1 text-xs font-semibold text-sky-700">
                {apps.length} apps
              </span>
              {activeCategory && (
                <span className="rounded-full bg-teal-50 border border-teal-200 px-3 py-1 text-xs font-semibold text-teal-700">
                  {filtered.length} in {activeCategory.name}
                </span>
              )}
              {query && (
                <span className="rounded-full bg-amber-50 border border-amber-200 px-3 py-1 text-xs font-semibold text-amber-700">
                  {filtered.length} results
                </span>
              )}
            </motion.div>
          )}
        </motion.div>

        {/* ── Search bar ── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="relative mb-6"
        >
          <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="search"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search apps…"
            className={cn(
              'w-full rounded-2xl border border-slate-200 bg-white py-3.5 pl-11 pr-10 text-sm text-slate-800',
              'placeholder:text-slate-400 outline-none transition-all shadow-sm',
              'focus:border-sky-400 focus:ring-2 focus:ring-sky-400/20 focus:shadow-md',
            )}
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </motion.div>

        {/* ── Category filter pills ── */}
        {categories.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="mb-8 flex flex-wrap gap-2"
          >
            <FilterPill label="All" active={!activeCategory} onClick={() => selectCategory(null)} />
            {categories.map(cat => (
              <FilterPill
                key={cat.id}
                label={cat.name}
                active={activeCategory?.id === cat.id}
                onClick={() => selectCategory(cat.name)}
              />
            ))}
          </motion.div>
        )}

        {/* ── Results ── */}
        {loading ? (
          <SkeletonGrid />
        ) : filtered.length === 0 ? (
          <EmptyState category={activeCategory?.name ?? null} hasQuery={query.trim().length > 0} />
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={`${activeCategory?.id ?? 'all'}-${query}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4"
            >
              {filtered.map((app, i) => (
                <AppCard
                  key={app.id}
                  app={app as any}
                  categoryName={app.categoryId ? categoryMap.get(app.categoryId) : undefined}
                  index={i}
                />
              ))}
            </motion.div>
          </AnimatePresence>
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
    <Suspense fallback={<LoadingScreen />}>
      <ExploreInner />
    </Suspense>
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
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={{ scale: 1.04 }}
      whileTap={{ scale: 0.96 }}
      className={cn(
        'rounded-full border px-3.5 py-1.5 text-xs font-bold transition-all duration-150',
        active
          ? 'border-sky-500 bg-gradient-to-r from-sky-500 to-teal-400 text-white shadow-md shadow-sky-200/60'
          : 'border-slate-200 bg-white text-slate-600 hover:border-sky-300 hover:bg-sky-50 hover:text-sky-700',
      )}
    >
      {label}
    </motion.button>
  )
}

// ---------------------------------------------------------------------------
// Skeleton grid
// ---------------------------------------------------------------------------

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="h-[220px] rounded-3xl bg-slate-100 animate-pulse" />
      ))}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Loading screen
// ---------------------------------------------------------------------------

function LoadingScreen() {
  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center" style={{ background: 'rgb(var(--color-background))' }}>
      <div className="h-8 w-8 rounded-full border-2 border-sky-500 border-t-transparent animate-spin" />
    </div>
  )
}

// ---------------------------------------------------------------------------
// Empty state
// ---------------------------------------------------------------------------

function EmptyState({ category, hasQuery }: { category: string | null; hasQuery: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="flex flex-col items-center justify-center py-20 text-center"
    >
      <div className="mb-4 text-5xl">
        {hasQuery ? '🔍' : category ? '📂' : '✨'}
      </div>
      {category ? (
        <>
          <h2 className="text-base font-black text-slate-800">Nothing in {category} yet</h2>
          <p className="mt-1.5 text-sm text-slate-500 max-w-xs">
            Be the first to submit an app in this category.
          </p>
        </>
      ) : hasQuery ? (
        <>
          <h2 className="text-base font-black text-slate-800">No results</h2>
          <p className="mt-1.5 text-sm text-slate-500 max-w-xs">
            Try different keywords or browse everything.
          </p>
        </>
      ) : (
        <>
          <h2 className="text-base font-black text-slate-800">No apps published yet</h2>
          <p className="mt-1.5 text-sm text-slate-500 max-w-xs">
            Check back soon — apps are being reviewed.
          </p>
        </>
      )}
    </motion.div>
  )
}
