import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Star, Users, ExternalLink, ArrowUpRight, MessageSquare } from 'lucide-react'
import { apiClient } from '@/lib/api/client'
import { ReviewForm } from '@/components/apps/ReviewForm'
import type { ApiResponse, App, AppAsset, Category, ReviewStats } from '@/lib/api/types'

// ---------------------------------------------------------------------------
// App detail page  —  /apps/[id]  (accepts UUID or slug)
// Universal high-end product landing page template
// ---------------------------------------------------------------------------

interface PageProps {
  params: Promise<{ id: string }>
}

// ── Data fetching ─────────────────────────────────────────────────────────────

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

// ── Colour utilities ──────────────────────────────────────────────────────────

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

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function AppDetailPage({ params }: PageProps) {
  const { id: slug } = await params
  const result = await getAppDetail(slug)

  if (!result || result.app.status !== 'PUBLISHED') notFound()

  const { app, assets } = result
  const [category, reviewStats] = await Promise.all([
    app.categoryId ? getCategory(app.categoryId) : Promise.resolve(null),
    getReviews(app.id),
  ])

  const screenshots = assets
    .filter(a => a.type === 'SCREENSHOT')
    .sort((a, b) => a.sortOrder - b.sortOrder)

  const logoUrl      = app.iconUrl ?? null
  const videoUrl     = app.videoUrl ?? null
  const primaryColor = app.primaryColor ?? '#14b8a6'
  const light        = isLightColor(primaryColor)
  const onBrand      = light ? '#1c1917' : '#ffffff'
  const visitUrl     = `${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080'}/api/v1/apps/${app.id}/visit`

  const mediaItems: ({ type: 'video'; src: string } | { type: 'image'; src: string })[] = [
    ...(videoUrl ? [{ type: 'video' as const, src: videoUrl }] : []),
    ...screenshots.map(s => ({ type: 'image' as const, src: s.url })),
  ]

  return (
    <div className="min-h-screen bg-[#FDFDF9]">

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          HERO — full-width, brand-coloured
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section
        className="relative w-full overflow-hidden"
        style={{ background: primaryColor }}
      >
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background: `radial-gradient(ellipse 70% 80% at 50% 60%, ${light ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.10)'} 0%, transparent 70%)`,
          }}
          aria-hidden
        />

        <div className="relative z-10 mx-auto max-w-4xl px-5 pt-6">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors"
            style={{
              background: light ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.15)',
              color: onBrand,
            }}
          >
            <ArrowLeft className="h-3 w-3" />
            Back
          </Link>
        </div>

        <div className="relative z-10 mx-auto w-full max-w-5xl px-6 pb-16 pt-10 flex flex-col items-center">
          <div className="flex w-full items-center justify-center">
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={logoUrl}
                alt={app.name}
                style={{
                  maxWidth:  '100%',
                  maxHeight: 240,
                  width:     'auto',
                  height:    'auto',
                  objectFit: 'contain',
                  filter:    `drop-shadow(0 12px 36px ${light ? 'rgba(0,0,0,0.22)' : 'rgba(0,0,0,0.45)'})`,
                }}
              />
            ) : (
              <div
                className="flex items-center justify-center rounded-[24px] text-7xl font-black select-none"
                style={{
                  width:     160,
                  height:    160,
                  background: light ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.18)',
                  color:      onBrand,
                  boxShadow:  `0 16px 48px ${light ? 'rgba(0,0,0,0.20)' : 'rgba(0,0,0,0.40)'}`,
                }}
              >
                {app.name.trim()[0]?.toUpperCase() ?? '?'}
              </div>
            )}
          </div>

          {app.launchUrl && (
            <a
              href={visitUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-8 inline-flex items-center gap-2 rounded-2xl px-8 py-3.5 text-sm font-bold transition-all duration-150 active:scale-[0.98]"
              style={{
                background: light ? 'rgba(0,0,0,0.80)' : 'rgba(255,255,255,0.92)',
                color:      light ? '#ffffff' : primaryColor,
                boxShadow:  '0 4px 24px rgba(0,0,0,0.25)',
              }}
            >
              Open App
              <ArrowUpRight className="h-4 w-4" />
            </a>
          )}
        </div>

        <div
          className="pointer-events-none absolute bottom-0 left-0 right-0 h-16"
          style={{ background: 'linear-gradient(to bottom, transparent, #FDFDF9)' }}
          aria-hidden
        />
      </section>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          CONTENT
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <div className="mx-auto max-w-4xl px-4 sm:px-6 pb-24">

        {/* ── Social Proof bar ─────────────────────────────────────────────── */}
        <SocialProofBar
          primaryColor={primaryColor}
          light={light}
          avgRating={reviewStats.avgRating}
          reviewCount={reviewStats.total}
          recentReviewers={reviewStats.items.slice(0, 4).map(r => r.user)}
        />

        {/* ── Media ────────────────────────────────────────────────────────── */}
        {mediaItems.length > 0 && (
          <section className="mt-10">
            <MediaStrip items={mediaItems} />
          </section>
        )}

        {/* ── Description ──────────────────────────────────────────────────── */}
        {app.description && (
          <section className="mt-10">
            <p className="text-sm sm:text-base leading-relaxed text-stone-600 whitespace-pre-line">
              {app.description}
            </p>
          </section>
        )}

        {/* ── Big CTA ──────────────────────────────────────────────────────── */}
        {app.launchUrl && (
          <section className="mt-12">
            <BigCTA
              href={visitUrl}
              primaryColor={primaryColor}
              darkened={darken(primaryColor, 0.12)}
              onBrand={onBrand}
            />
          </section>
        )}

        {/* ── Community / Reviews ──────────────────────────────────────────── */}
        <section className="mt-14">
          <CommunitySection
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

// ── Sub-components ─────────────────────────────────────────────────────────────

type MediaItem = { type: 'video'; src: string } | { type: 'image'; src: string }

function MediaStrip({ items }: { items: MediaItem[] }) {
  return (
    <div
      className="mt-4 -mx-4 sm:-mx-6 flex gap-4 overflow-x-auto px-4 sm:px-6 pb-3"
      style={{
        scrollSnapType:          'x mandatory',
        WebkitOverflowScrolling: 'touch',
        scrollbarWidth:          'none',
      } as React.CSSProperties}
    >
      {items.map((item, i) => (
        <div
          key={i}
          className="shrink-0 border border-stone-200 bg-stone-900"
          style={{
            borderRadius:    24,
            scrollSnapAlign: 'start',
            width:     'clamp(220px, 80vw, 480px)',
            boxShadow: '0 4px 20px rgba(0,0,0,0.09)',
            overflow:  'hidden',
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
              style={{ display: 'block', width: '100%', height: 'auto', objectFit: 'contain', borderRadius: 24, background: '#fafaf9' }}
            />
          )}
        </div>
      ))}
      <div className="shrink-0 w-4" aria-hidden />
    </div>
  )
}

// ── Social proof bar — real data ──────────────────────────────────────────────

interface ReviewerMeta { id: string; email: string; avatarUrl: string | null }

function SocialProofBar({
  primaryColor, light, avgRating, reviewCount, recentReviewers,
}: {
  primaryColor:     string
  light:            boolean
  avgRating:        number | null
  reviewCount:      number
  recentReviewers:  ReviewerMeta[]
}) {
  const accentText = light ? darken(primaryColor, 0.25) : primaryColor
  const accentBg   = `${primaryColor}14`

  const hasReviews = reviewCount > 0
  const displayAvg = avgRating ? avgRating.toFixed(1) : null

  return (
    <div className="mt-6 flex flex-wrap items-center justify-center gap-6 rounded-2xl border border-stone-100 bg-white px-6 py-5 shadow-sm">

      {/* Star rating */}
      <div className="flex flex-col items-center gap-1">
        <div className="flex items-center gap-0.5">
          {[1, 2, 3, 4, 5].map(i => {
            const filled = hasReviews && avgRating ? i <= Math.round(avgRating) : false
            return (
              <Star
                key={i}
                className="h-4 w-4"
                fill={filled ? accentText : 'none'}
                stroke={filled ? accentText : '#d6d3d1'}
                strokeWidth={1.5}
              />
            )
          })}
        </div>
        <span className="text-xs text-stone-500">
          {hasReviews
            ? <><strong className="text-stone-900">{displayAvg}</strong> ({reviewCount} review{reviewCount !== 1 ? 's' : ''})</>
            : <span className="text-stone-400">No reviews yet</span>
          }
        </span>
      </div>

      <div className="h-8 w-px bg-stone-100" aria-hidden />

      {/* User avatars */}
      <div className="flex items-center gap-2.5">
        {recentReviewers.length > 0 ? (
          <ReviewerAvatars reviewers={recentReviewers} color={primaryColor} />
        ) : (
          <AvatarStackPlaceholder color={primaryColor} />
        )}
        <span className="text-xs text-stone-500">
          {hasReviews
            ? <><strong className="text-stone-900">{reviewCount}</strong> reviewer{reviewCount !== 1 ? 's' : ''}</>
            : <span className="text-stone-400">Be the first!</span>
          }
        </span>
      </div>

      <div className="h-8 w-px bg-stone-100 hidden sm:block" aria-hidden />

      {/* Community badge */}
      <div
        className="hidden sm:flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold"
        style={{ background: accentBg, color: accentText }}
      >
        <MessageSquare className="h-3.5 w-3.5" />
        {hasReviews ? 'Community reviews' : 'Leave a review'}
      </div>
    </div>
  )
}

function ReviewerAvatars({ reviewers, color }: { reviewers: ReviewerMeta[]; color: string }) {
  return (
    <div className="flex -space-x-2">
      {reviewers.map((r, i) => {
        const name = r.email.split('@')[0] ?? '?'
        const shades = ['cc', 'aa', '88', '66']
        return r.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={r.id}
            src={r.avatarUrl}
            alt={name}
            referrerPolicy="no-referrer"
            className="h-7 w-7 rounded-full border-2 border-white object-cover"
          />
        ) : (
          <div
            key={r.id}
            className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-white text-[10px] font-bold text-white select-none"
            style={{ background: `${color}${shades[i] ?? '66'}` }}
          >
            {name[0]?.toUpperCase() ?? '?'}
          </div>
        )
      })}
    </div>
  )
}

function AvatarStackPlaceholder({ color }: { color: string }) {
  const shades = ['cc', 'aa', '88', '66']
  return (
    <div className="flex -space-x-2">
      {shades.map((s, i) => (
        <div
          key={i}
          className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-white text-[10px] font-bold text-white select-none"
          style={{ background: `${color}${s}` }}
        >
          ?
        </div>
      ))}
    </div>
  )
}

// ── Community Feedback section ────────────────────────────────────────────────

function CommunitySection({ primaryColor, light, appId, reviewStats }: {
  primaryColor: string
  light:        boolean
  appId:        string
  reviewStats:  ReviewStats
}) {
  const accentText = light ? darken(primaryColor, 0.25) : primaryColor
  const hasReviews = reviewStats.total > 0

  return (
    <div className="mt-4 rounded-2xl border border-stone-100 bg-white overflow-hidden shadow-sm">
      {/* Section header */}
      <div className="px-6 py-5 border-b border-stone-100">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-stone-800">
              {hasReviews ? `Reviews (${reviewStats.total})` : 'Reviews'}
            </p>
            <p className="text-xs text-stone-400 mt-0.5">
              {hasReviews ? 'What the community thinks' : 'No reviews yet — be the first!'}
            </p>
          </div>
          {hasReviews && reviewStats.avgRating && (
            <div className="flex items-center gap-1.5">
              <span className="text-2xl font-bold text-stone-900">
                {reviewStats.avgRating.toFixed(1)}
              </span>
              <div className="flex flex-col gap-0.5">
                <div className="flex gap-0.5">
                  {[1,2,3,4,5].map(i => (
                    <Star
                      key={i}
                      className="h-3.5 w-3.5"
                      fill={i <= Math.round(reviewStats.avgRating!) ? accentText : 'none'}
                      stroke={i <= Math.round(reviewStats.avgRating!) ? accentText : '#d6d3d1'}
                      strokeWidth={1.5}
                    />
                  ))}
                </div>
                <span className="text-[10px] text-stone-400">out of 5</span>
              </div>
            </div>
          )}
        </div>
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

// ── Big CTA ───────────────────────────────────────────────────────────────────

function BigCTA({
  href, primaryColor, darkened, onBrand,
}: {
  href: string; primaryColor: string; darkened: string; onBrand: string
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="group relative flex w-full items-center justify-center gap-3 overflow-hidden rounded-3xl px-8 py-5 text-lg font-black transition-all duration-200 active:scale-[0.99]"
      style={{
        background: `linear-gradient(135deg, ${primaryColor} 0%, ${darkened} 100%)`,
        color:       onBrand,
        boxShadow:  `0 8px 40px ${primaryColor}55`,
      }}
    >
      <span
        className="pointer-events-none absolute inset-0 translate-x-[-100%] bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-700 group-hover:translate-x-[100%]"
        aria-hidden
      />
      <ExternalLink className="h-5 w-5" />
      Open App
      <ArrowUpRight className="h-5 w-5 opacity-80" />
    </a>
  )
}
