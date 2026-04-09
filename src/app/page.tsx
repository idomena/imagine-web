import Link from 'next/link'
import { Zap, Shield, BarChart3, ArrowRight, AlertCircle } from 'lucide-react'
import { AppCard }     from '@/components/apps/AppCard'
import { FeedSection } from '@/components/feed/FeedSection'
import { apiClient }   from '@/lib/api/client'
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

async function getFeedData(): Promise<FeedData> {
  try {
    const opts = { next: { revalidate: 60 } } as RequestInit
    const [appsRes, catsRes] = await Promise.all([
      apiClient.get<ApiResponse<Paginated<App>>>('/api/v1/apps?limit=30', opts),
      apiClient.get<ApiResponse<Category[]>>('/api/v1/categories', opts),
    ])
    return { apps: appsRes.data.items, categories: catsRes.data }
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

const CATEGORY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  'developer-tools': Zap,
  'analytics':       BarChart3,
  'security':        Shield,
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function HomePage() {
  const { apps, categories, error } = await getFeedData()
  const categoryMap = new Map(categories.map((c) => [c.id, c.name]))

  return (
    <div className="min-h-screen bg-[#FDFDF9]">

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section
        className="relative -mt-[88px] overflow-hidden"
        style={{ minHeight: '100svh' }}
      >

        {/* ── Sky gradient base ────────────────────────────────────────────── */}
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(175deg, #adc8e8 0%, #c4d9f0 18%, #d6e7f5 40%, #e8f2fb 65%, #f4f9fd 85%, #FDFDF9 100%)',
          }}
          aria-hidden
        />

        {/* ── SVG watercolor cloud texture ─────────────────────────────────── */}
        <svg
          className="pointer-events-none absolute inset-0 h-full w-full"
          viewBox="0 0 1440 900"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="xMidYMid slice"
          aria-hidden
        >
          <defs>
            {/* Watercolor turbulence — large blobs */}
            <filter id="wc-a" x="-60%" y="-60%" width="220%" height="220%">
              <feTurbulence type="fractalNoise" baseFrequency="0.011 0.008" numOctaves="4" seed="3" result="n"/>
              <feDisplacementMap in="SourceGraphic" in2="n" scale="90" xChannelSelector="R" yChannelSelector="G" result="d"/>
              <feGaussianBlur in="d" stdDeviation="11"/>
            </filter>
            {/* Watercolor turbulence — medium blobs */}
            <filter id="wc-b" x="-55%" y="-55%" width="210%" height="210%">
              <feTurbulence type="fractalNoise" baseFrequency="0.014 0.010" numOctaves="4" seed="7" result="n"/>
              <feDisplacementMap in="SourceGraphic" in2="n" scale="70" xChannelSelector="R" yChannelSelector="G" result="d"/>
              <feGaussianBlur in="d" stdDeviation="13"/>
            </filter>
            {/* Watercolor turbulence — small accent blobs */}
            <filter id="wc-c" x="-45%" y="-45%" width="190%" height="190%">
              <feTurbulence type="fractalNoise" baseFrequency="0.019 0.014" numOctaves="3" seed="11" result="n"/>
              <feDisplacementMap in="SourceGraphic" in2="n" scale="48" xChannelSelector="R" yChannelSelector="G" result="d"/>
              <feGaussianBlur in="d" stdDeviation="9"/>
            </filter>
            {/* Pure soft blur for blue depth accents */}
            <filter id="blur-depth">
              <feGaussianBlur stdDeviation="28"/>
            </filter>
          </defs>

          {/* ── Large upper-left cloud mass ── */}
          <ellipse cx="155" cy="310" rx="420" ry="330" fill="white" fillOpacity="0.72" filter="url(#wc-a)"/>
          <ellipse cx="50"  cy="155" rx="210" ry="170" fill="white" fillOpacity="0.58" filter="url(#wc-c)"/>
          <ellipse cx="310" cy="180" rx="160" ry="120" fill="white" fillOpacity="0.42" filter="url(#wc-c)"/>

          {/* ── Large upper-right cloud mass ── */}
          <ellipse cx="1295" cy="230" rx="390" ry="315" fill="white" fillOpacity="0.66" filter="url(#wc-b)"/>
          <ellipse cx="1415" cy="410" rx="185" ry="155" fill="white" fillOpacity="0.48" filter="url(#wc-c)"/>
          <ellipse cx="1100" cy="120" rx="170" ry="130" fill="white" fillOpacity="0.38" filter="url(#wc-c)"/>

          {/* ── Bottom center soft cloud ── */}
          <ellipse cx="720" cy="840" rx="540" ry="175" fill="white" fillOpacity="0.40" filter="url(#wc-a)"/>
          <ellipse cx="460" cy="780" rx="260" ry="140" fill="white" fillOpacity="0.30" filter="url(#wc-c)"/>

          {/* ── Blue depth accents (give painterly richness) ── */}
          <ellipse cx="100"  cy="680" rx="310" ry="195" fill="#7ab0d8" fillOpacity="0.28" filter="url(#blur-depth)"/>
          <ellipse cx="1370" cy="590" rx="270" ry="175" fill="#7ab0d8" fillOpacity="0.22" filter="url(#blur-depth)"/>
          <ellipse cx="600"  cy="600" rx="180" ry="110" fill="#94bedd" fillOpacity="0.18" filter="url(#blur-depth)"/>

          {/* ── Mid accent cloud ── */}
          <ellipse cx="870" cy="500" rx="225" ry="145" fill="white" fillOpacity="0.26" filter="url(#wc-c)"/>
        </svg>

        {/* ── Bottom fade to page background ───────────────────────────────── */}
        <div
          className="pointer-events-none absolute bottom-0 left-0 right-0 h-48"
          style={{ background: 'linear-gradient(to top, #FDFDF9 0%, transparent 100%)' }}
          aria-hidden
        />

        {/* ── Content — centered single column ────────────────────────────── */}
        <div className="relative z-10 flex min-h-[inherit] items-center justify-center px-6 pb-40 pt-56">
          <div className="flex flex-col items-center text-center">

            {/* Badge */}
            <div className="animate-fade-up inline-flex items-center gap-1.5 rounded-full border border-teal-200/70 bg-teal-50/80 px-3.5 py-1 text-xs font-semibold text-teal-700 backdrop-blur-sm">
              <Zap className="h-3 w-3" aria-hidden />
              AI App Marketplace
            </div>

            {/* Headline */}
            <h1 className="animate-fade-up animation-delay-100 mt-10 max-w-4xl text-6xl font-extrabold leading-[1.05] tracking-tight text-stone-900 sm:text-7xl lg:text-[6rem]">
              Discover &amp; launch{' '}
              <span className="gradient-text">AI&nbsp;apps</span>{' '}
              instantly
            </h1>

            {/* Subtitle */}
            <p className="animate-fade-up animation-delay-200 mt-8 max-w-xs text-sm font-light leading-relaxed text-stone-400 sm:max-w-sm sm:text-base">
              Every app runs on its own URL. One click to launch.
            </p>

            {/* CTAs */}
            <div className="animate-fade-up animation-delay-300 mt-14 flex flex-wrap justify-center gap-5">
              <Link
                href="/explore"
                className="inline-flex items-center gap-2 rounded-full bg-teal-700 px-9 py-4 text-sm font-semibold text-white shadow-lg shadow-teal-800/20 transition-all duration-200 hover:bg-teal-600 hover:-translate-y-0.5 hover:shadow-teal-700/30 active:scale-95"
              >
                Explore Apps
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
              <Link
                href="/submit"
                className="animate-subtle-pulse inline-flex items-center gap-2 rounded-full border border-stone-300/70 bg-white/70 px-9 py-4 text-sm font-semibold text-stone-700 backdrop-blur-sm transition-all duration-200 hover:border-stone-400 hover:bg-white hover:-translate-y-0.5 active:scale-95"
              >
                Submit Your App
              </Link>
            </div>

            {/* Social proof */}
            <p className="animate-fade-up animation-delay-400 mt-12 text-xs font-light tracking-wide text-stone-400/80">
              Free to browse · No sign-up required to explore
            </p>

          </div>
        </div>
      </section>

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
