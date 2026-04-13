'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'

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
      <div className="flex flex-col sm:flex-row gap-2.5">

        {/* URL input */}
        <input
          type="url"
          placeholder="Paste your link here..."
          value={url}
          onChange={e => setUrl(e.target.value)}
          className={cn(
            'flex-1 rounded-xl border border-slate-200 bg-white',
            'px-5 py-4 text-sm text-slate-900 placeholder:text-slate-400',
            'shadow-sm outline-none transition-all duration-150',
            'focus:border-teal-400 focus:ring-2 focus:ring-teal-500/20',
          )}
        />

        {/* Gradient CTA button */}
        <button
          type="submit"
          className={cn(
            'inline-flex shrink-0 items-center justify-center gap-2',
            'rounded-xl px-7 py-4',
            'bg-gradient-to-r from-teal-500 to-indigo-500',
            'text-sm font-semibold text-white',
            'shadow-md shadow-teal-500/25',
            'transition-all duration-150',
            'hover:shadow-lg hover:shadow-teal-500/30 hover:-translate-y-px',
            'active:scale-95',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/50',
          )}
        >
          Launch <span className="text-base">✨</span>
        </button>
      </div>
    </form>
  )
}
