import { Flame, AlertCircle } from 'lucide-react'
import { AppCard } from '@/components/apps/AppCard'
import { apiClient } from '@/lib/api/client'
import type { ApiResponse, App, Paginated, ReviewStats } from '@/lib/api/types'

// ---------------------------------------------------------------------------
// Trending page  —  /trending
//
// Fetches up to 50 published apps, enriches each with its review count via
// parallel server-side fetches (Next.js deduplicates + caches each request),
// then renders them sorted by review count descending.
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

    // Fetch review totals for every app in parallel.
    // Each call is independently cached by Next.js ISR; cold-path latency is
    // dominated by the slowest single request, not the sum of all.
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

    // Primary sort: most reviews. Tiebreaker: newest publishedAt.
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

  return (
    <div className="min-h-screen bg-[#FDFDF9] animate-fade-in">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">

        {/* Header */}
        <div className="pt-8 pb-4">
          <div className="flex items-center gap-2.5">
            <Flame className="h-5 w-5 text-orange-500" aria-hidden />
            <h1 className="text-xl font-bold text-stone-900">Trending</h1>
          </div>
          <p className="mt-1 text-sm text-stone-500">
            Most reviewed apps in the community.
          </p>
        </div>

        {/* Error banner */}
        {error && (
          <div className="mb-4 flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        {/* App list */}
        {apps.length === 0 && !error ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-stone-200 bg-white py-16 text-center shadow-sm">
            <Flame className="h-9 w-9 text-orange-200 mb-3" aria-hidden />
            <p className="font-medium text-stone-700">No trending apps yet</p>
            <p className="mt-1 text-sm text-stone-500 max-w-xs">
              Apps will appear here once they receive community reviews.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2.5 pb-6">
            {apps.map((app, i) => (
              <div key={app.id} className="relative">
                <AppCard app={app} />
                {/* Rank badge — top 3 get a subtle accent */}
                {i < 3 && app.reviewCount > 0 && (
                  <span
                    className="absolute left-3 top-3 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full px-1 text-[10px] font-bold text-white select-none"
                    style={{
                      background: i === 0 ? '#f97316' : i === 1 ? '#94a3b8' : '#a16207',
                    }}
                    aria-label={`Rank ${i + 1}`}
                  >
                    {i + 1}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  )
}
