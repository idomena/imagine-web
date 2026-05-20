'use client'

import { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface JourneyFeedProps {
  children: ReactNode
  className?: string
}

export function JourneyFeed({ children, className }: JourneyFeedProps) {
  return (
    <div className={cn('relative pb-20', className)}>
      {/* Central journey path line */}
      <div className="pointer-events-none absolute left-1/2 top-0 bottom-0 -translate-x-1/2">
        <motion.div
          initial={{ height: 0 }}
          animate={{ height: '100%' }}
          transition={{ duration: 1.5, ease: 'easeOut' }}
          className="w-1 rounded-full bg-gradient-to-b from-emerald-300 via-teal-400 to-emerald-300"
        />
      </div>

      {/* Journey milestones */}
      <div className="relative z-10 flex flex-col gap-12 px-4 sm:px-6">
        {children}
      </div>

      {/* End marker */}
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        whileInView={{ scale: 1, opacity: 1 }}
        viewport={{ once: true }}
        transition={{ type: 'spring', delay: 0.5 }}
        className="relative z-10 mx-auto mt-12 flex flex-col items-center"
      >
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 shadow-xl shadow-emerald-200/50">
          <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 12l5 5L20 7" />
          </svg>
        </div>
        <p className="mt-3 text-sm font-bold text-stone-500">More coming soon!</p>
      </motion.div>
    </div>
  )
}

// ── Journey Section (for grouping cards by category) ──────────────────────────

interface JourneySectionProps {
  title: string
  subtitle?: string
  icon?: ReactNode
  children: ReactNode
  className?: string
}

export function JourneySection({ title, subtitle, icon, children, className }: JourneySectionProps) {
  return (
    <motion.section
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, margin: '-100px' }}
      className={cn('relative', className)}
    >
      {/* Section header */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
        className="mb-6 flex items-center gap-3 px-2 sm:px-8"
      >
        {icon && (
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
            {icon}
          </div>
        )}
        <div>
          <h2 className="text-lg font-bold text-stone-900">{title}</h2>
          {subtitle && <p className="text-sm text-stone-500">{subtitle}</p>}
        </div>
      </motion.div>

      {/* Cards */}
      <div className="flex flex-col gap-10">
        {children}
      </div>
    </motion.section>
  )
}
