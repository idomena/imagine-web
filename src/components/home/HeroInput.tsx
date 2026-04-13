'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight, Link2 } from 'lucide-react'
import { cn } from '@/lib/utils'

// ---------------------------------------------------------------------------
// HeroInput — guest hero URL input
// Pastes a URL → navigates to /submit?url=... (pre-fills the submit form)
// ---------------------------------------------------------------------------

export function HeroInput() {
  const [url, setUrl]     = useState('')
  const [focused, setFocused] = useState(false)
  const router = useRouter()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = url.trim()
    const dest = trimmed
      ? `/submit?url=${encodeURIComponent(trimmed)}`
      : '/submit'
    router.push(dest)
  }

  return (
    <form onSubmit={handleSubmit} className="mt-10 w-full max-w-xl">

      {/* ── Input row ──────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-2.5">

        {/* URL field */}
        <div className={cn(
          'relative flex-1 rounded-2xl transition-all duration-200',
          focused
            ? 'ring-2 ring-violet-500/40 ring-offset-0 shadow-lg shadow-violet-500/10'
            : 'shadow-sm shadow-stone-200/60',
        )}>
          <Link2
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400"
            aria-hidden
          />
          <input
            type="url"
            placeholder="https://your-app.com"
            value={url}
            onChange={e => setUrl(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            className={cn(
              'w-full rounded-2xl pl-10 pr-4 py-3.5',
              'bg-white/85 backdrop-blur-sm',
              'border border-stone-200/90',
              'text-sm text-stone-800 placeholder:text-stone-400',
              'focus:outline-none',
            )}
          />
        </div>

        {/* Gradient submit button */}
        <button
          type="submit"
          className={cn(
            'flex shrink-0 items-center justify-center gap-2',
            'rounded-2xl px-7 py-3.5',
            'bg-gradient-to-r from-violet-600 via-fuchsia-500 to-orange-500',
            'text-sm font-semibold text-white',
            'shadow-lg shadow-fuchsia-500/30',
            'transition-all duration-200',
            'hover:-translate-y-0.5 hover:shadow-xl hover:shadow-fuchsia-500/35',
            'active:scale-95',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-500/50',
          )}
        >
          Generate
          <ArrowRight className="h-4 w-4" aria-hidden />
        </button>
      </div>

      {/* ── Fine print ─────────────────────────────────────────────────── */}
      <p className="mt-3 text-center text-[11px] text-stone-400/80 sm:text-left">
        Free to browse · Creator account required to publish
      </p>

    </form>
  )
}
