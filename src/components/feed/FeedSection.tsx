import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FeedSectionProps {
  title:        string
  subtitle?:    string
  count?:       number
  viewAllHref?: string
  emptyState?:  React.ReactNode
  variant?:     'list' | 'grid'
  className?:   string
  children:     React.ReactNode
}

export function FeedSection({
  title,
  subtitle,
  count,
  viewAllHref,
  emptyState,
  variant = 'list',
  className,
  children,
}: FeedSectionProps) {
  return (
    <section className={cn('mx-auto max-w-4xl px-4 sm:px-6 py-10', className)}>

      {/* Section header */}
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-sm font-bold text-stone-800">
              {title}
            </h2>
            {count !== undefined && count > 0 && (
              <span className="inline-flex items-center rounded-full bg-stone-100 px-2 py-0.5 text-xs font-semibold text-stone-500">
                {count}
              </span>
            )}
          </div>
          {subtitle && (
            <p className="mt-0.5 text-xs text-stone-400">{subtitle}</p>
          )}
        </div>

        {viewAllHref && (
          <Link
            href={viewAllHref}
            className="inline-flex shrink-0 items-center gap-1 rounded-full border border-stone-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-stone-600 shadow-sm transition-all duration-150 hover:border-stone-300 hover:shadow-md hover:-translate-y-px"
          >
            View all
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        )}
      </div>

      {/* Content */}
      {emptyState ? (
        emptyState
      ) : variant === 'list' ? (
        <div className="flex flex-col gap-3">{children}</div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {children}
        </div>
      )}

    </section>
  )
}
