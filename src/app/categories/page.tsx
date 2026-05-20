import Link from 'next/link'
import { LayoutGrid } from 'lucide-react'
import { apiClient } from '@/lib/api/client'
import type { ApiResponse, Category } from '@/lib/api/types'

async function getCategories(): Promise<Category[]> {
  try {
    const res = await apiClient.get<ApiResponse<Category[]>>(
      '/api/v1/categories',
      { next: { revalidate: 300 } } as RequestInit,
    )
    return res.data ?? []
  } catch {
    return []
  }
}

const TINTS = [
  '#0EA5E9', '#14B8A6', '#F59E0B', '#EF4444',
  '#8B5CF6', '#10B981', '#F97316', '#3B82F6',
  '#EC4899', '#84CC16', '#06B6D4', '#A855F7',
]

export default async function CategoriesPage() {
  const categories = await getCategories()

  return (
    <div className="min-h-screen animate-fade-in" style={{ background: 'rgb(var(--color-background))' }}>
      <div className="mx-auto max-w-5xl px-4 sm:px-6 py-10">

        {/* Header */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-400 to-teal-500 shadow-lg shadow-sky-200/60">
              <LayoutGrid className="h-5 w-5 text-white" aria-hidden />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">Categories</h1>
              <p className="text-sm text-slate-500">Browse apps by category</p>
            </div>
          </div>
          {categories.length > 0 && (
            <div className="mt-4">
              <span className="rounded-full bg-sky-50 border border-sky-200 px-3 py-1 text-xs font-semibold text-sky-700">
                {categories.length} categories
              </span>
            </div>
          )}
        </div>

        {categories.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-sky-200 bg-white py-20 text-center shadow-sm">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-sky-50">
              <LayoutGrid className="h-7 w-7 text-sky-300" />
            </div>
            <p className="font-black text-slate-700 text-lg">No categories yet</p>
            <p className="mt-2 text-sm text-slate-500 max-w-xs">
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
                  className="group flex flex-col items-center gap-3 rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm hover:shadow-lg hover:border-sky-200 transition-all duration-200 hover:-translate-y-1 text-center"
                >
                  <div
                    className="flex h-14 w-14 items-center justify-center rounded-2xl text-2xl select-none transition-transform duration-200 group-hover:scale-110"
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
                    <p className="text-sm font-black text-slate-900 group-hover:text-sky-600 transition-colors">
                      {cat.name}
                    </p>
                    {cat.description && (
                      <p className="mt-0.5 text-xs text-slate-400 line-clamp-2">
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
