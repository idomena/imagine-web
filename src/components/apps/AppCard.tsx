'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowUpRight, Zap } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { App } from '@/lib/api/types'

export type AppBadge = 'new' | 'trending'

interface AppCardProps {
  app:           App
  badge?:        AppBadge
  categoryName?: string
  className?:    string
  index?:        number
}

function stableXP(id: string): number {
  let h = 5381
  for (let i = 0; i < id.length; i++) h = ((h << 5) + h) ^ id.charCodeAt(i)
  return (Math.abs(h) % 90) + 10
}

export function AppCard({ app, badge, categoryName, className, index = 0 }: AppCardProps) {
  const [imgFailed, setImgFailed] = useState(false)
  const appPath  = `/apps/${app.slug ?? app.id}`
  const accent   = app.primaryColor ?? '#0EA5E9'
  const hasLaunch = Boolean(app.launchUrl)
  const xp       = stableXP(app.id)

  return (
    <motion.article
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{
        duration: 0.45,
        delay: (index % 8) * 0.06,
        ease: [0.22, 1, 0.36, 1],
      }}
      whileHover={{ y: -6, transition: { type: 'spring', stiffness: 380, damping: 22 } }}
      whileTap={{ scale: 0.97, transition: { duration: 0.1 } }}
      className={cn(
        'group relative flex flex-col overflow-hidden rounded-3xl bg-white',
        'border border-stone-100/80',
        'shadow-md shadow-stone-200/50',
        'transition-shadow duration-250 hover:shadow-xl hover:shadow-violet-100/60',
        className,
      )}
    >
      {/* Gradient accent band at top */}
      <div
        className="h-1.5 w-full shrink-0"
        style={{ background: `linear-gradient(90deg, ${accent}, ${accent}66)` }}
      />

      <div className="flex flex-col flex-1 p-4 sm:p-5 gap-3">

        {/* Icon row */}
        <div className="flex items-start justify-between gap-2">
          <AppIcon
            iconUrl={app.iconUrl}
            name={app.name}
            accent={accent}
            failed={imgFailed}
            onFail={() => setImgFailed(true)}
          />
          {badge && <BadgePill badge={badge} />}
        </div>

        {/* Name + tagline */}
        <div>
          <h3 className="font-black text-[15px] leading-snug text-stone-900 line-clamp-1">
            {app.name}
          </h3>
          <p className="mt-1 text-[13px] text-stone-500 line-clamp-2 leading-relaxed">
            {app.tagline}
          </p>
        </div>

        {/* Category + XP row */}
        <div className="flex items-center justify-between mt-auto pt-1">
          {categoryName ? (
            <span className="rounded-full bg-stone-50 border border-stone-100 px-2.5 py-0.5 text-[11px] font-medium text-stone-500">
              {categoryName}
            </span>
          ) : <span />}
          <span className="xp-badge">
            <Zap className="h-3 w-3 fill-amber-400 text-amber-400" aria-hidden />
            +{xp} XP
          </span>
        </div>

        {/* CTA button */}
        <div className="relative z-10 mt-1">
          {hasLaunch ? (
            <a
              href={app.launchUrl!}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              aria-label={`Launch ${app.name}`}
              className="flex w-full items-center justify-center gap-1.5 rounded-2xl py-2.5 text-[13px] font-bold text-white shadow-sm transition-all duration-150 hover:opacity-90 hover:shadow-md active:scale-95"
              style={{
                background: `linear-gradient(135deg, ${accent}ee, ${accent})`,
                boxShadow: `0 4px 16px ${accent}44`,
              }}
            >
              Launch App <ArrowUpRight className="h-3.5 w-3.5" />
            </a>
          ) : (
            <div className="flex w-full items-center justify-center rounded-2xl bg-stone-50 border border-stone-100 py-2.5 text-[13px] font-medium text-stone-400 cursor-default">
              Coming Soon
            </div>
          )}
        </div>

      </div>

      {/* Full-card link layer (under the CTA button) */}
      <Link
        href={appPath}
        className="absolute inset-0 z-0 rounded-3xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/40"
        aria-label={`View details for ${app.name}`}
      />
    </motion.article>
  )
}

// ── AppIcon ───────────────────────────────────────────────────────────────────

function AppIcon({
  iconUrl, name, accent, failed, onFail,
}: {
  iconUrl: string | null
  name:    string
  accent:  string
  failed:  boolean
  onFail:  () => void
}) {
  if (iconUrl && !failed) {
    return (
      <div className="h-16 w-16 shrink-0 overflow-hidden rounded-2xl border border-stone-100 shadow-sm">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={iconUrl} alt="" className="h-full w-full object-cover" onError={onFail} />
      </div>
    )
  }
  return (
    <div
      className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl shadow-sm text-2xl font-black text-white select-none"
      style={{ background: `linear-gradient(135deg, ${accent}cc, ${accent})` }}
    >
      {name.charAt(0).toUpperCase()}
    </div>
  )
}

// ── BadgePill ─────────────────────────────────────────────────────────────────

function BadgePill({ badge }: { badge: AppBadge }) {
  if (badge === 'new') return (
    <motion.span
      animate={{ scale: [1, 1.08, 1] }}
      transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
      className="inline-flex shrink-0 items-center rounded-full border border-sky-200 bg-sky-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-sky-700"
    >
      ✦ New
    </motion.span>
  )
  return (
    <motion.span
      animate={{ scale: [1, 1.08, 1] }}
      transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut', delay: 0.4 }}
      className="inline-flex shrink-0 items-center rounded-full border border-orange-200 bg-orange-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-orange-600"
    >
      🔥 Hot
    </motion.span>
  )
}
