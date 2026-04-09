import Link from 'next/link'
import { LayoutGrid } from 'lucide-react'
import { apiClient } from '@/lib/api/client'
import type { ApiResponse, Category } from '@/lib/api/types'

// ---------------------------------------------------------------------------
// Categories page  —  /categories
// Visual grid of all categories; each card links to /explore?category=Name
// ---------------------------------------------------------------------------

async function getCategories(): Promise<Category[]> {
  try {
    const res = await apiClient.get<ApiResponse<Category[]>>(
      '/api/v1/categories',
      { next: { revalidate: 300 } } as RequestInit,
    )
    return res.data
  } catch {
    return []
  }
}

// Palette of tints used for category cards when no iconUrl is set.
const TINTS = [
  '#14b8a6', '#6366f1', '#f59e0b', '#ef4444',
  '#8b5cf6', '#10b981', '#f97316', '#3b82f6',
  '#ec4899', '#84cc16', '#06b6d4', '#a855f7',
]

export default async function CategoriesPage() {
  const categories = await getCategories()

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#FDFDF9]">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 py-10">

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2.5 mb-1">
            <LayoutGrid className="h-5 w-5 text-teal-600" />
            <h1 className="text-2xl font-bold text-stone-900">Categories</h1>
          </div>
          <p className="text-sm text-stone-500">Browse apps by category.</p>
        </div>

        {categories.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-stone-100 border border-stone-200">
              <LayoutGrid className="h-7 w-7 text-stone-400" />
            </div>
            <h2 className="text-base font-semibold text-stone-800">No categories yet</h2>
            <p className="mt-1.5 text-sm text-stone-500 max-w-xs">
              Categories will appear here once they are created.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {categories.map((cat, i) => {
              const tint = TINTS[i % TINTS.length]!
              return (
                <Link
                  key={cat.id}
                  href={`/explore?category=${encodeURIComponent(cat.name)}`}
                  className="group flex flex-col items-center gap-3 rounded-2xl border border-stone-200/80 bg-white p-6 shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 text-center"
                >
                  {/* Icon or color circle */}
                  <div
                    className="flex h-14 w-14 items-center justify-center rounded-2xl text-2xl select-none"
                    style={{ background: `${tint}18`, color: tint }}
                  >
                    {cat.iconUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={cat.iconUrl} alt="" className="h-8 w-8 object-contain" />
                    ) : (
                      <LayoutGrid className="h-6 w-6" style={{ color: tint }} />
                    )}
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-stone-900 group-hover:text-teal-700 transition-colors">
                      {cat.name}
                    </p>
                    {cat.description && (
                      <p className="mt-0.5 text-xs text-stone-400 line-clamp-2">
                        {cat.description}
                      </p>
                    )}
                  </div>
                </Link>
              )
            })}
          </div>
        )}

      </div>
    </div>
  )
}
