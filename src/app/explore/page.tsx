'use client'

import { useEffect, useState, useMemo, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, X, Compass, ArrowUpRight, Star, Sparkles } from 'lucide-react'
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
    <div className="min-h-[calc(100vh-4rem)] bg-background">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 py-8">

        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 text-center sm:text-left"
        >
          <div className="inline-flex items-center gap-2.5 mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 shadow-lg shadow-emerald-200/50">
              <Compass className="h-5 w-5 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-stone-900">Explore Apps</h1>
          </div>
          <p className="text-sm text-stone-500">Discover published apps from the community</p>
        </motion.div>

        {/* Search bar */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="relative mb-6"
        >
          <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-stone-400" />
          <input
            type="search"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search apps..."
            className={cn(
              'w-full rounded-2xl border-2 border-stone-200 bg-white py-4 pl-12 pr-12 text-base text-stone-800',
              'placeholder:text-stone-400 outline-none transition-all shadow-lg shadow-stone-100/50',
              'focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100',
            )}
          />
          {query && (
            <motion.button
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              type="button"
              onClick={() => setQuery('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-stone-100 text-stone-500 hover:bg-stone-200 transition-colors"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </motion.button>
          )}
        </motion.div>

        {/* Category filter pills */}
        {categories.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="mb-8 flex flex-wrap gap-2 justify-center sm:justify-start"
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

        {/* Results */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <motion.div 
                key={i} 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.05 }}
                className="h-56 rounded-3xl bg-stone-100 animate-pulse" 
              />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState category={activeCategory?.name ?? null} hasQuery={query.trim().length > 0} />
        ) : (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4"
          >
            <AnimatePresence>
              {filtered.map((app, index) => (
                <AppCard key={app.id} app={app} index={index} />
              ))}
            </AnimatePresence>
          </motion.div>
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
      <div className="min-h-[calc(100vh-4rem)] bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin" />
          <span className="text-sm font-semibold text-stone-500">Loading apps...</span>
        </div>
      </div>
    }>
      <ExploreInner />
    </Suspense>
  )
}

// ---------------------------------------------------------------------------
// AppCard — gamified grid card
// ---------------------------------------------------------------------------

function AppCard({ app, index }: { app: App; index: number }) {
  const color = app.primaryColor ?? '#10B981'

  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ delay: index * 0.05, type: 'spring', stiffness: 100 }}
      whileHover={{ y: -8, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <Link
        href={`/apps/${app.slug}`}
        className="group flex flex-col rounded-3xl overflow-hidden border-2 border-stone-200/60 bg-white shadow-xl shadow-stone-100/50 hover:border-emerald-200 hover:shadow-2xl hover:shadow-emerald-100/40 transition-all duration-300 cursor-pointer"
      >
        {/* Colored top with floating icon */}
        <div
          className="relative flex h-24 shrink-0 items-center justify-center"
          style={{ background: `linear-gradient(135deg, ${color}30 0%, ${color}60 100%)` }}
        >
          <motion.div 
            whileHover={{ scale: 1.1, rotate: 5 }}
            className="h-16 w-16 overflow-hidden rounded-2xl bg-white shadow-lg ring-4 ring-white/80"
          >
            {app.iconUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={app.iconUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <div
                className="flex h-full w-full items-center justify-center text-2xl font-bold text-white"
                style={{ background: color }}
              >
                {app.name[0]?.toUpperCase() ?? '?'}
              </div>
            )}
          </motion.div>
          
          {/* XP badge */}
          <div className="absolute top-2 right-2 flex items-center gap-1 rounded-full bg-white/90 px-2 py-1 text-[10px] font-bold text-purple-600 shadow-sm backdrop-blur-sm">
            <Star className="h-3 w-3 fill-current" />
            +50
          </div>
        </div>

        {/* Content */}
        <div className="flex flex-1 flex-col p-4">
          <h3 className="text-sm font-bold text-stone-900 truncate group-hover:text-emerald-600 transition-colors">
            {app.name}
          </h3>
          <p className="mt-1 text-xs text-stone-500 line-clamp-2 leading-relaxed flex-1">
            {app.tagline}
          </p>
          <div className="mt-3 flex items-center justify-between">
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-stone-400">
              {app._count?.launchEvents ? (
                <>
                  <Sparkles className="h-3 w-3" />
                  {app._count.launchEvents}
                </>
              ) : (
                'New'
              )}
            </span>
            <motion.span
              whileHover={{ scale: 1.05 }}
              className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-[10px] font-bold text-white shadow-md transition-all duration-200"
              style={{ background: color }}
            >
              Open <ArrowUpRight className="h-3 w-3" />
            </motion.span>
          </div>
        </div>
      </Link>
    </motion.div>
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
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-full border-2 px-4 py-2 text-xs font-bold transition-all duration-200',
        active
          ? 'border-emerald-500 bg-emerald-500 text-white shadow-lg shadow-emerald-200/50'
          : 'border-stone-200 bg-white text-stone-600 hover:border-emerald-300 hover:bg-emerald-50',
      )}
    >
      {label}
    </motion.button>
  )
}

// ---------------------------------------------------------------------------
// Empty state
// ---------------------------------------------------------------------------

function EmptyState({ category, hasQuery }: { category: string | null; hasQuery: boolean }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-20 text-center"
    >
      <motion.div 
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', delay: 0.1 }}
        className="mb-4 flex h-20 w-20 items-center justify-center rounded-3xl bg-stone-100"
      >
        <span className="text-4xl">
          {hasQuery ? '🔍' : category ? '📂' : '✨'}
        </span>
      </motion.div>
      {category ? (
        <>
          <h2 className="text-lg font-bold text-stone-800">Nothing in {category} yet</h2>
          <p className="mt-2 text-sm text-stone-500 max-w-xs">
            Be the first to submit an app in this category.
          </p>
        </>
      ) : hasQuery ? (
        <>
          <h2 className="text-lg font-bold text-stone-800">No results</h2>
          <p className="mt-2 text-sm text-stone-500 max-w-xs">
            Try different keywords or browse everything.
          </p>
        </>
      ) : (
        <>
          <h2 className="text-lg font-bold text-stone-800">No apps published yet</h2>
          <p className="mt-2 text-sm text-stone-500 max-w-xs">
            Check back soon apps are being reviewed.
          </p>
        </>
      )}
      <motion.a
        href="/submit"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-emerald-500 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-200/50"
      >
        Submit an app
      </motion.a>
    </motion.div>
  )
}
