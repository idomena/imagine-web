'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Play, Globe, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { App } from '@/lib/api/types'

export type AppBadge = 'new' | 'trending'

interface AppCardProps {
  app:           App
  badge?:        AppBadge
  categoryName?: string
  className?:    string
}

export function AppCard({ app, badge, categoryName, className }: AppCardProps) {
  const domain    = extractDomain(app.launchUrl)
  const hasLaunch = Boolean(app.launchUrl)

  const appPath = `/apps/${app.slug ?? app.id}`

  return (
    <article
      className={cn(
        'animate-fade-in',
        'group relative flex items-center gap-4 overflow-hidden rounded-2xl',
        'border border-stone-200/80 bg-white',
        'px-4 py-3.5 sm:px-5',
        'shadow-sm transition-all duration-200',
        'hover:-translate-y-px hover:border-teal-200 hover:shadow-md hover:shadow-stone-200/70',
        className,
      )}
    >
      {/* Subtle top-edge teal accent on hover */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-teal-400/50 to-transparent opacity-0 transition-opacity group-hover:opacity-100"
        aria-hidden
      />

      {/* Invisible details overlay */}
      <Link
        href={appPath}
        className="absolute inset-0 z-0 rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600/40"
        aria-label={`View details for ${app.name}`}
      />

      {/* ── Left: App icon ─────────────────────────────────────────────────── */}
      <div className="pointer-events-none shrink-0">
        <AppIcon iconUrl={app.iconUrl} />
      </div>

      {/* ── Center: Name, tagline, meta ─────────────────────────────────────── */}
      <div className="pointer-events-none min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-semibold text-stone-800">{app.name}</h3>
          {badge && <BadgePill badge={badge} />}
        </div>

        <p className="mt-0.5 truncate text-sm text-stone-500">{app.tagline}</p>

        {(categoryName || domain) && (
          <div className="mt-2 flex flex-wrap items-center gap-2.5 text-xs text-stone-400">
            {categoryName && (
              <span className="badge shrink-0">{categoryName}</span>
            )}
            {domain && (
              <span className="flex items-center gap-1 truncate">
                <Globe className="h-3 w-3 shrink-0" aria-hidden />
                <span className="truncate">{domain}</span>
              </span>
            )}
          </div>
        )}
      </div>

      {/* ── Right: Play button ─────────────────────────────────────────────── */}
      <div className="pointer-events-auto relative z-10 shrink-0">
        {hasLaunch ? (
          <a
            href={app.launchUrl!}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              'flex h-10 w-10 items-center justify-center rounded-full',
              'bg-teal-700 text-white',
              'transition-all duration-150 hover:bg-teal-600 hover:scale-110 active:scale-95',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600/40',
            )}
            aria-label={`Launch ${app.name}`}
          >
            <Play className="h-4 w-4 translate-x-px fill-current" aria-hidden />
          </a>
        ) : (
          <div
            className="flex h-10 w-10 cursor-not-allowed items-center justify-center rounded-full bg-stone-100"
            title="No launch URL yet"
            aria-hidden
          >
            <Play className="h-4 w-4 text-stone-400" />
          </div>
        )}
      </div>
    </article>
  )
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function AppIcon({ iconUrl }: { iconUrl: string | null }) {
  const [failed, setFailed] = useState(false)

  if (iconUrl && !failed) {
    return (
      <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-stone-200 bg-stone-50">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={iconUrl}
          alt=""
          className="h-full w-full object-cover"
          onError={() => setFailed(true)}
        />
      </div>
    )
  }

  return (
    <div
      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-stone-200 bg-stone-100"
      aria-hidden
    >
      <Sparkles className="h-5 w-5 text-stone-400" />
    </div>
  )
}

function BadgePill({ badge }: { badge: AppBadge }) {
  return badge === 'new' ? (
    <span className="inline-flex shrink-0 items-center rounded-full border border-teal-200 bg-teal-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-teal-700">
      ✦ New
    </span>
  ) : (
    <span className="inline-flex shrink-0 items-center rounded-full border border-rose-200 bg-rose-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-rose-600">
      ↑ Trending
    </span>
  )
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function extractDomain(url: string | null | undefined): string | null {
  if (!url) return null
  try { return new URL(url).hostname } catch { return null }
}
