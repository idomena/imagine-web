'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Sparkles, Flame, Star, ArrowUpRight, Lock, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { App } from '@/lib/api/types'

export type CardBadge = 'new' | 'trending' | 'popular' | 'unlocked'

interface JourneyCardProps {
  app: App
  badge?: CardBadge
  categoryName?: string
  index: number
  isUnlocked?: boolean
  xpReward?: number
  className?: string
}

export function JourneyCard({
  app,
  badge,
  categoryName,
  index,
  isUnlocked = true,
  xpReward = 50,
  className,
}: JourneyCardProps) {
  const [isHovered, setIsHovered] = useState(false)
  const appPath = `/apps/${app.slug ?? app.id}`
  const accent = app.primaryColor ?? '#10B981'
  const hasLaunch = Boolean(app.launchUrl)

  // Alternate card positions for journey feel
  const isEven = index % 2 === 0

  return (
    <motion.article
      initial={{ opacity: 0, y: 40, scale: 0.95 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ 
        duration: 0.5, 
        delay: index * 0.08,
        type: 'spring',
        stiffness: 100 
      }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className={cn(
        'relative w-full max-w-sm mx-auto',
        isEven ? 'sm:mr-auto sm:ml-8' : 'sm:ml-auto sm:mr-8',
        className
      )}
    >
      {/* Journey connector line */}
      {index > 0 && (
        <div 
          className="absolute -top-8 left-1/2 -translate-x-1/2 w-1 h-8 rounded-full"
          style={{ 
            background: isUnlocked 
              ? 'linear-gradient(to bottom, rgb(52 211 153), rgb(16 185 129))' 
              : 'linear-gradient(to bottom, rgb(212 212 216), rgb(161 161 170))' 
          }}
        />
      )}

      {/* Main card */}
      <motion.div
        whileHover={{ scale: 1.02, y: -4 }}
        whileTap={{ scale: 0.98 }}
        className={cn(
          'relative overflow-hidden rounded-3xl border-4 bg-white',
          'shadow-xl transition-shadow duration-300',
          isUnlocked 
            ? 'border-emerald-300 shadow-emerald-100/60' 
            : 'border-stone-300 shadow-stone-200/40 opacity-75'
        )}
        style={isUnlocked ? { borderColor: `${accent}66` } : undefined}
      >
        {/* Glow effect on hover */}
        {isUnlocked && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: isHovered ? 1 : 0 }}
            className="absolute inset-0 pointer-events-none"
            style={{
              background: `radial-gradient(circle at 50% 50%, ${accent}22, transparent 70%)`
            }}
          />
        )}

        {/* Lock overlay for locked cards */}
        {!isUnlocked && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/60 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', delay: 0.2 }}
              className="flex flex-col items-center gap-2"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-stone-200">
                <Lock className="h-6 w-6 text-stone-500" />
              </div>
              <span className="text-sm font-bold text-stone-500">Keep exploring</span>
            </motion.div>
          </div>
        )}

        {/* Card content */}
        <Link href={isUnlocked ? appPath : '#'} className={cn(!isUnlocked && 'pointer-events-none')}>
          <div className="p-5">
            {/* Top row: Icon + Badges */}
            <div className="flex items-start gap-4">
              <AppIcon iconUrl={app.iconUrl} name={app.name} accent={accent} />
              
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <h3 className="font-bold text-lg text-stone-900 truncate">{app.name}</h3>
                  {badge && <BadgePill badge={badge} />}
                </div>
                <p className="text-sm text-stone-500 line-clamp-2">{app.tagline}</p>
              </div>
            </div>

            {/* Category + XP reward */}
            <div className="mt-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                {categoryName && (
                  <span className="inline-flex items-center rounded-full bg-stone-100 px-3 py-1 text-xs font-semibold text-stone-600">
                    {categoryName}
                  </span>
                )}
                {isUnlocked && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-purple-50 px-3 py-1 text-xs font-bold text-purple-600">
                    <Star className="h-3 w-3 fill-current" />
                    +{xpReward} XP
                  </span>
                )}
              </div>
            </div>

            {/* Launch button */}
            <div className="mt-4">
              {hasLaunch && isUnlocked ? (
                <motion.a
                  href={app.launchUrl!}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-200/50 transition-colors hover:bg-emerald-400"
                >
                  <span>Launch App</span>
                  <ArrowUpRight className="h-4 w-4" />
                </motion.a>
              ) : !isUnlocked ? (
                <div className="flex w-full items-center justify-center gap-2 rounded-2xl bg-stone-200 px-4 py-3 text-sm font-semibold text-stone-400">
                  <Lock className="h-4 w-4" />
                  <span>Locked</span>
                </div>
              ) : (
                <div className="flex w-full items-center justify-center gap-2 rounded-2xl bg-stone-100 px-4 py-3 text-sm font-semibold text-stone-400">
                  <span>Coming Soon</span>
                </div>
              )}
            </div>
          </div>
        </Link>

        {/* Progress indicator at bottom */}
        {isUnlocked && (
          <div className="h-1.5 w-full bg-stone-100">
            <motion.div
              initial={{ width: 0 }}
              whileInView={{ width: '100%' }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="h-full rounded-full"
              style={{ background: `linear-gradient(to right, ${accent}, ${accent}cc)` }}
            />
          </div>
        )}
      </motion.div>

      {/* Completion check for unlocked cards */}
      {isUnlocked && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          whileInView={{ scale: 1, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ type: 'spring', delay: 0.4 + index * 0.08 }}
          className="absolute -bottom-3 left-1/2 -translate-x-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500 shadow-lg shadow-emerald-200"
        >
          <CheckCircle2 className="h-5 w-5 text-white" />
        </motion.div>
      )}
    </motion.article>
  )
}

// ── AppIcon ───────────────────────────────────────────────────────────────────

function AppIcon({ iconUrl, name, accent }: { iconUrl: string | null; name: string; accent: string }) {
  const [failed, setFailed] = useState(false)

  if (iconUrl && !failed) {
    return (
      <div className="h-16 w-16 shrink-0 overflow-hidden rounded-2xl border-2 border-stone-100 bg-white shadow-md">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={iconUrl} alt="" className="h-full w-full object-cover" onError={() => setFailed(true)} />
      </div>
    )
  }

  return (
    <div
      className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl shadow-md"
      style={{ background: `linear-gradient(135deg, ${accent}, ${accent}dd)` }}
    >
      <span className="text-2xl font-bold text-white">{name.charAt(0).toUpperCase()}</span>
    </div>
  )
}

// ── BadgePill ─────────────────────────────────────────────────────────────────

function BadgePill({ badge }: { badge: CardBadge }) {
  const badges = {
    new: {
      icon: Sparkles,
      label: 'New',
      className: 'border-blue-300 bg-blue-50 text-blue-600'
    },
    trending: {
      icon: Flame,
      label: 'Hot',
      className: 'border-orange-300 bg-orange-50 text-orange-600'
    },
    popular: {
      icon: Star,
      label: 'Popular',
      className: 'border-yellow-300 bg-yellow-50 text-yellow-600'
    },
    unlocked: {
      icon: CheckCircle2,
      label: 'Unlocked',
      className: 'border-emerald-300 bg-emerald-50 text-emerald-600'
    }
  }

  const { icon: Icon, label, className } = badges[badge]

  return (
    <motion.span
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: 'spring', stiffness: 500 }}
      className={cn(
        'inline-flex shrink-0 items-center gap-1 rounded-full border-2 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider',
        className
      )}
    >
      <Icon className="h-3 w-3" />
      {label}
    </motion.span>
  )
}
