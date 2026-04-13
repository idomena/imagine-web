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
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-400">
            {title}
            {count !== undefined && count > 0 && (
              <span className="ml-2 font-normal">{count}</span>
            )}
          </h2>
          {subtitle && (
            <p className="mt-0.5 text-sm text-slate-500">{subtitle}</p>
          )}
        </div>

        {viewAllHref && (
          <Link
            href={viewAllHref}
            className="inline-flex shrink-0 items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
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
