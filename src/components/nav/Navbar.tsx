'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard, LogOut,
  Compass, Plus, Home, User, Flame,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/context/AuthContext'

export function Navbar() {
  const { user, logout, isLoading } = useAuth()
  const router   = useRouter()
  const pathname = usePathname()

  function handleLogout() { logout(); router.push('/') }

  const displayLabel = user?.displayName || user?.email?.split('@')[0] || ''
  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/')

  return (
    <>
      {/* ════════════════════════════════════════════════════════════════════
          DESKTOP NAV  —  floating pill at top, hidden on mobile
      ════════════════════════════════════════════════════════════════════ */}
      <header className="hidden sm:block sm:fixed sm:top-4 sm:left-1/2 sm:-translate-x-1/2 sm:z-50 sm:w-[calc(100%-48px)] sm:max-w-[860px]">
        <nav className={cn(
          'flex items-center px-4 rounded-full',
          'bg-white/80 backdrop-blur-md',
          'border border-stone-200/60',
          'shadow-[0_4px_24px_rgba(0,0,0,0.08)]',
        )}>

          {/* LEFT — Logo + nav links */}
          <div className="flex flex-1 items-center gap-1 overflow-hidden min-w-0 py-1.5">
            <Link href="/" className="flex shrink-0 items-center hover:opacity-80 transition-opacity" aria-label="Imagine — home">
              <Image src="/imagine-logo.png" alt="Imagine" width={233} height={70} className="h-[70px] w-auto object-contain object-left" priority />
            </Link>
            <Link
              href="/explore"
              data-tutorial="nav-explore"
              className={cn(
                'flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium transition-all duration-150',
                isActive('/explore')
                  ? 'bg-stone-900 text-white'
                  : 'text-stone-500 hover:text-stone-900 hover:bg-stone-100',
              )}
            >
              <Compass className="h-4 w-4 shrink-0" aria-hidden />
              Explore
            </Link>
            <Link
              href="/trending"
              data-tutorial="nav-trending"
              className={cn(
                'flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium transition-all duration-150',
                isActive('/trending')
                  ? 'bg-stone-900 text-white'
                  : 'text-stone-500 hover:text-stone-900 hover:bg-stone-100',
              )}
            >
              <Flame className="h-4 w-4 shrink-0" aria-hidden />
              Trending
            </Link>
          </div>

          {/* CENTER — Submit FAB */}
          <div className="flex shrink-0 items-center justify-center px-5 pointer-events-none">
            <Link
              href="/submit"
              aria-label="Submit an app"
              title="Submit App"
              data-tutorial="nav-submit"
              className="pointer-events-auto flex h-10 w-10 items-center justify-center rounded-full text-white active:scale-95 transition-all duration-150 shadow-[0_2px_16px_rgba(99,102,241,0.45)]"
              style={{ background: 'linear-gradient(135deg, #14b8a6, #6366f1)' }}
            >
              <Plus className="h-5 w-5" strokeWidth={2.5} aria-hidden />
            </Link>
          </div>

          {/* RIGHT — Auth */}
          <div className="relative z-30 flex flex-1 items-center justify-end gap-2 min-w-0">
            {isLoading ? (
              <div className="h-8 w-28 animate-pulse rounded-full bg-stone-100" />
            ) : user ? (
              <>
                <Link
                  href="/dashboard"
                  className={cn(
                    'flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors',
                    isActive('/dashboard') ? 'bg-stone-100 text-stone-900' : 'text-stone-500 hover:bg-stone-100 hover:text-stone-900',
                  )}
                >
                  <LayoutDashboard className="h-3.5 w-3.5" aria-hidden />
                  Dashboard
                </Link>
                <div className="flex shrink-0 items-center gap-1.5 rounded-full border border-stone-200 bg-stone-50 p-1 pl-1.5 pr-3">
                  {user.avatarUrl ? (
                    <Image src={user.avatarUrl} alt={displayLabel} width={26} height={26} className="h-[26px] w-[26px] rounded-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="flex h-[26px] w-[26px] items-center justify-center rounded-full bg-teal-100 text-[10px] font-bold text-teal-700 uppercase select-none">
                      {displayLabel[0] ?? '?'}
                    </div>
                  )}
                  <span className="max-w-[88px] truncate text-xs font-medium text-stone-700">{displayLabel}</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-stone-400 hover:bg-stone-100 hover:text-stone-600 transition-colors"
                  title="Sign out"
                >
                  <LogOut className="h-3.5 w-3.5" aria-hidden />
                </button>
              </>
            ) : (
              <>
                <Link href="/sign-in" className="shrink-0 px-4 py-1.5 text-sm font-medium text-stone-600 rounded-full hover:bg-stone-100 transition-colors">
                  Log In
                </Link>
                <Link
                  href="/sign-up"
                  data-tutorial="nav-signup"
                  className="shrink-0 px-4 py-1.5 text-sm font-semibold rounded-full text-white shadow-sm transition-all hover:shadow-md hover:scale-[1.02] active:scale-95"
                  style={{ background: 'linear-gradient(135deg, #0D9488, #6366f1)' }}
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>

        </nav>
      </header>

      {/* ════════════════════════════════════════════════════════════════════
          MOBILE BOTTOM NAV  —  5 tabs, hidden on sm+
      ════════════════════════════════════════════════════════════════════ */}
      <nav
        className="sm:hidden fixed bottom-0 inset-x-0 z-50 border-t border-stone-200/70 bg-white/90 backdrop-blur-xl"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        <div className="flex items-center h-16 px-1">

          <BottomTab href="/" label="Home" active={pathname === '/'}>
            <Home className="h-[22px] w-[22px]" />
          </BottomTab>

          <BottomTab href="/explore" label="Explore" active={isActive('/explore')} dataTutorial="nav-explore">
            <Compass className="h-[22px] w-[22px]" />
          </BottomTab>

          {/* Center FAB */}
          <div className="flex flex-1 items-center justify-center">
            <Link
              href="/submit"
              aria-label="Submit an app"
              data-tutorial="nav-submit"
              className="flex h-12 w-12 items-center justify-center rounded-full text-white active:scale-95 transition-all duration-150 shadow-[0_4px_20px_rgba(99,102,241,0.45)] -mt-5"
              style={{ background: 'linear-gradient(135deg, #14b8a6, #6366f1)' }}
            >
              <Plus className="h-[22px] w-[22px]" strokeWidth={2.5} aria-hidden />
            </Link>
          </div>

          <BottomTab href="/trending" label="Trending" active={isActive('/trending')} dataTutorial="nav-trending">
            <Flame className="h-[22px] w-[22px]" />
          </BottomTab>

          {/* Profile / Sign In */}
          {isLoading ? (
            <div className="flex flex-1 items-center justify-center">
              <div className="h-7 w-7 animate-pulse rounded-full bg-stone-100" />
            </div>
          ) : user ? (
            <Link
              href="/dashboard"
              aria-label="Dashboard"
              className={cn(
                'flex flex-1 flex-col items-center justify-center gap-0.5 py-1 transition-colors',
                isActive('/dashboard') ? 'text-teal-700' : 'text-stone-400',
              )}
            >
              <span className={cn('flex items-center justify-center rounded-xl p-0.5 transition-colors', isActive('/dashboard') && 'bg-teal-50')}>
                {user.avatarUrl ? (
                  <Image src={user.avatarUrl} alt={displayLabel} width={24} height={24} className="h-6 w-6 rounded-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-teal-100 text-[9px] font-bold text-teal-700 uppercase select-none">
                    {displayLabel[0] ?? '?'}
                  </div>
                )}
              </span>
              <span className="text-[10px] font-medium leading-none">Profile</span>
            </Link>
          ) : (
            <BottomTab href="/sign-in" label="Sign In" active={isActive('/sign-in')} dataTutorial="nav-signup">
              <User className="h-[22px] w-[22px]" />
            </BottomTab>
          )}

        </div>
      </nav>
    </>
  )
}

// ── Reusable bottom tab ───────────────────────────────────────────────────────

function BottomTab({ href, label, active, children, dataTutorial }: {
  href:          string
  label:         string
  active:        boolean
  children:      React.ReactNode
  dataTutorial?: string
}) {
  return (
    <Link
      href={href}
      data-tutorial={dataTutorial}
      className={cn(
        'flex flex-1 flex-col items-center justify-center gap-0.5 py-1 transition-colors',
        active ? 'text-teal-700' : 'text-stone-400 hover:text-stone-700',
      )}
    >
      <span className={cn('flex items-center justify-center rounded-xl p-1 transition-colors', active && 'bg-teal-50')}>
        {children}
      </span>
      <span className="text-[10px] font-medium leading-none">{label}</span>
    </Link>
  )
}
