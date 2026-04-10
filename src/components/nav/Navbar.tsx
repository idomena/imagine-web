'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard, LogOut,
  LayoutGrid, Compass, Plus, Home, User,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/context/AuthContext'

interface Category { id: string; name: string; slug?: string }

export function Navbar() {
  const { user, logout, isLoading } = useAuth()
  const router   = useRouter()
  const pathname = usePathname()

  const [catOpen,    setCatOpen]    = useState(false)
  const [categories, setCategories] = useState<Category[]>([])

  // Fetch categories once
  useEffect(() => {
    fetch('/api/categories')
      .then(r => r.json())
      .then((json: { data?: Category[] }) => setCategories(json.data ?? []))
      .catch(() => {})
  }, [])

  // Close dropdowns on navigation
  useEffect(() => { setCatOpen(false) }, [pathname])

  function handleLogout() { logout(); router.push('/') }

  const displayLabel = user?.displayName || user?.email?.split('@')[0] || ''
  const isActive     = (href: string) => pathname === href || pathname.startsWith(href + '/')

  // Shared row style (used in categories tray + desktop dropdowns)
  const rowCls = (active: boolean) => cn(
    'flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors w-full',
    active ? 'bg-stone-100 text-stone-900' : 'text-stone-600 hover:bg-stone-50 hover:text-stone-900',
  )

  return (
    <>
      {/* ════════════════════════════════════════════════════════════════════
          DESKTOP NAV  —  pill at top, hidden on mobile
      ════════════════════════════════════════════════════════════════════ */}
      <header className="hidden sm:block sm:fixed sm:top-4 sm:left-1/2 sm:-translate-x-1/2 sm:z-50 sm:w-[calc(100%-48px)] sm:max-w-[860px]">
        <nav className={cn(
          'flex items-center px-4 rounded-full',
          'bg-white/75 backdrop-blur-md',
          'border border-white/20',
          'shadow-[0_4px_24px_rgba(0,0,0,0.10)]',
        )}>

          {/* LEFT — Logo + nav links */}
          <div className="flex flex-1 items-center gap-2 overflow-hidden min-w-0 py-1.5">
            <Link href="/" className="flex shrink-0 items-center hover:opacity-80 transition-opacity" aria-label="Imagine — home">
              <Image src="/imagine-logo.png" alt="Imagine" width={233} height={70} className="h-[70px] w-auto object-contain object-left" priority />
            </Link>
            <Link href="/explore" className={cn('flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 transition-all duration-150', isActive('/explore') ? 'bg-stone-900 text-white' : 'text-stone-500 hover:text-stone-900 hover:bg-stone-100')}>
              <Compass className="h-4 w-4 shrink-0" aria-hidden />
              <span className="text-sm font-medium">Explore</span>
            </Link>
            <Link href="/categories" className={cn('flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 transition-all duration-150', isActive('/categories') ? 'bg-stone-900 text-white' : 'text-stone-500 hover:text-stone-900 hover:bg-stone-100')}>
              <LayoutGrid className="h-3.5 w-3.5 shrink-0" aria-hidden />
              <span className="text-sm font-medium">Categories</span>
            </Link>
          </div>

          {/* CENTER — Submit FAB */}
          <div className="flex shrink-0 items-center justify-center px-5 pointer-events-none">
            <Link href="/submit" aria-label="Submit an app" title="Submit App" className="pointer-events-auto flex h-10 w-10 items-center justify-center rounded-full bg-teal-700 text-white hover:bg-teal-600 active:scale-95 transition-all duration-150 shadow-[0_2px_14px_rgba(20,184,166,0.40)]">
              <Plus className="h-5 w-5" strokeWidth={2.5} aria-hidden />
            </Link>
          </div>

          {/* RIGHT — Auth */}
          <div className="relative z-30 flex flex-1 items-center justify-end gap-2 min-w-0">
            {isLoading ? (
              <div className="h-8 w-28 animate-pulse rounded-full bg-stone-100" />
            ) : user ? (
              <>
                <Link href="/dashboard" className={cn('flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors', isActive('/dashboard') ? 'bg-stone-100 text-stone-900' : 'text-stone-500 hover:bg-stone-100 hover:text-stone-900')}>
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
                <button onClick={handleLogout} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-stone-400 hover:bg-stone-100 hover:text-stone-600 transition-colors" title="Sign out">
                  <LogOut className="h-3.5 w-3.5" aria-hidden />
                </button>
              </>
            ) : (
              <>
                <Link href="/sign-in" className="shrink-0 px-4 py-1.5 text-sm font-medium text-stone-600 rounded-full hover:bg-stone-100 transition-colors">Log In</Link>
                <Link href="/sign-up" className="shrink-0 px-4 py-1.5 text-sm font-semibold rounded-full bg-teal-700 text-white hover:bg-teal-600 transition-colors shadow-sm">Sign Up</Link>
              </>
            )}
          </div>

        </nav>
      </header>

      {/* ════════════════════════════════════════════════════════════════════
          MOBILE — Categories tray  (floats above the bottom nav)
      ════════════════════════════════════════════════════════════════════ */}
      {catOpen && (
        <>
          {/* Tap-outside backdrop */}
          <div
            className="sm:hidden fixed inset-0 z-40"
            onClick={() => setCatOpen(false)}
            aria-hidden
          />
          {/* Tray panel */}
          <div
            className={cn(
              'sm:hidden fixed inset-x-4 z-50',
              'rounded-2xl overflow-hidden',
              'bg-white/95 backdrop-blur-xl',
              'border border-stone-200/70',
              'shadow-[0_-8px_32px_rgba(0,0,0,0.14)]',
              'animate-fade-up',
            )}
            style={{ bottom: 'calc(4rem + env(safe-area-inset-bottom, 0px) + 8px)' }}
          >
            <Link
              href="/categories"
              onClick={() => setCatOpen(false)}
              className="flex items-center justify-between px-4 py-3 text-xs font-semibold uppercase tracking-wider text-stone-400 hover:text-stone-600 transition-colors border-b border-stone-100"
            >
              All Categories
              <LayoutGrid className="h-3.5 w-3.5" aria-hidden />
            </Link>
            <div className="max-h-60 overflow-y-auto py-1">
              {categories.length === 0 ? (
                <p className="px-4 py-3 text-xs text-stone-400">Loading…</p>
              ) : (
                categories.map(cat => (
                  <Link
                    key={cat.id}
                    href={`/explore?category=${encodeURIComponent(cat.name)}`}
                    className={rowCls(false)}
                    onClick={() => setCatOpen(false)}
                  >
                    {cat.name}
                  </Link>
                ))
              )}
            </div>
          </div>
        </>
      )}

      {/* ════════════════════════════════════════════════════════════════════
          MOBILE BOTTOM NAV  —  fixed at bottom, hidden on sm+
      ════════════════════════════════════════════════════════════════════ */}
      <nav
        className="sm:hidden fixed bottom-0 inset-x-0 z-50 border-t border-stone-200/70 bg-white/85 backdrop-blur-xl"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        <div className="flex items-center h-16 px-1">

          {/* Home */}
          <BottomTab href="/" label="Home" active={pathname === '/'}>
            <Home className="h-[22px] w-[22px]" />
          </BottomTab>

          {/* Explore */}
          <BottomTab href="/explore" label="Explore" active={isActive('/explore')}>
            <Compass className="h-[22px] w-[22px]" />
          </BottomTab>

          {/* ── CENTER FAB — Submit ── */}
          <div className="flex flex-1 items-center justify-center">
            <Link
              href="/submit"
              aria-label="Submit an app"
              className={cn(
                'flex h-12 w-12 items-center justify-center rounded-full',
                'bg-teal-700 text-white',
                'hover:bg-teal-600 active:scale-95 transition-all duration-150',
                'shadow-[0_4px_20px_rgba(20,184,166,0.50)]',
                '-mt-5',
              )}
            >
              <Plus className="h-[22px] w-[22px]" strokeWidth={2.5} aria-hidden />
            </Link>
          </div>

          {/* Browse (categories) */}
          <button
            type="button"
            onClick={() => setCatOpen(v => !v)}
            aria-label="Browse categories"
            aria-expanded={catOpen}
            className={cn(
              'flex flex-1 flex-col items-center justify-center gap-0.5 py-1 transition-colors',
              catOpen || isActive('/categories') ? 'text-teal-700' : 'text-stone-400',
            )}
          >
            <span className={cn(
              'flex items-center justify-center rounded-xl p-1 transition-colors',
              (catOpen || isActive('/categories')) && 'bg-teal-50',
            )}>
              <LayoutGrid className="h-[22px] w-[22px]" aria-hidden />
            </span>
            <span className="text-[10px] font-medium leading-none">Browse</span>
          </button>

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
              <span className={cn(
                'flex items-center justify-center rounded-xl p-0.5 transition-colors',
                isActive('/dashboard') && 'bg-teal-50',
              )}>
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
            <BottomTab href="/sign-in" label="Sign In" active={isActive('/sign-in')}>
              <User className="h-[22px] w-[22px]" />
            </BottomTab>
          )}

        </div>
      </nav>
    </>
  )
}

// ── Reusable bottom tab ───────────────────────────────────────────────────────

function BottomTab({
  href, label, active, children,
}: {
  href:     string
  label:    string
  active:   boolean
  children: React.ReactNode
}) {
  return (
    <Link
      href={href}
      className={cn(
        'flex flex-1 flex-col items-center justify-center gap-0.5 py-1 transition-colors',
        active ? 'text-teal-700' : 'text-stone-400 hover:text-stone-700',
      )}
    >
      <span className={cn(
        'flex items-center justify-center rounded-xl p-1 transition-colors',
        active && 'bg-teal-50',
      )}>
        {children}
      </span>
      <span className="text-[10px] font-medium leading-none">{label}</span>
    </Link>
  )
}
