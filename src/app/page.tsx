import Link from 'next/link'
import { Sparkles, AlertCircle } from 'lucide-react'
import { AppCard }        from '@/components/apps/AppCard'
import { FeedSection }    from '@/components/feed/FeedSection'
import { HeroOrWelcome }  from '@/components/home/HeroOrWelcome'
import { HeroInput }      from '@/components/home/HeroInput'
import { apiClient }      from '@/lib/api/client'
import type { ApiResponse, App, Category, Paginated } from '@/lib/api/types'
import type { AppBadge } from '@/components/apps/AppCard'

// ---------------------------------------------------------------------------
// Data fetching
// ---------------------------------------------------------------------------

interface FeedData {
  apps:       App[]
  categories: Category[]
  error?:     string
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j]!, a[i]!]
  }
  return a
}

async function getFeedData(): Promise<FeedData> {
  try {
    const opts = { next: { revalidate: 60 } } as RequestInit
    const [appsRes, catsRes] = await Promise.all([
      apiClient.get<ApiResponse<Paginated<App>>>('/api/v1/apps?limit=50', opts),
      apiClient.get<ApiResponse<Category[]>>('/api/v1/categories', opts),
    ])
    return { apps: shuffle(appsRes.data.items), categories: catsRes.data }
  } catch {
    return { apps: [], categories: [], error: 'Could not reach the API.' }
  }
}

function computeBadge(publishedAt: Date | string | null | undefined): AppBadge | undefined {
  if (!publishedAt) return undefined
  const d = publishedAt instanceof Date ? publishedAt : new Date(publishedAt as string)
  if (isNaN(d.getTime())) return undefined
  const days = (Date.now() - d.getTime()) / 86_400_000
  if (days <= 7)  return 'new'
  if (days <= 30) return 'trending'
  return undefined
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function HomePage() {
  const { apps, categories, error } = await getFeedData()
  const categoryMap = new Map(categories.map((c) => [c.id, c.name]))

  return (
    <div className="min-h-screen bg-slate-50">

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <HeroOrWelcome hero={
        <section className="relative sm:-mt-[88px] overflow-hidden bg-slate-50" style={{ minHeight: '100svh' }}>

          {/* Cloud blobs — animated, pointer-events-none */}
          <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
            {/* Blob 1 — teal, top-left */}
            <div className="animate-blob-1 absolute -top-24 -left-24 h-[480px] w-[480px] rounded-full bg-teal-200/25 blur-3xl" />
            {/* Blob 2 — indigo, center-right */}
            <div className="animate-blob-2 absolute top-1/4 -right-32 h-[420px] w-[420px] rounded-full bg-indigo-200/20 blur-3xl" />
            {/* Blob 3 — violet, bottom-center */}
            <div className="animate-blob-3 absolute bottom-0 left-1/3 h-[360px] w-[360px] rounded-full bg-violet-100/20 blur-3xl" />
          </div>

          <div className="relative z-10 flex min-h-[inherit] flex-col items-center justify-center px-5 sm:px-8 pb-20 sm:pb-32 pt-28 sm:pt-48">
            <div className="flex w-full max-w-4xl flex-col items-center text-center">

              {/* Eyebrow badge */}
              <div className="animate-fade-up mb-7 inline-flex items-center gap-2 rounded-full border border-teal-200/70 bg-teal-50 px-3.5 py-1 text-[11px] font-semibold uppercase tracking-widest text-teal-700">
                <Sparkles className="h-3 w-3" aria-hidden />
                AI App Marketplace
              </div>

              {/* Headline */}
              <h1 className="animate-fade-up animation-delay-100 text-5xl sm:text-6xl lg:text-7xl font-bold leading-[1.05] tracking-tight text-slate-900">
                Discover &amp; Launch{' '}
                <span className="text-teal-600">AI Apps</span>
              </h1>

              {/* Input — wide, right below the headline */}
              <div className="animate-fade-up animation-delay-200 mt-10 w-full max-w-2xl">
                <HeroInput />
              </div>

              {/* Browse link */}
              <p className="animate-fade-up animation-delay-300 mt-5 text-sm text-slate-400">
                or{' '}
                <Link href="/explore" className="font-medium text-slate-500 underline underline-offset-2 hover:text-slate-800 transition-colors">
                  browse without an account
                </Link>
              </p>

            </div>
          </div>
        </section>
      } />

      {/* ── API error banner ──────────────────────────────────────────────── */}
      {error && (
        <div className="mx-auto max-w-3xl px-4 sm:px-6 pb-2">
          <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        </div>
      )}

      {/* ── Discovery feed ────────────────────────────────────────────────── */}
      <FeedSection
        title="All Apps"
        count={apps.length}
        subtitle="Published and ready to launch"
        viewAllHref="/explore"
        variant="list"
        className="pt-5"
        emptyState={apps.length === 0 && !error ? <EmptyFeed /> : undefined}
      >
        {apps.map((app) => (
          <AppCard
            key={app.id}
            app={app}
            badge={computeBadge(app.publishedAt)}
            categoryName={app.categoryId ? categoryMap.get(app.categoryId) : undefined}
          />
        ))}
      </FeedSection>

    </div>
  )
}

// ── Empty state ───────────────────────────────────────────────────────────────

function EmptyFeed() {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-stone-200 bg-white py-16 text-center shadow-sm">
      <div className="text-3xl mb-3">✦</div>
      <p className="font-medium text-stone-700">No published apps yet</p>
      <p className="mt-1 text-sm text-stone-500 max-w-xs">
        Apps appear here once approved and published.
      </p>
      <Link href="/submit" className="btn-primary mt-5 text-sm">
        Be the first to submit
      </Link>
    </div>
  )
}
