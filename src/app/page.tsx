import { AlertCircle } from 'lucide-react'
import { GamifiedFeed } from '@/components/gamified/GamifiedFeed'
import { GamificationProvider } from '@/components/gamified/GamificationContext'
import { apiClient } from '@/lib/api/client'
import type { ApiResponse, App, Category, Paginated } from '@/lib/api/types'

// ---------------------------------------------------------------------------
// Data fetching
// ---------------------------------------------------------------------------

interface FeedData {
  apps: App[]
  categories: Category[]
  error?: string
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

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function HomePage() {
  const { apps, categories, error } = await getFeedData()

  return (
    <GamificationProvider>
      <div className="relative min-h-screen bg-background">
        {/* API error banner */}
        {error && (
          <div className="mx-auto max-w-md px-4 pt-4">
            <div className="flex items-center gap-3 rounded-2xl border-2 border-red-200 bg-red-50 p-4 text-sm text-red-600">
              <AlertCircle className="h-5 w-5 shrink-0" />
              {error}
            </div>
          </div>
        )}

        {/* Main gamified feed */}
        {apps.length > 0 ? (
          <GamifiedFeed apps={apps} categories={categories} />
        ) : !error ? (
          <EmptyFeed />
        ) : null}
      </div>
    </GamificationProvider>
  )
}

// ── Empty state ───────────────────────────────────────────────────────────────

function EmptyFeed() {
  return (
    <div className="mx-auto max-w-md px-4 py-20">
      <div className="flex flex-col items-center justify-center rounded-3xl border-4 border-dashed border-emerald-200 bg-emerald-50/50 py-16 text-center">
        <div className="text-5xl mb-4">🚀</div>
        <p className="font-bold text-stone-800 text-xl">No apps yet</p>
        <p className="mt-2 text-base text-stone-500 max-w-xs">
          Be the first to launch something great on Imagine.
        </p>
        <a href="/submit" className="btn-primary mt-6">
          Submit your app
        </a>
      </div>
    </div>
  )
}
