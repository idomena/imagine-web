'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { LayoutDashboard, LogOut } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/context/AuthContext'

const NAV_LINKS = [
  { href: '/explore',    label: 'Explore'    },
  { href: '/categories', label: 'Categories' },
]

export function Navbar() {
  const { user, logout, isLoading } = useAuth()
  const router   = useRouter()
  const pathname = usePathname()

  function handleLogout() {
    logout()
    router.push('/')
  }

  const displayLabel = user?.displayName || user?.email?.split('@')[0] || ''

  return (
    <>
      {/* Floating pill header */}
      <header className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-48px)] max-w-[860px]">
        <nav className={cn(
          'flex items-center gap-3 rounded-full px-3 py-1',
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
              className="h-[70px] w-auto object-contain"
              priority
            />
          </Link>

          {/* Spacer — pushes nav links to center */}
          <div className="flex-1" />

          {/* Center nav links */}
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
            <li>
              <Link
                href="/submit"
                className="px-4 py-1.5 text-sm font-medium rounded-full text-stone-500 hover:text-stone-900 hover:bg-stone-100 transition-all duration-150"
              >
                Submit App
              </Link>
            </li>
          </ul>

          {/* Spacer — pushes auth to right */}
          <div className="flex-1" />

          {/* Auth */}
          {isLoading ? (
            <div className="h-8 w-32 animate-pulse rounded-full bg-stone-100" />
          ) : user ? (
            <div className="flex items-center gap-1.5">
              <Link
                href="/dashboard"
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-stone-500 rounded-full hover:bg-stone-100 hover:text-stone-900 transition-colors"
              >
                <LayoutDashboard className="h-3.5 w-3.5" aria-hidden />
                Dashboard
              </Link>

              <div className="flex items-center gap-1.5 rounded-full border border-stone-200 bg-stone-50 pl-1.5 pr-3 py-1">
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
                <span className="max-w-[90px] truncate text-xs font-medium text-stone-700">
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
            <div className="flex items-center gap-1.5">
              <Link
                href="/sign-in"
                className="px-4 py-1.5 text-sm font-medium text-stone-600 rounded-full hover:bg-stone-100 transition-colors"
              >
                Log In
              </Link>
              <Link
                href="/sign-up"
                className={cn(
                  'px-4 py-1.5 text-sm font-semibold rounded-full',
                  'bg-teal-700 text-white',
                  'hover:bg-teal-600 transition-colors',
                  'shadow-sm',
                )}
              >
                Sign Up
              </Link>
            </div>
          )}

        </nav>
      </header>

    </>
  )
}
