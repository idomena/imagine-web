'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight, Link2 } from 'lucide-react'
import { cn } from '@/lib/utils'

// ---------------------------------------------------------------------------
// HeroInput — guest hero URL input
// Navigates to /submit?url=... to pre-fill the submit form.
// ---------------------------------------------------------------------------

export function HeroInput() {
  const [url, setUrl] = useState('')
  const router = useRouter()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = url.trim()
    router.push(trimmed ? `/submit?url=${encodeURIComponent(trimmed)}` : '/submit')
  }

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="flex flex-col sm:flex-row gap-3">

        {/* URL field */}
        <div className="relative flex-1">
          <Link2
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400"
            aria-hidden
          />
          <input
            type="url"
            placeholder="https://your-app.com"
            value={url}
            onChange={e => setUrl(e.target.value)}
            className={cn(
              'w-full rounded-xl border border-slate-200 bg-white',
              'pl-10 pr-4 py-3.5',
              'text-sm text-slate-900 placeholder:text-slate-400',
              'shadow-sm',
              'outline-none transition-all duration-150',
              'focus:border-slate-400 focus:ring-2 focus:ring-slate-900/8',
            )}
          />
        </div>

        {/* Submit button */}
        <button
          type="submit"
          className={cn(
            'inline-flex shrink-0 items-center justify-center gap-2',
            'rounded-xl bg-slate-900 px-6 py-3.5',
            'text-sm font-semibold text-white',
            'shadow-sm',
            'transition-all duration-150 hover:bg-slate-800 active:scale-95',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/40',
          )}
        >
          Get Started
          <ArrowRight className="h-4 w-4" aria-hidden />
        </button>
      </div>

      <p className="mt-3 text-xs text-slate-400 sm:text-left text-center">
        Free to browse · Creator account required to publish
      </p>
    </form>
  )
}
