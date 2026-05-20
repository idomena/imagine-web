import Link from 'next/link'
import { Sparkles, AlertCircle, Zap, Flame, Star } from 'lucide-react'
import { AppCard }        from '@/components/apps/AppCard'
import { FeedSection }    from '@/components/feed/FeedSection'
import { HeroOrWelcome }  from '@/components/home/HeroOrWelcome'
import { HeroInput }      from '@/components/home/HeroInput'
import { GuestBrowseLink } from '@/components/home/GuestBrowseLink'
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

  const newCount      = apps.filter((a) => computeBadge(a.publishedAt) === 'new').length
  const trendingCount = apps.filter((a) => computeBadge(a.publishedAt) === 'trending').length

  return (
    <div className="relative min-h-screen" style={{ background: 'rgb(var(--color-background))' }}>

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <HeroOrWelcome hero={
        <section className="relative sm:-mt-[88px]" style={{ minHeight: '100svh' }}>

          {/* Gradient blobs background */}
          <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="animate-blob-1 absolute -top-20 -left-20 h-[500px] w-[500px] rounded-full opacity-25"
              style={{ background: 'radial-gradient(circle, #0EA5E9, transparent 70%)' }} />
            <div className="animate-blob-2 absolute -bottom-20 -right-20 h-[400px] w-[400px] rounded-full opacity-20"
              style={{ background: 'radial-gradient(circle, #14B8A6, transparent 70%)' }} />
            <div className="animate-blob-3 absolute top-1/2 left-1/2 h-[300px] w-[300px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-15"
              style={{ background: 'radial-gradient(circle, #38BDF8, transparent 70%)' }} />
          </div>

          {/* Dot grid texture */}
          <div aria-hidden className="pointer-events-none absolute inset-0 opacity-[0.25]"
            style={{
              backgroundImage: 'radial-gradient(circle, #c4c4c8 1px, transparent 1px)',
              backgroundSize: '28px 28px',
            }}
          />

          <div className="relative z-10 flex min-h-[inherit] flex-col items-center justify-center px-5 sm:px-8 pb-20 sm:pb-32 pt-28 sm:pt-48">
            <div className="flex w-full max-w-4xl flex-col items-center text-center">

              {/* Eyebrow badge */}
              <div className="animate-fade-up mb-8 inline-flex items-center gap-2 rounded-full border border-sky-200 bg-gradient-to-r from-sky-50 to-teal-50 px-4 py-1.5 text-[11px] font-bold uppercase tracking-widest text-sky-700 shadow-sm">
                <Sparkles className="h-3 w-3" aria-hidden />
                AI App Marketplace
              </div>

              {/* Headline */}
              <h1 className="animate-fade-up animation-delay-100 text-5xl sm:text-6xl lg:text-7xl font-black leading-[1.05] tracking-tight text-stone-900">
                Level Up Your{' '}
                <span className="gradient-text">
                  AI Toolkit
                </span>
              </h1>

              {/* Subline */}
              <p className="animate-fade-up animation-delay-200 mt-5 text-xl sm:text-2xl font-semibold text-stone-400">
                Apple won&apos;t.{' '}
                <span className="text-stone-700">Imagine will.</span>
              </p>

              {/* Input */}
              <div className="animate-fade-up animation-delay-300 mt-10 w-full max-w-2xl">
                <HeroInput />
              </div>

              {/* Browse link */}
              <p className="animate-fade-up animation-delay-400 mt-5 text-sm text-stone-400">
                or <GuestBrowseLink />
              </p>

              {/* Stats row */}
              <div className="animate-fade-up animation-delay-600 mt-12 flex flex-wrap items-center justify-center gap-3 sm:gap-5">
                <StatPill icon={<Star className="h-3.5 w-3.5 fill-sky-400 text-sky-400" />} label={`${apps.length} apps`} color="sky" />
                {trendingCount > 0 && <StatPill icon={<Flame className="h-3.5 w-3.5 fill-teal-400 text-teal-400" />} label={`${trendingCount} trending`} color="teal" />}
                {newCount > 0 && <StatPill icon={<Zap className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />} label={`${newCount} new this week`} color="amber" />}
              </div>

            </div>
          </div>
        </section>
      } />

      {/* ── API error banner ──────────────────────────────────────────────── */}
      {error && (
        <div className="mx-auto max-w-3xl px-4 sm:px-6 pb-2">
          <div className="flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        </div>
      )}

      {/* ── Discovery feed ────────────────────────────────────────────────── */}
      <FeedSection
        title="Discover Apps"
        count={apps.length}
        subtitle="Your AI journey starts here"
        viewAllHref="/explore"
        variant="journey"
        className="pt-5"
        emptyState={apps.length === 0 && !error ? <EmptyFeed /> : undefined}
      >
        {apps.map((app, i) => (
          <AppCard
            key={app.id}
            app={app}
            badge={computeBadge(app.publishedAt)}
            categoryName={app.categoryId ? categoryMap.get(app.categoryId) : undefined}
            index={i}
          />
        ))}
      </FeedSection>

    </div>
  )
}

// ── Stat pill ─────────────────────────────────────────────────────────────────

function StatPill({ icon, label, color }: { icon: React.ReactNode; label: string; color: 'sky' | 'teal' | 'amber' }) {
  const styles = {
    sky:   'border-sky-200 bg-sky-50 text-sky-700',
    teal:  'border-teal-200 bg-teal-50 text-teal-700',
    amber: 'border-amber-200 bg-amber-50 text-amber-700',
  }
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-semibold ${styles[color]}`}>
      {icon}
      {label}
    </span>
  )
}

// ── Empty state ───────────────────────────────────────────────────────────────

function EmptyFeed() {
  return (
    <div className="flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-sky-200 bg-white py-16 text-center shadow-sm">
      <div className="text-5xl mb-4">🚀</div>
      <p className="font-black text-stone-800 text-lg">No apps yet</p>
      <p className="mt-1.5 text-sm text-stone-500 max-w-xs">
        Be the first to launch something great on Imagine.
      </p>
      <Link href="/submit" className="btn-primary mt-6 text-sm">
        Submit your app
      </Link>
    </div>
  )
}
