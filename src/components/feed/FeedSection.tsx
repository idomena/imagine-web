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
    <section className={cn('mx-auto max-w-3xl px-4 sm:px-6 py-10', className)}>

      {/* Section header */}
      <div className="mb-5 flex items-end justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-stone-800">
            {title}
            {count !== undefined && count > 0 && (
              <span className="ml-2 text-sm font-normal text-stone-400">{count}</span>
            )}
          </h2>
          {subtitle && (
            <p className="mt-0.5 text-sm text-stone-500">{subtitle}</p>
          )}
        </div>

        {viewAllHref && (
          <Link href={viewAllHref} className="btn-ghost shrink-0 py-1 text-sm">
            View all
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        )}
      </div>

      {/* Content */}
      {emptyState ? (
        emptyState
      ) : variant === 'list' ? (
        <div className="flex flex-col gap-2.5">{children}</div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {children}
        </div>
      )}

    </section>
  )
}
