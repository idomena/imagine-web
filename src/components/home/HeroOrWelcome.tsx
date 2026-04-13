'use client'

import Link from 'next/link'
import { Zap, ArrowRight } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'

// ---------------------------------------------------------------------------
// Hero section — shows "Welcome back" when user is logged in, full hero otherwise
// ---------------------------------------------------------------------------

interface Props {
  hero: React.ReactNode
}

export function HeroOrWelcome({ hero }: Props) {
  const { user, isLoading } = useAuth()

  // Still hydrating — render the full hero to avoid layout shift
  if (isLoading) return <>{hero}</>

  if (!user) return <>{hero}</>

  const displayName = user.displayName || user.email?.split('@')[0] || 'there'

  return (
    <section className="relative flex items-center justify-center px-5 sm:px-6 pt-28 sm:pt-40 pb-12 sm:pb-24 min-h-[40svh]">
      <div className="flex flex-col items-center text-center gap-4">
        <div className="inline-flex items-center gap-1.5 rounded-full border border-teal-200/70 bg-teal-50/80 px-3.5 py-1 text-xs font-semibold text-teal-700">
          <Zap className="h-3 w-3" aria-hidden />
          AI App Marketplace
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-stone-900">
          Welcome back, {displayName.split(' ')[0]}
        </h1>
        <p className="text-sm text-stone-500 max-w-xs">
          Your apps are waiting. Explore what&apos;s new or manage your submissions.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 mt-2">
          <Link
            href="/explore"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-teal-700 px-7 py-3 text-sm font-semibold text-white shadow-md hover:bg-teal-600 transition-colors"
          >
            Explore Apps
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center gap-2 rounded-full border border-stone-300/70 bg-white px-7 py-3 text-sm font-semibold text-stone-700 hover:border-stone-400 hover:bg-stone-50 transition-colors"
          >
            My Dashboard
          </Link>
        </div>
      </div>
    </section>
  )
}
