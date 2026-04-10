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

  // Close on outside click OR outside touch
  useEffect(() => {
    if (!mobileOpen) return
    const close = (e: MouseEvent | TouchEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMobileOpen(false)
      }
    }
    document.addEventListener('mousedown', close)
    document.addEventListener('touchstart', close as EventListener)
    return () => {
      document.removeEventListener('mousedown', close)
      document.removeEventListener('touchstart', close as EventListener)
    }
  }, [mobileOpen])

  // Close on route change
  useEffect(() => { setMobileOpen(false) }, [pathname])

  function handleLogout() {
    logout()
    router.push('/')
  }

  const displayLabel = user?.displayName || user?.email?.split('@')[0] || ''
  const isActive     = (href: string) => pathname === href || pathname.startsWith(href + '/')

  return (
    <header className="fixed top-3 sm:top-4 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-24px)] sm:w-[calc(100%-48px)] max-w-[860px]">
      <nav className={cn(
        // 3-column: [flex-1 left] [shrink-0 center] [flex-1 right]
        'flex items-center px-3 sm:px-4 rounded-full',
        'bg-white/75 backdrop-blur-md',
        'border border-white/20',
        'shadow-[0_4px_24px_rgba(0,0,0,0.10)]',
      )}>

        {/* ── LEFT  ──────────────────────────────────────────────────────────
            overflow-hidden guards the flex-1 allocation so the logo + icon
            can never push the center button off-centre.                      */}
        <div className="flex flex-1 items-center gap-2 overflow-hidden min-w-0 py-1.5">

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
              className="h-[56px] w-auto max-w-[100px] sm:max-w-none sm:h-[70px] object-contain object-left"
              priority
            />
          </Link>

          {/* Explore — icon only on mobile, icon + label on desktop */}
          <Link
            href="/explore"
            title="Explore"
            className={cn(
              'flex shrink-0 items-center gap-1.5 rounded-full transition-all duration-150',
              'p-2 sm:px-3.5 sm:py-1.5',
              isActive('/explore')
                ? 'bg-stone-900 text-white'
                : 'text-stone-500 hover:text-stone-900 hover:bg-stone-100',
            )}
          >
            <Compass className="h-4 w-4 shrink-0" aria-hidden />
            <span className="hidden sm:inline text-sm font-medium">Explore</span>
          </Link>

          {/* Categories — desktop only; mobile: inside hamburger dropdown */}
          <Link
            href="/categories"
            className={cn(
              'hidden sm:flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 transition-all duration-150',
              isActive('/categories')
                ? 'bg-stone-900 text-white'
                : 'text-stone-500 hover:text-stone-900 hover:bg-stone-100',
            )}
          >
            <LayoutGrid className="h-3.5 w-3.5 shrink-0" aria-hidden />
            <span className="text-sm font-medium">Categories</span>
          </Link>

        </div>

        {/* ── CENTER  ────────────────────────────────────────────────────────
            pointer-events-none on the WRAPPER makes the padding area
            click-through so it can never block the right column.
            pointer-events-auto on the LINK restores clickability for the
            button itself.                                                     */}
        <div className="flex shrink-0 items-center justify-center px-3 sm:px-5 pointer-events-none">
          <Link
            href="/submit"
            aria-label="Submit an app"
            title="Submit App"
            className={cn(
              'pointer-events-auto',
              'flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full',
              'bg-teal-700 text-white',
              'hover:bg-teal-600 active:scale-95 transition-all duration-150',
              'shadow-[0_2px_14px_rgba(20,184,166,0.40)]',
            )}
          >
            <Plus className="h-[18px] w-[18px] sm:h-5 sm:w-5" strokeWidth={2.5} aria-hidden />
          </Link>
        </div>

        {/* ── RIGHT  ─────────────────────────────────────────────────────────
            z-30 + pointer-events-auto: sits above the center column in the
            stacking order and explicitly receives all pointer events.
            NO overflow-hidden: that would clip the dropdown and swallow
            click / touch events on the avatar and hamburger button.
            pr-2: keeps icons off the very edge of the pill on mobile.        */}
        <div className="relative z-30 flex flex-1 items-center justify-end gap-2 min-w-0 pointer-events-auto pr-2 sm:pr-0">

          {isLoading ? (
            <div className="h-8 w-8 sm:w-28 animate-pulse rounded-full bg-stone-100" />

          ) : user ? (
            <>
              {/* Dashboard — desktop only (mobile: inside hamburger) */}
              <Link
                href="/dashboard"
                className={cn(
                  'hidden sm:flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors',
                  isActive('/dashboard')
                    ? 'bg-stone-100 text-stone-900'
                    : 'text-stone-500 hover:bg-stone-100 hover:text-stone-900',
                )}
              >
                <LayoutDashboard className="h-3.5 w-3.5" aria-hidden />
                Dashboard
              </Link>

              {/* Avatar chip — bare circle on mobile, name visible on desktop */}
              <div className="flex shrink-0 items-center gap-1.5 rounded-full border border-stone-200 bg-stone-50 p-1 sm:pl-1.5 sm:pr-3">
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

              {/* Logout — desktop only */}
              <button
                onClick={handleLogout}
                className="hidden sm:flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-stone-400 hover:bg-stone-100 hover:text-stone-600 transition-colors"
                title="Sign out"
              >
                <LogOut className="h-3.5 w-3.5" aria-hidden />
              </button>

              {/* ── Mobile hamburger (logged-in) ─────────────────────────── */}
              <div ref={menuRef} className="relative shrink-0 sm:hidden">
                <button
                  type="button"
                  onClick={() => setMobileOpen(!mobileOpen)}
                  aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
                  aria-expanded={mobileOpen}
                  className="flex h-8 w-8 items-center justify-center rounded-full text-stone-500 hover:bg-stone-100 hover:text-stone-800 transition-colors"
                >
                  {mobileOpen
                    ? <X    className="h-[17px] w-[17px]" aria-hidden />
                    : <Menu className="h-[17px] w-[17px]" aria-hidden />
                  }
                </button>

                {mobileOpen && (
                  <div className={cn(
                    'absolute right-0 top-[calc(100%+10px)] w-52 z-50',
                    'rounded-2xl overflow-hidden',
                    'bg-white/95 backdrop-blur-xl',
                    'border border-stone-200/70',
                    'shadow-[0_8px_32px_rgba(0,0,0,0.14)]',
                    'py-1.5',
                  )}>
                    <Link
                      href="/categories"
                      className={cn(
                        'flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors',
                        isActive('/categories')
                          ? 'bg-stone-100 text-stone-900'
                          : 'text-stone-600 hover:bg-stone-50 hover:text-stone-900',
                      )}
                    >
                      <LayoutGrid    className="h-4 w-4 shrink-0" aria-hidden />
                      Categories
                    </Link>
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
                className="shrink-0 px-3 sm:px-4 py-1.5 text-sm font-medium text-stone-600 rounded-full hover:bg-stone-100 transition-colors"
              >
                Log In
              </Link>
              <Link
                href="/sign-up"
                className={cn(
                  'hidden sm:inline-flex shrink-0 px-4 py-1.5 text-sm font-semibold rounded-full',
                  'bg-teal-700 text-white hover:bg-teal-600 transition-colors shadow-sm',
                )}
              >
                Sign Up
              </Link>

              {/* ── Mobile hamburger (guest) ─────────────────────────────── */}
              <div ref={menuRef} className="relative shrink-0 sm:hidden">
                <button
                  type="button"
                  onClick={() => setMobileOpen(!mobileOpen)}
                  aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
                  aria-expanded={mobileOpen}
                  className="flex h-8 w-8 items-center justify-center rounded-full text-stone-500 hover:bg-stone-100 hover:text-stone-800 transition-colors"
                >
                  {mobileOpen
                    ? <X    className="h-[17px] w-[17px]" aria-hidden />
                    : <Menu className="h-[17px] w-[17px]" aria-hidden />
                  }
                </button>

                {mobileOpen && (
                  <div className={cn(
                    'absolute right-0 top-[calc(100%+10px)] w-52 z-50',
                    'rounded-2xl overflow-hidden',
                    'bg-white/95 backdrop-blur-xl',
                    'border border-stone-200/70',
                    'shadow-[0_8px_32px_rgba(0,0,0,0.14)]',
                    'py-1.5',
                  )}>
                    <Link
                      href="/categories"
                      className={cn(
                        'flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors',
                        isActive('/categories')
                          ? 'bg-stone-100 text-stone-900'
                          : 'text-stone-600 hover:bg-stone-50 hover:text-stone-900',
                      )}
                    >
                      <LayoutGrid className="h-4 w-4 shrink-0" aria-hidden />
                      Categories
                    </Link>
                    <div className="mx-3 my-1 h-px bg-stone-100" />
                    <Link
                      href="/sign-up"
                      className="mx-2 mb-1 flex items-center justify-center rounded-xl bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-600 transition-colors"
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
