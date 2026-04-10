'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { LayoutDashboard, LogOut, Menu, X, Compass, LayoutGrid, Send } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/context/AuthContext'

const NAV_LINKS = [
  { href: '/explore',    label: 'Explore',    icon: Compass     },
  { href: '/categories', label: 'Categories', icon: LayoutGrid  },
  { href: '/submit',     label: 'Submit App', icon: Send        },
]

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

  // Close when navigating
  useEffect(() => { setMobileOpen(false) }, [pathname])

  function handleLogout() {
    logout()
    router.push('/')
  }

  const displayLabel = user?.displayName || user?.email?.split('@')[0] || ''

  return (
    <>
      {/* Floating pill header */}
      <header className="fixed top-3 sm:top-4 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-24px)] sm:w-[calc(100%-48px)] max-w-[860px]">

        {/* ── Pill nav bar ───────────────────────────────────────────────── */}
        <nav className={cn(
          'flex items-center gap-2 sm:gap-3 rounded-full px-2 sm:px-3 py-1',
          'bg-white/75 backdrop-blur-md',
          'border border-white/20',
          'shadow-[0_4px_24px_rgba(0,0,0,0.10)]',
        )}>

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
              className="h-[48px] sm:h-[70px] w-auto object-contain"
              priority
            />
          </Link>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Desktop nav links */}
          <ul className="hidden md:flex items-center gap-1" role="list">
            {NAV_LINKS.map(({ href, label }) => {
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

          {/* Spacer */}
          <div className="flex-1" />

          {/* Auth area */}
          {isLoading ? (
            <div className="h-8 w-8 sm:w-32 animate-pulse rounded-full bg-stone-100" />
          ) : user ? (
            <div className="flex items-center gap-1">
              {/* Dashboard — icon only on mobile */}
              <Link
                href="/dashboard"
                className="flex items-center gap-1.5 p-2 sm:px-3 sm:py-1.5 text-sm font-medium text-stone-500 rounded-full hover:bg-stone-100 hover:text-stone-900 transition-colors"
                title="Dashboard"
              >
                <LayoutDashboard className="h-4 w-4 sm:h-3.5 sm:w-3.5" aria-hidden />
                <span className="hidden sm:inline">Dashboard</span>
              </Link>

              {/* Avatar chip — name hidden on mobile */}
              <div className="flex items-center gap-1.5 rounded-full border border-stone-200 bg-stone-50 p-1 sm:pl-1.5 sm:pr-3">
                {user.avatarUrl ? (
                  <Image
                    src={user.avatarUrl}
                    alt={displayLabel}
                    width={24}
                    height={24}
                    className="h-[24px] w-[24px] rounded-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="flex h-[24px] w-[24px] items-center justify-center rounded-full bg-teal-100 text-[10px] font-bold text-teal-700 uppercase select-none">
                    {displayLabel[0] ?? '?'}
                  </div>
                )}
                <span className="hidden sm:inline max-w-[90px] truncate text-xs font-medium text-stone-700">
                  {displayLabel}
                </span>
              </div>

              <button
                onClick={handleLogout}
                className="flex h-8 w-8 items-center justify-center rounded-full text-stone-400 hover:bg-stone-100 hover:text-stone-600 transition-colors"
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
              <Link
                href="/sign-up"
                className={cn(
                  'px-3 sm:px-4 py-1.5 text-sm font-semibold rounded-full',
                  'bg-teal-700 text-white',
                  'hover:bg-teal-600 transition-colors',
                  'shadow-sm',
                )}
              >
                Sign Up
              </Link>
            </div>
          )}

          {/* ── Hamburger — mobile only ─────────────────────────────────── */}
          <div ref={menuRef} className="relative md:hidden">
            <button
              type="button"
              onClick={() => setMobileOpen(v => !v)}
              className="flex h-8 w-8 items-center justify-center rounded-full text-stone-500 hover:bg-stone-100 hover:text-stone-800 transition-colors"
              aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileOpen}
            >
              {mobileOpen
                ? <X    className="h-4 w-4" aria-hidden />
                : <Menu className="h-4 w-4" aria-hidden />
              }
            </button>

            {/* ── Mobile dropdown ── */}
            {mobileOpen && (
              <div className={cn(
                'absolute right-0 top-[calc(100%+10px)] w-56',
                'rounded-2xl overflow-hidden',
                'bg-white/90 backdrop-blur-xl',
                'border border-stone-200/60',
                'shadow-[0_8px_32px_rgba(0,0,0,0.12)]',
                'py-1.5',
              )}>
                {NAV_LINKS.map(({ href, label, icon: Icon }) => {
                  const active = pathname === href || pathname.startsWith(href + '/')
                  const isSubmit = href === '/submit'
                  return (
                    <Link
                      key={href}
                      href={href}
                      className={cn(
                        'flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors',
                        isSubmit
                          ? 'mx-2 my-1 rounded-xl bg-teal-700 text-white hover:bg-teal-600'
                          : active
                            ? 'text-stone-900 bg-stone-100'
                            : 'text-stone-600 hover:bg-stone-50 hover:text-stone-900',
                      )}
                    >
                      <Icon className="h-4 w-4 shrink-0" aria-hidden />
                      {label}
                    </Link>
                  )
                })}
              </div>
            )}
          </div>

        </nav>
      </header>
    </>
  )
}
