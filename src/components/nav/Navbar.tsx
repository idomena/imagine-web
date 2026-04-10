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

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080'

interface Category { id: string; name: string; slug?: string }

export function Navbar() {
  const { user, logout, isLoading } = useAuth()
  const router   = useRouter()
  const pathname = usePathname()

  const [mobileOpen,  setMobileOpen]  = useState(false)
  const [catOpen,     setCatOpen]     = useState(false)
  const [categories,  setCategories]  = useState<Category[]>([])

  const menuRef = useRef<HTMLDivElement>(null)
  const catRef  = useRef<HTMLDivElement>(null)

  // Fetch categories once for the dropdown
  useEffect(() => {
    fetch(`${API_BASE}/api/v1/categories`)
      .then(r => r.json())
      .then((json: { data?: Category[] }) => setCategories(json.data ?? []))
      .catch(() => {})
  }, [])

  // Close hamburger or category dropdown on outside click/touch
  useEffect(() => {
    if (!mobileOpen && !catOpen) return
    const close = (e: MouseEvent | TouchEvent) => {
      if (mobileOpen && menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMobileOpen(false)
      }
      if (catOpen && catRef.current && !catRef.current.contains(e.target as Node)) {
        setCatOpen(false)
      }
    }
    document.addEventListener('mousedown', close)
    document.addEventListener('touchstart', close as EventListener)
    return () => {
      document.removeEventListener('mousedown', close)
      document.removeEventListener('touchstart', close as EventListener)
    }
  }, [mobileOpen, catOpen])

  // Close both on route change
  useEffect(() => { setMobileOpen(false); setCatOpen(false) }, [pathname])

  function handleLogout() { logout(); router.push('/') }

  const displayLabel = user?.displayName || user?.email?.split('@')[0] || ''
  const isActive     = (href: string) => pathname === href || pathname.startsWith(href + '/')

  /* ─────────────────────────────────────────────────────────────────────────
     Shared dropdown classes
  ───────────────────────────────────────────────────────────────────────── */
  const dropdownCls = cn(
    'absolute right-0 top-[calc(100%+10px)] w-52 z-50',
    'rounded-2xl overflow-hidden',
    'bg-white/95 backdrop-blur-xl',
    'border border-stone-200/70',
    'shadow-[0_8px_32px_rgba(0,0,0,0.14)]',
    'py-1.5',
  )

  const dropRowCls = (active: boolean) => cn(
    'flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors w-full',
    active ? 'bg-stone-100 text-stone-900' : 'text-stone-600 hover:bg-stone-50 hover:text-stone-900',
  )

  return (
    <header className="fixed top-3 sm:top-4 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-24px)] sm:w-[calc(100%-48px)] max-w-[860px]">
      <nav className={cn(
        'flex items-center px-3 sm:px-4 rounded-full',
        'bg-white/75 backdrop-blur-md',
        'border border-white/20',
        'shadow-[0_4px_24px_rgba(0,0,0,0.10)]',
      )}>

        {/* ══ LEFT — [Logo] [Explore] ════════════════════════════════════════
            overflow-hidden caps this column at its flex-1 size so the logo
            can never push the center '+' off-centre.                        */}
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
              // 90 px wide cap on mobile keeps left column within its ~134 px
              // flex-1 budget (90 + 8 gap + 32 explore icon = 130 px ✓).
              // Desktop: no width cap, full 70 px height.
              className="h-[56px] w-auto max-w-[90px] sm:max-w-none sm:h-[70px] object-contain object-left"
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

          {/* Categories — desktop only in the left column */}
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

        {/* ══ CENTER — '+' Submit ════════════════════════════════════════════
            pointer-events-none on the wrapper so its px-3 padding area is
            fully click-through and cannot block the adjacent columns.       */}
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

        {/* ══ RIGHT — [Categories icon] [Avatar] [Hamburger] ════════════════
            Mobile layout: Categories icon | Avatar chip | ≡ hamburger
            z-30 + pointer-events-auto ensures this column is always above
            the center wrapper and fully interactive.
            NO overflow-hidden — that clips the dropdowns.
            pr-2: breathing room from the pill edge on mobile.              */}
        <div className="relative z-30 flex flex-1 items-center justify-end gap-2 min-w-0 pointer-events-auto pr-2 sm:pr-0">

          {/* ── Categories icon (mobile only) — tapping opens category picker */}
          <div ref={catRef} className="relative shrink-0 sm:hidden">
            <button
              type="button"
              onClick={() => { setCatOpen(!catOpen); setMobileOpen(false) }}
              aria-label="Browse categories"
              aria-expanded={catOpen}
              className={cn(
                'flex h-8 w-8 items-center justify-center rounded-full transition-colors',
                catOpen || isActive('/categories')
                  ? 'bg-stone-900 text-white'
                  : 'text-stone-500 hover:bg-stone-100 hover:text-stone-800',
              )}
            >
              <LayoutGrid className="h-[17px] w-[17px]" aria-hidden />
            </button>

            {catOpen && (
              <div className={dropdownCls}>
                {/* Header row linking to full /categories page */}
                <Link
                  href="/categories"
                  className="flex items-center justify-between px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-stone-400 hover:text-stone-600 transition-colors"
                >
                  All Categories
                  <LayoutGrid className="h-3.5 w-3.5" aria-hidden />
                </Link>
                <div className="mx-3 mb-1 h-px bg-stone-100" />

                {categories.length === 0 ? (
                  <p className="px-4 py-3 text-xs text-stone-400">Loading…</p>
                ) : (
                  <div className="max-h-64 overflow-y-auto">
                    {categories.map(cat => (
                      <Link
                        key={cat.id}
                        href={`/categories/${cat.slug ?? cat.id}`}
                        className={dropRowCls(isActive(`/categories/${cat.slug ?? cat.id}`))}
                      >
                        {cat.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── Auth ──────────────────────────────────────────────────────── */}
          {isLoading ? (
            <div className="h-8 w-8 sm:w-28 animate-pulse rounded-full bg-stone-100" />

          ) : user ? (
            <>
              {/* Dashboard — desktop only */}
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

              {/* Avatar chip — bare circle on mobile, name on desktop */}
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

              {/* ── Mobile hamburger (logged-in): Dashboard + Sign out ─────── */}
              <div ref={menuRef} className="relative shrink-0 sm:hidden">
                <button
                  type="button"
                  onClick={() => { setMobileOpen(!mobileOpen); setCatOpen(false) }}
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
                  <div className={dropdownCls}>
                    <Link href="/dashboard" className={dropRowCls(isActive('/dashboard'))}>
                      <LayoutDashboard className="h-4 w-4 shrink-0" aria-hidden />
                      Dashboard
                    </Link>
                    <div className="mx-3 my-1 h-px bg-stone-100" />
                    <button type="button" onClick={handleLogout} className={dropRowCls(false)}>
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

              {/* ── Mobile hamburger (guest): Sign Up ─────────────────────── */}
              <div ref={menuRef} className="relative shrink-0 sm:hidden">
                <button
                  type="button"
                  onClick={() => { setMobileOpen(!mobileOpen); setCatOpen(false) }}
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
                  <div className={dropdownCls}>
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
