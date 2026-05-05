'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Globe, ArrowUpRight } from 'lucide-react'
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
  const appPath   = `/apps/${app.slug ?? app.id}`
  const accent    = app.primaryColor ?? '#0D9488'

  return (
    <article
      className={cn(
        'group relative flex items-center gap-4 overflow-hidden rounded-2xl',
        'border border-stone-200/80 bg-white',
        'px-4 py-4 sm:px-5',
        'shadow-sm transition-all duration-200',
        'hover:border-stone-300 hover:shadow-lg hover:shadow-stone-200/70 hover:-translate-y-0.5',
        className,
      )}
    >
      {/* Left color accent strip */}
      <span
        aria-hidden
        className="pointer-events-none absolute left-0 top-4 bottom-4 w-[3px] rounded-r-full opacity-60 transition-opacity duration-200 group-hover:opacity-100"
        style={{ background: accent }}
      />

      {/* Full-card link */}
      <Link
        href={appPath}
        className="absolute inset-0 z-0 rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-900/20"
        aria-label={`View details for ${app.name}`}
      />

      {/* ── Icon ── */}
      <div className="pointer-events-none shrink-0">
        <AppIcon iconUrl={app.iconUrl} name={app.name} accent={accent} />
      </div>

      {/* ── Name / tagline / meta ── */}
      <div className="pointer-events-none min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-bold text-stone-900">{app.name}</h3>
          {badge && <BadgePill badge={badge} />}
        </div>

        <p className="mt-0.5 truncate text-sm text-stone-500">{app.tagline}</p>

        {(categoryName || domain) && (
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {categoryName && (
              <span className="inline-flex items-center rounded-full bg-stone-100 px-2.5 py-0.5 text-[11px] font-medium text-stone-600">
                {categoryName}
              </span>
            )}
            {domain && (
              <span className="flex items-center gap-1 truncate text-xs text-stone-400">
                <Globe className="h-3 w-3 shrink-0" aria-hidden />
                <span className="truncate">{domain}</span>
              </span>
            )}
          </div>
        )}
      </div>

      {/* ── Launch button ── */}
      <div className="pointer-events-auto relative z-10 shrink-0">
        {hasLaunch ? (
          <a
            href={app.launchUrl!}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 rounded-full bg-stone-900 px-3 py-1.5 text-[11px] font-semibold text-white transition-all duration-150 hover:scale-105 hover:bg-stone-700 active:scale-95"
            aria-label={`Launch ${app.name}`}
          >
            Open <ArrowUpRight className="h-3 w-3" />
          </a>
        ) : (
          <span
            className="inline-flex items-center rounded-full bg-stone-100 px-3 py-1.5 text-[11px] font-medium text-stone-400 cursor-not-allowed"
            title="No launch URL yet"
          >
            Soon
          </span>
        )}
      </div>
    </article>
  )
}

// ── AppIcon ───────────────────────────────────────────────────────────────────

function AppIcon({ iconUrl, name, accent }: { iconUrl: string | null; name: string; accent: string }) {
  const [failed, setFailed] = useState(false)

  if (iconUrl && !failed) {
    return (
      <div className="h-14 w-14 shrink-0 overflow-hidden rounded-2xl border border-stone-200/80 bg-stone-50 shadow-sm">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={iconUrl} alt="" className="h-full w-full object-cover" onError={() => setFailed(true)} />
      </div>
    )
  }

  return (
    <div
      className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl shadow-sm"
      style={{ background: `linear-gradient(135deg, ${accent}cc, ${accent})` }}
    >
      <span className="text-xl font-bold text-white">{name.charAt(0).toUpperCase()}</span>
    </div>
  )
}

// ── BadgePill ─────────────────────────────────────────────────────────────────

function BadgePill({ badge }: { badge: AppBadge }) {
  return badge === 'new' ? (
    <span className="inline-flex shrink-0 items-center rounded-full border border-violet-200 bg-violet-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-violet-700">
      ✦ New
    </span>
  ) : (
    <span className="inline-flex shrink-0 items-center rounded-full border border-orange-200 bg-orange-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-orange-600">
      🔥 Hot
    </span>
  )
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function extractDomain(url: string | null | undefined): string | null {
  if (!url) return null
  try { return new URL(url).hostname } catch { return null }
}
