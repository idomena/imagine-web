import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import Image from 'next/image'
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
            <Navbar />
            <main className="pt-[88px]">{children}</main>
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
