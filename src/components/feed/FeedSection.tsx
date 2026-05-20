'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRight, Trophy } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FeedSectionProps {
  title:        string
  subtitle?:    string
  count?:       number
  totalPossible?: number
  viewAllHref?: string
  emptyState?:  React.ReactNode
  variant?:     'list' | 'grid' | 'journey'
  className?:   string
  children:     React.ReactNode
}

export function FeedSection({
  title,
  subtitle,
  count,
  totalPossible,
  viewAllHref,
  emptyState,
  variant = 'journey',
  className,
  children,
}: FeedSectionProps) {
  const showProgress = count !== undefined && count > 0

  return (
    <section className={cn('mx-auto max-w-5xl px-4 sm:px-6 py-10', className)}>

      {/* Section header */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="mb-8"
      >
        <div className="flex items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 to-teal-400 shadow-md shadow-sky-200/60">
              <Trophy className="h-4 w-4 text-white" aria-hidden />
            </div>
            <div>
              <h2 className="text-base font-black text-stone-900 tracking-tight">{title}</h2>
              {subtitle && (
                <p className="text-[12px] text-stone-400 mt-0.5">{subtitle}</p>
              )}
            </div>
          </div>

          {viewAllHref && (
            <Link
              href={viewAllHref}
              className="inline-flex shrink-0 items-center gap-1 rounded-full border border-stone-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-stone-600 shadow-sm transition-all duration-150 hover:border-sky-200 hover:text-sky-700 hover:shadow-md hover:-translate-y-px"
            >
              View all
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          )}
        </div>

        {/* Discovery progress bar */}
        {showProgress && (
          <div className="flex items-center gap-3">
            <div className="progress-track flex-1">
              <motion.div
                className="progress-fill"
                initial={{ width: 0 }}
                whileInView={{ width: `${Math.min(100, (count / (totalPossible ?? count)) * 100)}%` }}
                viewport={{ once: true }}
                transition={{ duration: 1, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
              />
            </div>
            <span className="shrink-0 text-[11px] font-bold text-stone-400 tabular-nums">
              {count} apps
            </span>
          </div>
        )}
      </motion.div>

      {/* Content */}
      {emptyState ? (
        emptyState
      ) : variant === 'list' ? (
        <div className="flex flex-col gap-3">{children}</div>
      ) : variant === 'grid' ? (
        <div className="grid gap-4 grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {children}
        </div>
      ) : (
        /* journey — default: responsive 2→3 col grid */
        <div className="grid gap-4 grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {children}
        </div>
      )}

    </section>
  )
}
