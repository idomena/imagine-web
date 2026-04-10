'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard, LogOut, Menu, X,
  LayoutGrid, Compass, Plus,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/context/AuthContext'

export function Navbar() {
  const { user, logout, isLoading } = useAuth()
  const router   = useRouter()
  const pathname = usePathname()

  const [mobileOpen, setMobileOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // Close on outside click
  useEffect(() => {
    if (!mobileOpen) return
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMobileOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [mobileOpen])

  // Close on navigation
  useEffect(() => { setMobileOpen(false) }, [pathname])

  function handleLogout() {
    logout()
    router.push('/')
  }

  const displayLabel = user?.displayName || user?.email?.split('@')[0] || ''
  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/')

  return (
    <header className="fixed top-3 sm:top-4 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-24px)] sm:w-[calc(100%-48px)] max-w-[860px]">
      <nav className={cn(
        // 3-column flex: [flex-1 left] [shrink-0 center] [flex-1 right]
        'flex items-center px-2.5 sm:px-3',
        'rounded-full bg-white/75 backdrop-blur-md',
        'border border-white/20',
        'shadow-[0_4px_24px_rgba(0,0,0,0.10)]',
      )}>

        {/* ══ LEFT COLUMN — flex-1 ════════════════════════════════════════════ */}
        <div className="flex flex-1 items-center gap-0.5 sm:gap-1 min-w-0 py-1">

          {/* Logo */}
          <Link
            href="/"
            className="flex shrink-0 items-center hover:opacity-80 transition-opacity"
            aria-label="Imagine — home"
          >
            <Image
              src="/imagine-logo.png"
              alt="Imagine"
              width={233}
              height={70}
              // 30 % taller than original 48px; capped at 120px wide on mobile
              // so the '+' center button always has clear breathing room
              className="h-[62px] w-auto max-w-[120px] sm:max-w-none sm:h-[70px] object-contain object-left"
              priority
            />
          </Link>

          {/* Explore — text on desktop, icon on mobile */}
          <Link
            href="/explore"
            className={cn(
              'flex shrink-0 items-center gap-1.5 rounded-full transition-all duration-150',
              // Mobile: icon only (compact square)
              'p-2 md:px-3.5 md:py-1.5',
              isActive('/explore')
                ? 'bg-stone-900 text-white'
                : 'text-stone-500 hover:text-stone-900 hover:bg-stone-100',
            )}
            title="Explore"
          >
            <Compass className="h-[15px] w-[15px] md:h-3.5 md:w-3.5 shrink-0" aria-hidden />
            <span className="hidden md:inline text-sm font-medium">Explore</span>
          </Link>

          {/* Categories — text on desktop, icon on mobile */}
          <Link
            href="/categories"
            className={cn(
              'flex shrink-0 items-center gap-1.5 rounded-full transition-all duration-150',
              'p-2 md:px-3.5 md:py-1.5',
              isActive('/categories')
                ? 'bg-stone-900 text-white'
                : 'text-stone-500 hover:text-stone-900 hover:bg-stone-100',
            )}
            title="Categories"
          >
            <LayoutGrid className="h-[15px] w-[15px] md:h-3.5 md:w-3.5 shrink-0" aria-hidden />
            <span className="hidden md:inline text-sm font-medium">Categories</span>
          </Link>

        </div>

        {/* ══ CENTER COLUMN — shrink-0, always centered via flex-1 siblings ═══ */}
        <div className="flex shrink-0 items-center justify-center px-3 sm:px-4">
          <Link
            href="/submit"
            className={cn(
              'flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full shrink-0',
              'bg-teal-700 text-white',
              'hover:bg-teal-600 active:scale-95 transition-all duration-150',
              'shadow-[0_2px_14px_rgba(20,184,166,0.42)]',
            )}
            aria-label="Submit an app"
            title="Submit App"
          >
            <Plus className="h-[18px] w-[18px] sm:h-5 sm:w-5" strokeWidth={2.5} aria-hidden />
          </Link>
        </div>

        {/* ══ RIGHT COLUMN — flex-1, content pushed to end ════════════════════ */}
        <div className="flex flex-1 items-center justify-end gap-1">

          {isLoading ? (
            <div className="h-8 w-8 sm:w-28 animate-pulse rounded-full bg-stone-100" />

          ) : user ? (
            <>
              {/* Dashboard — full label on desktop, hidden on mobile (in hamburger) */}
              <Link
                href="/dashboard"
                className={cn(
                  'hidden sm:flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors',
                  isActive('/dashboard')
                    ? 'bg-stone-100 text-stone-900'
                    : 'text-stone-500 hover:bg-stone-100 hover:text-stone-900',
                )}
              >
                <LayoutDashboard className="h-3.5 w-3.5" aria-hidden />
                Dashboard
              </Link>

              {/* Avatar — chip with name on desktop, bare circle on mobile */}
              <div className="flex items-center gap-1.5 rounded-full border border-stone-200 bg-stone-50 p-1 sm:pl-1.5 sm:pr-3">
                {user.avatarUrl ? (
                  <Image
                    src={user.avatarUrl}
                    alt={displayLabel}
                    width={26}
                    height={26}
                    className="h-[26px] w-[26px] rounded-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="flex h-[26px] w-[26px] items-center justify-center rounded-full bg-teal-100 text-[10px] font-bold text-teal-700 uppercase select-none">
                    {displayLabel[0] ?? '?'}
                  </div>
                )}
                <span className="hidden sm:inline max-w-[88px] truncate text-xs font-medium text-stone-700">
                  {displayLabel}
                </span>
              </div>

              {/* Logout — desktop only; mobile uses hamburger */}
              <button
                onClick={handleLogout}
                className="hidden sm:flex h-8 w-8 items-center justify-center rounded-full text-stone-400 hover:bg-stone-100 hover:text-stone-600 transition-colors"
                title="Sign out"
              >
                <LogOut className="h-3.5 w-3.5" aria-hidden />
              </button>

              {/* Mobile hamburger — Dashboard + Sign out */}
              <div ref={menuRef} className="relative sm:hidden">
                <button
                  type="button"
                  onClick={() => setMobileOpen(v => !v)}
                  className="flex h-8 w-8 items-center justify-center rounded-full text-stone-500 hover:bg-stone-100 hover:text-stone-800 transition-colors"
                  aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
                  aria-expanded={mobileOpen}
                >
                  {mobileOpen
                    ? <X    className="h-[17px] w-[17px]" aria-hidden />
                    : <Menu className="h-[17px] w-[17px]" aria-hidden />
                  }
                </button>

                {mobileOpen && (
                  <div className={cn(
                    'absolute right-0 top-[calc(100%+10px)] w-52',
                    'rounded-2xl overflow-hidden',
                    'bg-white/95 backdrop-blur-xl',
                    'border border-stone-200/70',
                    'shadow-[0_8px_32px_rgba(0,0,0,0.13)]',
                    'py-1.5',
                  )}>
                    <Link
                      href="/dashboard"
                      className={cn(
                        'flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors',
                        isActive('/dashboard')
                          ? 'bg-stone-100 text-stone-900'
                          : 'text-stone-600 hover:bg-stone-50 hover:text-stone-900',
                      )}
                    >
                      <LayoutDashboard className="h-4 w-4 shrink-0" aria-hidden />
                      Dashboard
                    </Link>
                    <div className="mx-3 my-1 h-px bg-stone-100" />
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="flex w-full items-center gap-3 px-4 py-2.5 text-sm font-medium text-stone-500 hover:bg-stone-50 hover:text-stone-700 transition-colors"
                    >
                      <LogOut className="h-4 w-4 shrink-0" aria-hidden />
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            </>

          ) : (
            <>
              <Link
                href="/sign-in"
                className="px-3 sm:px-4 py-1.5 text-sm font-medium text-stone-600 rounded-full hover:bg-stone-100 transition-colors"
              >
                Log In
              </Link>
              <Link
                href="/sign-up"
                className={cn(
                  'hidden sm:inline-flex px-4 py-1.5 text-sm font-semibold rounded-full',
                  'bg-teal-700 text-white hover:bg-teal-600 transition-colors shadow-sm',
                )}
              >
                Sign Up
              </Link>

              {/* Mobile hamburger — Sign Up for guests */}
              <div ref={menuRef} className="relative sm:hidden">
                <button
                  type="button"
                  onClick={() => setMobileOpen(v => !v)}
                  className="flex h-8 w-8 items-center justify-center rounded-full text-stone-500 hover:bg-stone-100 hover:text-stone-800 transition-colors"
                  aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
                  aria-expanded={mobileOpen}
                >
                  {mobileOpen
                    ? <X    className="h-[17px] w-[17px]" aria-hidden />
                    : <Menu className="h-[17px] w-[17px]" aria-hidden />
                  }
                </button>

                {mobileOpen && (
                  <div className={cn(
                    'absolute right-0 top-[calc(100%+10px)] w-52',
                    'rounded-2xl overflow-hidden',
                    'bg-white/95 backdrop-blur-xl',
                    'border border-stone-200/70',
                    'shadow-[0_8px_32px_rgba(0,0,0,0.13)]',
                    'py-1.5',
                  )}>
                    <Link
                      href="/sign-up"
                      className="mx-2 my-1 flex items-center justify-center rounded-xl bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-600 transition-colors"
                    >
                      Sign Up
                    </Link>
                  </div>
                )}
              </div>
            </>
          )}

        </div>

      </nav>
    </header>
  )
}
