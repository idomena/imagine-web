import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import Image from 'next/image'
import Link from 'next/link'
import { Navbar } from '@/components/nav/Navbar'
import { AuthProvider } from '@/context/AuthContext'
import { SessionProvider } from '@/components/providers/SessionProvider'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata: Metadata = {
  title:       'AppMarket — AI-Powered App Store',
  description: 'Discover, launch, and manage AI-powered applications in one place.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body>
        <SessionProvider>
          <AuthProvider>

            {/* ── Mobile-only logo header — fixed at top, hidden on desktop ── */}
            <div className="sm:hidden fixed top-0 inset-x-0 z-40 flex items-center justify-center bg-[#FDFDF9]/92 backdrop-blur-sm border-b border-stone-100/60" style={{ height: '52px' }}>
              <Link href="/" aria-label="Imagine — home">
                <Image
                  src="/imagine-logo.png"
                  alt="Imagine"
                  width={233}
                  height={70}
                  className="h-9 w-auto object-contain"
                  priority
                />
              </Link>
            </div>

            <Navbar />

            {/*
              Mobile:  pt-[52px] clears the logo header above.
                       pb-28 (112px) clears the bottom nav (64px) + safe area (~34px) + breathing room.
              Desktop: pt-[88px] clears the top pill navbar.
                       pb-0 — no bottom nav.
            */}
            <main className="pt-[52px] sm:pt-[88px] pb-28 sm:pb-0">
              {children}
            </main>

            <footer className="border-t border-stone-200 bg-[#FDFDF9] py-10">
              <div className="mx-auto flex max-w-5xl flex-col items-center gap-3 px-4">
                <Image
                  src="/imagine-logo.png"
                  alt="Imagine"
                  width={240}
                  height={72}
                  className="h-16 w-auto object-contain opacity-90"
                />
                <p className="text-xs text-stone-400">© 2026 Imagine Marketplace</p>
              </div>
            </footer>

          </AuthProvider>
        </SessionProvider>
      </body>
    </html>
  )
}
