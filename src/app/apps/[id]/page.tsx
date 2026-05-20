import { notFound } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft, Star, ExternalLink, ArrowUpRight,
  MessageSquare, Zap, Trophy, Sparkles,
} from 'lucide-react'
import { apiClient } from '@/lib/api/client'
import { ReviewForm } from '@/components/apps/ReviewForm'
import type { ApiResponse, App, AppAsset, Category, ReviewStats } from '@/lib/api/types'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PageProps {
  params: Promise<{ id: string }>
}

// ---------------------------------------------------------------------------
// Data fetching
// ---------------------------------------------------------------------------

async function getAppDetail(slug: string) {
  try {
    const opts = { next: { revalidate: 60 } } as RequestInit
    let app: App | null = null
    try {
      const res = await apiClient.get<ApiResponse<App>>(`/api/v1/apps/slug/${slug}`, opts)
      app = res.data
    } catch {
      const res = await apiClient.get<ApiResponse<App>>(`/api/v1/apps/${slug}`, opts)
      app = res.data
    }
    if (!app) return null
    const assetsRes = await apiClient.get<ApiResponse<AppAsset[]>>(`/api/v1/apps/${app.id}/assets`, opts)
    return { app, assets: assetsRes.data }
  } catch {
    return null
  }
}

async function getCategory(id: string): Promise<Category | null> {
  try {
    const res = await apiClient.get<ApiResponse<Category>>(
      `/api/v1/categories/${id}`,
      { next: { revalidate: 3600 } } as RequestInit,
    )
    return res.data
  } catch {
    return null
  }
}

async function getReviews(appId: string): Promise<ReviewStats> {
  try {
    const res = await apiClient.get<ApiResponse<ReviewStats>>(
      `/api/v1/apps/${appId}/reviews?limit=20`,
      { next: { revalidate: 30 } } as RequestInit,
    )
    return res.data
  } catch {
    return { items: [], total: 0, page: 1, limit: 20, pages: 0, avgRating: null }
  }
}

// ---------------------------------------------------------------------------
// Colour utilities
// ---------------------------------------------------------------------------

function isLightColor(hex: string): boolean {
  try {
    const r = parseInt(hex.slice(1, 3), 16)
    const g = parseInt(hex.slice(3, 5), 16)
    const b = parseInt(hex.slice(5, 7), 16)
    return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.55
  } catch {
    return false
  }
}

function darken(hex: string, amount = 0.15): string {
  try {
    const r = Math.max(0, Math.round(parseInt(hex.slice(1, 3), 16) * (1 - amount)))
    const g = Math.max(0, Math.round(parseInt(hex.slice(3, 5), 16) * (1 - amount)))
    const b = Math.max(0, Math.round(parseInt(hex.slice(5, 7), 16) * (1 - amount)))
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
  } catch {
    return hex
  }
}

function stableXP(id: string): number {
  let h = 5381
  for (let i = 0; i < id.length; i++) h = ((h << 5) + h) ^ id.charCodeAt(i)
  return (Math.abs(h) % 90) + 10
}

function appLevel(reviewCount: number): { label: string; color: string; bg: string } {
  if (reviewCount >= 21) return { label: '🏆 Legendary', color: '#B45309', bg: '#FEF3C7' }
  if (reviewCount >= 6)  return { label: '🔥 Popular',   color: '#EA580C', bg: '#FFF7ED' }
  if (reviewCount >= 1)  return { label: '⬆ Rising',    color: '#0284C7', bg: '#E0F2FE' }
  return                        { label: '✦ New',        color: '#0891B2', bg: '#ECFEFF' }
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function AppDetailPage({ params }: PageProps) {
  const { id: slug } = await params
  const result = await getAppDetail(slug)

  if (!result || result.app.status !== 'PUBLISHED') notFound()

  const { app, assets } = result
  const [category, reviewStats] = await Promise.all([
    app.categoryId ? getCategory(app.categoryId) : Promise.resolve(null),
    getReviews(app.id),
  ])

  const screenshots  = assets.filter(a => a.type === 'SCREENSHOT').sort((a, b) => a.sortOrder - b.sortOrder)
  const logoUrl      = app.iconUrl ?? null
  const videoUrl     = app.videoUrl ?? null
  const primaryColor = app.primaryColor ?? '#0EA5E9'
  const light        = isLightColor(primaryColor)
  const onBrand      = light ? '#1c1917' : '#ffffff'
  const visitUrl     = `${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080'}/api/v1/apps/${app.id}/visit`
  const xp           = stableXP(app.id)
  const level        = appLevel(reviewStats.total)

  const mediaItems: ({ type: 'video'; src: string } | { type: 'image'; src: string })[] = [
    ...(videoUrl ? [{ type: 'video' as const, src: videoUrl }] : []),
    ...screenshots.map(s => ({ type: 'image' as const, src: s.url })),
  ]

  return (
    <div className="min-h-screen animate-fade-in" style={{ background: 'rgb(var(--color-background))' }}>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          HERO — brand-colored, now with name + tagline + game badges
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section
        className="relative w-full overflow-hidden"
        style={{ background: primaryColor }}
      >
        {/* Radial glow overlay */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background: `radial-gradient(ellipse 70% 80% at 50% 60%, ${light ? 'rgba(255,255,255,0.20)' : 'rgba(255,255,255,0.10)'} 0%, transparent 70%)`,
          }}
          aria-hidden
        />

        {/* Dot grid texture */}
        <div
          className="pointer-events-none absolute inset-0 opacity-10"
          style={{
            backgroundImage: `radial-gradient(circle, ${onBrand}44 1px, transparent 1px)`,
            backgroundSize: '24px 24px',
          }}
          aria-hidden
        />

        {/* Back button */}
        <div className="relative z-10 mx-auto max-w-4xl px-5 pt-6">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all hover:scale-105"
            style={{
              background: light ? 'rgba(0,0,0,0.10)' : 'rgba(255,255,255,0.18)',
              color: onBrand,
            }}
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back
          </Link>
        </div>

        {/* Hero content */}
        <div className="relative z-10 mx-auto w-full max-w-4xl px-6 pb-20 pt-8 flex flex-col items-center text-center">

          {/* Floating icon */}
          <div className="animate-float mb-6">
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={logoUrl}
                alt={app.name}
                style={{
                  maxWidth: '100%',
                  maxHeight: 120,
                  width: 'auto',
                  height: 'auto',
                  objectFit: 'contain',
                  filter: `drop-shadow(0 12px 32px ${light ? 'rgba(0,0,0,0.22)' : 'rgba(0,0,0,0.45)'})`,
                  borderRadius: 24,
                }}
              />
            ) : (
              <div
                className="flex items-center justify-center rounded-3xl text-6xl font-black select-none"
                style={{
                  width: 120,
                  height: 120,
                  background: light ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.18)',
                  color: onBrand,
                  boxShadow: `0 16px 48px ${light ? 'rgba(0,0,0,0.20)' : 'rgba(0,0,0,0.40)'}`,
                }}
              >
                {app.name.trim()[0]?.toUpperCase() ?? '?'}
              </div>
            )}
          </div>

          {/* App name */}
          <h1
            className="text-3xl sm:text-4xl font-black tracking-tight leading-tight"
            style={{ color: onBrand }}
          >
            {app.name}
          </h1>

          {/* Tagline */}
          {app.tagline && (
            <p
              className="mt-2 text-base sm:text-lg font-medium max-w-xl leading-relaxed"
              style={{ color: `${onBrand}bb` }}
            >
              {app.tagline}
            </p>
          )}

          {/* Game badges row */}
          <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
            {/* Category */}
            {category && (
              <span
                className="rounded-full px-3 py-1 text-[11px] font-bold"
                style={{
                  background: light ? 'rgba(0,0,0,0.10)' : 'rgba(255,255,255,0.18)',
                  color: onBrand,
                }}
              >
                {category.name}
              </span>
            )}

            {/* Level */}
            <span
              className="rounded-full px-3 py-1 text-[11px] font-bold"
              style={{
                background: light ? 'rgba(0,0,0,0.10)' : 'rgba(255,255,255,0.18)',
                color: onBrand,
              }}
            >
              {level.label}
            </span>

            {/* XP */}
            <span
              className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-bold"
              style={{
                background: light ? 'rgba(0,0,0,0.10)' : 'rgba(255,255,255,0.18)',
                color: onBrand,
              }}
            >
              <Zap className="h-3 w-3" />
              +{xp} XP on launch
            </span>
          </div>

          {/* CTA */}
          {app.launchUrl && (
            <a
              href={visitUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-8 inline-flex items-center gap-2 rounded-2xl px-8 py-3.5 text-sm font-bold transition-all duration-150 hover:scale-105 hover:shadow-2xl active:scale-[0.98]"
              style={{
                background: light ? 'rgba(0,0,0,0.82)' : 'rgba(255,255,255,0.94)',
                color:      light ? '#ffffff' : primaryColor,
                boxShadow:  '0 6px 28px rgba(0,0,0,0.28)',
              }}
            >
              <Sparkles className="h-4 w-4" />
              Open App
              <ArrowUpRight className="h-4 w-4" />
            </a>
          )}
        </div>

        {/* Fade to page background */}
        <div
          className="pointer-events-none absolute bottom-0 left-0 right-0 h-20"
          style={{ background: 'linear-gradient(to bottom, transparent, rgb(var(--color-background)))' }}
          aria-hidden
        />
      </section>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          CONTENT
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <div className="mx-auto max-w-4xl px-4 sm:px-6 pb-24">

        {/* Stats bar */}
        <StatsBar
          primaryColor={primaryColor}
          light={light}
          avgRating={reviewStats.avgRating}
          reviewCount={reviewStats.total}
          xp={xp}
          level={level}
          recentReviewers={reviewStats.items.slice(0, 4).map(r => r.user)}
        />

        {/* Media */}
        {mediaItems.length > 0 && (
          <section className="mt-10">
            <MediaStrip items={mediaItems} />
          </section>
        )}

        {/* Description */}
        {app.description && (
          <section className="mt-8">
            <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
              <h2 className="text-sm font-black text-slate-900 mb-3 uppercase tracking-wider">About</h2>
              <p className="text-sm sm:text-base leading-relaxed text-slate-600 whitespace-pre-line">
                {app.description}
              </p>
            </div>
          </section>
        )}

        {/* Big CTA */}
        {app.launchUrl && (
          <section className="mt-8">
            <BigCTA
              href={visitUrl}
              primaryColor={primaryColor}
              darkened={darken(primaryColor, 0.12)}
              onBrand={onBrand}
              xp={xp}
            />
          </section>
        )}

        {/* Reviews */}
        <section className="mt-10">
          <ReviewsSection
            primaryColor={primaryColor}
            light={light}
            appId={app.id}
            reviewStats={reviewStats}
          />
        </section>

      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// StatsBar
// ---------------------------------------------------------------------------

interface ReviewerMeta { id: string; email: string; avatarUrl: string | null }

function StatsBar({
  primaryColor, light, avgRating, reviewCount, xp, level, recentReviewers,
}: {
  primaryColor:    string
  light:           boolean
  avgRating:       number | null
  reviewCount:     number
  xp:              number
  level:           { label: string; color: string; bg: string }
  recentReviewers: ReviewerMeta[]
}) {
  const accentText = light ? darken(primaryColor, 0.25) : primaryColor
  const hasReviews = reviewCount > 0

  return (
    <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">

      {/* Rating */}
      <div className="flex flex-col items-center justify-center gap-1.5 rounded-2xl border border-slate-100 bg-white px-4 py-4 shadow-sm">
        <div className="flex gap-0.5">
          {[1,2,3,4,5].map(i => {
            const filled = hasReviews && avgRating ? i <= Math.round(avgRating) : false
            return (
              <Star
                key={i}
                className="h-3.5 w-3.5"
                fill={filled ? accentText : 'none'}
                stroke={filled ? accentText : '#cbd5e1'}
                strokeWidth={1.5}
              />
            )
          })}
        </div>
        <span className="text-lg font-black text-slate-900">
          {hasReviews && avgRating ? avgRating.toFixed(1) : '—'}
        </span>
        <span className="text-[11px] text-slate-400">{reviewCount} review{reviewCount !== 1 ? 's' : ''}</span>
      </div>

      {/* XP */}
      <div className="flex flex-col items-center justify-center gap-1.5 rounded-2xl border border-amber-100 bg-amber-50 px-4 py-4 shadow-sm">
        <Zap className="h-5 w-5 fill-amber-400 text-amber-400" />
        <span className="text-lg font-black text-amber-700">+{xp}</span>
        <span className="text-[11px] text-amber-500 font-medium">XP reward</span>
      </div>

      {/* Level */}
      <div
        className="flex flex-col items-center justify-center gap-1.5 rounded-2xl border px-4 py-4 shadow-sm"
        style={{ background: level.bg, borderColor: `${level.color}33` }}
      >
        <Trophy className="h-5 w-5" style={{ color: level.color }} />
        <span className="text-sm font-black" style={{ color: level.color }}>{level.label}</span>
        <span className="text-[11px] font-medium" style={{ color: `${level.color}99` }}>app level</span>
      </div>

      {/* Community */}
      <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-slate-100 bg-white px-4 py-4 shadow-sm">
        {recentReviewers.length > 0 ? (
          <div className="flex -space-x-1.5">
            {recentReviewers.slice(0, 4).map((r, i) => {
              const name = r.email.split('@')[0] ?? '?'
              return r.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={r.id} src={r.avatarUrl} alt={name} referrerPolicy="no-referrer"
                  className="h-7 w-7 rounded-full border-2 border-white object-cover" />
              ) : (
                <div key={r.id}
                  className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-white text-[10px] font-bold text-white select-none"
                  style={{ background: `${primaryColor}${['cc','aa','88','66'][i] ?? '66'}` }}
                >
                  {name[0]?.toUpperCase() ?? '?'}
                </div>
              )
            })}
          </div>
        ) : (
          <MessageSquare className="h-5 w-5 text-slate-300" />
        )}
        <span className="text-[11px] text-slate-400 text-center leading-tight">
          {hasReviews ? 'Community reviewed' : 'Be first to review'}
        </span>
      </div>

    </div>
  )
}

// ---------------------------------------------------------------------------
// MediaStrip
// ---------------------------------------------------------------------------

type MediaItem = { type: 'video'; src: string } | { type: 'image'; src: string }

function MediaStrip({ items }: { items: MediaItem[] }) {
  return (
    <div
      className="-mx-4 sm:-mx-6 flex gap-4 overflow-x-auto px-4 sm:px-6 pb-3 scrollbar-hide"
      style={{ scrollSnapType: 'x mandatory', WebkitOverflowScrolling: 'touch' } as React.CSSProperties}
    >
      {items.map((item, i) => (
        <div
          key={i}
          className="shrink-0 overflow-hidden border border-slate-100 shadow-md"
          style={{
            borderRadius: 24,
            scrollSnapAlign: 'start',
            width: 'clamp(220px, 80vw, 480px)',
            background: '#0f172a',
          }}
        >
          {item.type === 'video' ? (
            <video
              src={item.src}
              controls
              playsInline
              preload="metadata"
              style={{ display: 'block', width: '100%', height: 'auto', borderRadius: 24, background: '#0c0c0c' }}
            />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={item.src}
              alt={`Screenshot ${i + 1}`}
              loading={i === 0 ? 'eager' : 'lazy'}
              style={{ display: 'block', width: '100%', height: 'auto', objectFit: 'contain', borderRadius: 24, background: '#f8fafc' }}
            />
          )}
        </div>
      ))}
      <div className="shrink-0 w-4" aria-hidden />
    </div>
  )
}

// ---------------------------------------------------------------------------
// BigCTA
// ---------------------------------------------------------------------------

function BigCTA({
  href, primaryColor, darkened, onBrand, xp,
}: {
  href: string; primaryColor: string; darkened: string; onBrand: string; xp: number
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="group relative flex w-full flex-col items-center justify-center gap-1 overflow-hidden rounded-3xl px-8 py-6 transition-all duration-200 hover:scale-[1.01] active:scale-[0.99]"
      style={{
        background: `linear-gradient(135deg, ${primaryColor} 0%, ${darkened} 100%)`,
        color:      onBrand,
        boxShadow:  `0 8px 40px ${primaryColor}55`,
      }}
    >
      {/* Shimmer sweep */}
      <span
        className="pointer-events-none absolute inset-0 translate-x-[-100%] bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-700 group-hover:translate-x-[100%]"
        aria-hidden
      />
      <span className="flex items-center gap-2 text-lg font-black">
        <ExternalLink className="h-5 w-5" />
        Launch App
        <ArrowUpRight className="h-5 w-5 opacity-80" />
      </span>
      <span className="text-[12px] font-semibold opacity-70">
        Earn +{xp} XP when you launch
      </span>
    </a>
  )
}

// ---------------------------------------------------------------------------
// ReviewsSection
// ---------------------------------------------------------------------------

function ReviewsSection({ primaryColor, light, appId, reviewStats }: {
  primaryColor: string
  light:        boolean
  appId:        string
  reviewStats:  ReviewStats
}) {
  const accentText = light ? darken(primaryColor, 0.25) : primaryColor
  const hasReviews = reviewStats.total > 0

  return (
    <div className="rounded-3xl border border-slate-100 bg-white overflow-hidden shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-5 border-b border-slate-50">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 to-teal-400 shadow-md shadow-sky-200/50">
            <MessageSquare className="h-4 w-4 text-white" aria-hidden />
          </div>
          <div>
            <p className="text-sm font-black text-slate-900">
              {hasReviews ? `Reviews (${reviewStats.total})` : 'Reviews'}
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {hasReviews ? 'What the community thinks' : 'No reviews yet — be the first!'}
            </p>
          </div>
        </div>

        {hasReviews && reviewStats.avgRating && (
          <div className="flex items-center gap-1.5">
            <span className="text-2xl font-black text-slate-900">
              {reviewStats.avgRating.toFixed(1)}
            </span>
            <div className="flex flex-col gap-0.5">
              <div className="flex gap-0.5">
                {[1,2,3,4,5].map(i => (
                  <Star
                    key={i}
                    className="h-3.5 w-3.5"
                    fill={i <= Math.round(reviewStats.avgRating!) ? accentText : 'none'}
                    stroke={i <= Math.round(reviewStats.avgRating!) ? accentText : '#cbd5e1'}
                    strokeWidth={1.5}
                  />
                ))}
              </div>
              <span className="text-[10px] text-slate-400">out of 5</span>
            </div>
          </div>
        )}
      </div>

      <ReviewForm
        primaryColor={primaryColor}
        accentText={accentText}
        appId={appId}
        initialReviews={reviewStats.items}
        initialTotal={reviewStats.total}
        initialAvg={reviewStats.avgRating}
      />
    </div>
  )
}
