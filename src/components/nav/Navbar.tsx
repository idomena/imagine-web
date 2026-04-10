'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { LayoutDashboard, LogOut, Menu, X, LayoutGrid, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/context/AuthContext'

// Desktop center links (unchanged)
const DESKTOP_NAV = [
  { href: '/explore',    label: 'Explore'    },
  { href: '/categories', label: 'Categories' },
  { href: '/submit',     label: 'Submit App' },
]

export function Navbar() {
  const { user, logout, isLoading } = useAuth()
  const router   = useRouter()
  const pathname = usePathname()

  const [mobileOpen, setMobileOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // Close drawer on outside click
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

  // Close drawer on route change
  useEffect(() => { setMobileOpen(false) }, [pathname])

  function handleLogout() {
    logout()
    router.push('/')
  }

  const displayLabel = user?.displayName || user?.email?.split('@')[0] || ''
  const exploreActive = pathname === '/explore' || pathname.startsWith('/explore/')

  return (
    <header className="fixed top-3 sm:top-4 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-24px)] sm:w-[calc(100%-48px)] max-w-[860px]">
      <nav className={cn(
        'flex items-center rounded-full px-2.5 sm:px-3',
        'bg-white/75 backdrop-blur-md',
        'border border-white/20',
        'shadow-[0_4px_24px_rgba(0,0,0,0.10)]',
      )}>

        {/* ── Logo ──────────────────────────────────────────────────────────── */}
        <Link
          href="/"
          className="flex shrink-0 items-center hover:opacity-80 transition-opacity py-1"
          aria-label="Imagine — home"
        >
          <Image
            src="/imagine-logo.png"
            alt="Imagine"
            width={233}
            height={70}
            // 30 % taller on mobile; capped at 150 px wide so it doesn't crowd the row
            className="h-[62px] w-auto max-w-[150px] sm:max-w-none sm:h-[70px] object-contain object-left"
            priority
          />
        </Link>

        {/* ── Mobile: Explore text link — always visible ─────────────────── */}
        <Link
          href="/explore"
          className={cn(
            'md:hidden ml-1.5 shrink-0 px-3 py-1.5 text-sm font-medium rounded-full transition-all duration-150',
            exploreActive
              ? 'bg-stone-900 text-white'
              : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100',
          )}
        >
          Explore
        </Link>

        {/* ── Spacer ────────────────────────────────────────────────────────── */}
        <div className="flex-1" />

        {/* ── Desktop center nav ────────────────────────────────────────────── */}
        <ul className="hidden md:flex items-center gap-1" role="list">
          {DESKTOP_NAV.map(({ href, label }) => {
            const active = pathname === href || pathname.startsWith(href + '/')
            return (
              <li key={href}>
                <Link
                  href={href}
                  className={cn(
                    'px-4 py-1.5 text-sm font-medium rounded-full transition-all duration-150',
                    active
                      ? 'bg-stone-900 text-white'
                      : 'text-stone-500 hover:text-stone-900 hover:bg-stone-100',
                  )}
                >
                  {label}
                </Link>
              </li>
            )
          })}
        </ul>

        {/* ── Spacer ────────────────────────────────────────────────────────── */}
        <div className="flex-1" />

        {/* ── Mobile: teal '+' Submit button ────────────────────────────────── */}
        <Link
          href="/submit"
          className={cn(
            'md:hidden mr-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
            'bg-teal-700 text-white hover:bg-teal-600 active:scale-95 transition-all',
            'shadow-[0_2px_8px_rgba(20,184,166,0.40)]',
          )}
          aria-label="Submit an app"
          title="Submit App"
        >
          <Plus className="h-[18px] w-[18px]" strokeWidth={2.5} aria-hidden />
        </Link>

        {/* ── Auth area ─────────────────────────────────────────────────────── */}
        {isLoading ? (
          <div className="h-8 w-8 sm:w-32 animate-pulse rounded-full bg-stone-100" />
        ) : user ? (
          <div className="flex items-center gap-1">

            {/* Dashboard — icon + label on desktop only */}
            <Link
              href="/dashboard"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-stone-500 rounded-full hover:bg-stone-100 hover:text-stone-900 transition-colors"
            >
              <LayoutDashboard className="h-3.5 w-3.5" aria-hidden />
              Dashboard
            </Link>

            {/* Avatar — full chip on desktop, bare circle on mobile */}
            <div className={cn(
              'flex items-center rounded-full',
              'border border-stone-200 bg-stone-50',
              'p-1 sm:pl-1.5 sm:pr-3 gap-1.5',
            )}>
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
              {/* Name hidden on mobile */}
              <span className="hidden sm:inline max-w-[90px] truncate text-xs font-medium text-stone-700">
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

          </div>
        ) : (
          <div className="flex items-center gap-1 sm:gap-1.5">
            <Link
              href="/sign-in"
              className="px-3 sm:px-4 py-1.5 text-sm font-medium text-stone-600 rounded-full hover:bg-stone-100 transition-colors"
            >
              Log In
            </Link>
            {/* Sign Up hidden on mobile — surfaced in hamburger */}
            <Link
              href="/sign-up"
              className={cn(
                'hidden sm:inline-flex px-4 py-1.5 text-sm font-semibold rounded-full',
                'bg-teal-700 text-white hover:bg-teal-600 transition-colors shadow-sm',
              )}
            >
              Sign Up
            </Link>
          </div>
        )}

        {/* ── Mobile hamburger — secondary links only ────────────────────────── */}
        <div ref={menuRef} className="relative md:hidden ml-1">
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

          {/* Dropdown */}
          {mobileOpen && (
            <div className={cn(
              'absolute right-0 top-[calc(100%+10px)] w-52',
              'rounded-2xl overflow-hidden',
              'bg-white/95 backdrop-blur-xl',
              'border border-stone-200/70',
              'shadow-[0_8px_32px_rgba(0,0,0,0.13)]',
              'py-1.5',
            )}>

              {/* Categories */}
              <Link
                href="/categories"
                className={cn(
                  'flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors',
                  pathname === '/categories' || pathname.startsWith('/categories/')
                    ? 'bg-stone-100 text-stone-900'
                    : 'text-stone-600 hover:bg-stone-50 hover:text-stone-900',
                )}
              >
                <LayoutGrid className="h-4 w-4 shrink-0" aria-hidden />
                Categories
              </Link>

              {/* Dashboard — mobile only (hidden in pill on mobile) */}
              {user && (
                <Link
                  href="/dashboard"
                  className={cn(
                    'flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors',
                    pathname === '/dashboard' || pathname.startsWith('/dashboard/')
                      ? 'bg-stone-100 text-stone-900'
                      : 'text-stone-600 hover:bg-stone-50 hover:text-stone-900',
                  )}
                >
                  <LayoutDashboard className="h-4 w-4 shrink-0" aria-hidden />
                  Dashboard
                </Link>
              )}

              {/* Sign out */}
              {user && (
                <>
                  <div className="mx-3 my-1 h-px bg-stone-100" />
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-sm font-medium text-stone-500 hover:bg-stone-50 hover:text-stone-700 transition-colors"
                  >
                    <LogOut className="h-4 w-4 shrink-0" aria-hidden />
                    Sign out
                  </button>
                </>
              )}

              {/* Sign Up — for unauthenticated users on mobile */}
              {!user && !isLoading && (
                <>
                  <div className="mx-3 my-1 h-px bg-stone-100" />
                  <Link
                    href="/sign-up"
                    className="mx-2 mb-1 flex items-center justify-center rounded-xl bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-600 transition-colors"
                  >
                    Sign Up
                  </Link>
                </>
              )}

            </div>
          )}
        </div>

      </nav>
    </header>
  )
}
