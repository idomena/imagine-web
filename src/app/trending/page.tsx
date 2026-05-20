import { AlertCircle, Flame, Star, TrendingUp } from 'lucide-react'
import { AppCard } from '@/components/apps/AppCard'
import { apiClient } from '@/lib/api/client'
import type { ApiResponse, App, Paginated, ReviewStats } from '@/lib/api/types'

// ---------------------------------------------------------------------------
// Data fetching
// ---------------------------------------------------------------------------

interface TrendingApp extends App {
  reviewCount: number
}

async function getTrendingApps(): Promise<{ apps: TrendingApp[]; error?: string }> {
  try {
    const opts = { next: { revalidate: 120 } } as RequestInit

    const appsRes = await apiClient.get<ApiResponse<Paginated<App>>>(
      '/api/v1/apps?limit=50',
      opts,
    )
    const apps = appsRes.data.items
    if (apps.length === 0) return { apps: [] }

    const results = await Promise.allSettled(
      apps.map(app =>
        apiClient
          .get<ApiResponse<ReviewStats>>(`/api/v1/apps/${app.id}/reviews?limit=1`, opts)
          .then(r => ({ id: app.id, total: r.data.total }))
      )
    )

    const countMap = new Map<string, number>()
    for (const r of results) {
      if (r.status === 'fulfilled') countMap.set(r.value.id, r.value.total)
    }

    const enriched: TrendingApp[] = apps.map(app => ({
      ...app,
      reviewCount: countMap.get(app.id) ?? 0,
    }))

    enriched.sort((a, b) => {
      const diff = b.reviewCount - a.reviewCount
      if (diff !== 0) return diff
      return (
        new Date(b.publishedAt ?? 0).getTime() -
        new Date(a.publishedAt ?? 0).getTime()
      )
    })

    return { apps: enriched }
  } catch {
    return { apps: [], error: 'Could not reach the API.' }
  }
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function TrendingPage() {
  const { apps, error } = await getTrendingApps()

  const topThree = apps.slice(0, 3)
  const rest     = apps.slice(3)
  const maxReviews = apps[0]?.reviewCount ?? 1

  return (
    <div className="min-h-screen animate-fade-in" style={{ background: 'rgb(var(--color-background))' }}>
      <div className="mx-auto max-w-5xl px-4 sm:px-6 py-10">

        {/* ── Hero header ── */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-400 to-rose-500 shadow-lg shadow-orange-200/60">
              <Flame className="h-5 w-5 text-white" aria-hidden />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">Leaderboard</h1>
              <p className="text-sm text-slate-500">Most loved apps in the community</p>
            </div>
          </div>

          {apps.length > 0 && (
            <div className="flex items-center gap-2 mt-4">
              <span className="rounded-full bg-orange-50 border border-orange-200 px-3 py-1 text-xs font-semibold text-orange-700">
                🔥 {apps.length} ranked apps
              </span>
              {apps[0] && apps[0].reviewCount > 0 && (
                <span className="rounded-full bg-amber-50 border border-amber-200 px-3 py-1 text-xs font-semibold text-amber-700">
                  ⭐ Top: {apps[0].reviewCount} reviews
                </span>
              )}
            </div>
          )}
        </div>

        {/* ── Error banner ── */}
        {error && (
          <div className="mb-6 flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        {/* ── Empty state ── */}
        {apps.length === 0 && !error && (
          <div className="flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-orange-200 bg-white py-20 text-center shadow-sm">
            <Flame className="h-12 w-12 text-orange-200 mb-4" aria-hidden />
            <p className="font-black text-slate-700 text-lg">No trending apps yet</p>
            <p className="mt-2 text-sm text-slate-500 max-w-xs">
              Apps climb the leaderboard once they receive community reviews.
            </p>
          </div>
        )}

        {/* ── Podium — top 3 ── */}
        {topThree.length > 0 && (
          <div className="mb-10">
            <div className="flex items-center gap-2 mb-5">
              <TrendingUp className="h-4 w-4 text-slate-400" aria-hidden />
              <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Top 3</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {topThree.map((app, i) => (
                <div key={app.id} className="relative">
                  {/* Medal badge */}
                  <div
                    className="absolute -top-3 -right-1 z-20 flex h-8 w-8 items-center justify-center rounded-full text-lg shadow-lg ring-2 ring-white"
                    style={{ background: medalBg(i) }}
                    aria-label={`Rank ${i + 1}`}
                  >
                    {medalEmoji(i)}
                  </div>

                  <AppCard app={app} index={i} />

                  {/* Review heat bar */}
                  {app.reviewCount > 0 && (
                    <div className="mt-2 px-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Heat</span>
                        <span className="flex items-center gap-0.5 text-[10px] font-bold text-orange-500">
                          <Star className="h-3 w-3 fill-orange-400 text-orange-400" />
                          {app.reviewCount}
                        </span>
                      </div>
                      <div className="progress-track">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-orange-400 to-rose-400 transition-all duration-700"
                          style={{ width: `${(app.reviewCount / maxReviews) * 100}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Rest of leaderboard ── */}
        {rest.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-5">
              <span className="text-xs font-bold uppercase tracking-widest text-slate-400">#4 and beyond</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {rest.map((app, i) => (
                <div key={app.id} className="relative">
                  {/* Rank number badge */}
                  <div className="absolute -top-2.5 -right-1 z-20 flex h-6 min-w-[1.5rem] items-center justify-center rounded-full bg-slate-700 px-1.5 text-[10px] font-black text-white shadow ring-2 ring-white">
                    #{i + 4}
                  </div>
                  <AppCard app={app} index={i + 3} />
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function medalEmoji(rank: number): string {
  return rank === 0 ? '🥇' : rank === 1 ? '🥈' : '🥉'
}

function medalBg(rank: number): string {
  return rank === 0
    ? 'linear-gradient(135deg, #F59E0B, #EAB308)'
    : rank === 1
    ? 'linear-gradient(135deg, #94A3B8, #CBD5E1)'
    : 'linear-gradient(135deg, #A16207, #CA8A04)'
}
