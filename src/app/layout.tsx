import type { Metadata, Viewport } from 'next'
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

const SITE_URL  = 'https://imagine-marketplace.vercel.app'
const SITE_NAME = 'Imagine Marketplace'
const TITLE     = 'Imagine — AI App Marketplace'
const DESC      = "The world's first AI-powered app marketplace. Discover, launch, and manage apps instantly."

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title:        TITLE,
  description:  DESC,
  applicationName: SITE_NAME,
  keywords: ['AI apps', 'app marketplace', 'artificial intelligence', 'launch apps', 'discover apps'],
  openGraph: {
    type:        'website',
    url:         SITE_URL,
    siteName:    SITE_NAME,
    title:       TITLE,
    description: DESC,
    locale:      'en_US',
  },
  twitter: {
    card:        'summary_large_image',
    title:       TITLE,
    description: DESC,
  },
  icons: {
    icon:  [
      { url: '/favicon-32.png', sizes: '32x32',  type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  manifest: '/manifest.webmanifest',
}

// viewport-fit=cover enables env(safe-area-inset-*) on iOS Safari
export const viewport: Viewport = {
  width:        'device-width',
  initialScale: 1,
  viewportFit:  'cover',
  themeColor:   '#0e8f82',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body>
        <SessionProvider>
          <AuthProvider>

            {/*
              ── Mobile logo header ─────────────────────────────────────────
              Hidden on sm+. Fixed at top, respects iOS safe area by using
              paddingTop: env(safe-area-inset-top) so the logo never overlaps
              the status bar / Dynamic Island notch.
            */}
            <div
              className="sm:hidden fixed top-0 inset-x-0 z-40 bg-white/50 backdrop-blur-md border-b border-black/[0.05]"
              style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
            >
              <div className="flex items-center justify-center h-[52px]">
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
            </div>

            <Navbar />

            {/*
              paddingTop reads from --header-pt CSS variable (globals.css):
                mobile  → calc(52px + env(safe-area-inset-top))
                desktop → 88px
              pb-28 on mobile clears the 64px bottom nav + iOS home bar.
              sm:pb-0 resets it on desktop.
            */}
            <main
              className="pb-28 sm:pb-0"
              style={{ paddingTop: 'var(--header-pt)' }}
            >
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
