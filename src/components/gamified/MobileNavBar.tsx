'use client'

import { motion } from 'framer-motion'
import { Home, Compass, TrendingUp, PlusCircle, User } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/', icon: Home, label: 'Home' },
  { href: '/explore', icon: Compass, label: 'Explore' },
  { href: '/trending', icon: TrendingUp, label: 'Trending' },
  { href: '/submit', icon: PlusCircle, label: 'Submit' },
  { href: '/dashboard', icon: User, label: 'Profile' },
]

export function MobileNavBar() {
  const pathname = usePathname()

  return (
    <motion.nav
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="fixed bottom-0 inset-x-0 z-50 sm:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <div className="mx-2 mb-2 rounded-3xl border-2 border-stone-200/60 bg-white/95 px-2 py-2 shadow-2xl shadow-stone-300/40 backdrop-blur-lg">
        <div className="flex items-center justify-around">
          {navItems.map((item) => {
            const isActive = pathname === item.href || 
              (item.href !== '/' && pathname.startsWith(item.href))
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className="relative flex flex-col items-center"
              >
                <motion.div
                  whileTap={{ scale: 0.9 }}
                  className={cn(
                    'flex h-12 w-12 items-center justify-center rounded-2xl transition-colors',
                    isActive 
                      ? 'bg-emerald-100 text-emerald-600' 
                      : 'text-stone-400 hover:bg-stone-100 hover:text-stone-600'
                  )}
                >
                  <item.icon className="h-6 w-6" />
                  
                  {/* Active indicator dot */}
                  {isActive && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute -bottom-0.5 h-1.5 w-1.5 rounded-full bg-emerald-500"
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    />
                  )}
                </motion.div>
                <span className={cn(
                  'mt-0.5 text-[10px] font-semibold',
                  isActive ? 'text-emerald-600' : 'text-stone-400'
                )}>
                  {item.label}
                </span>
              </Link>
            )
          })}
        </div>
      </div>
    </motion.nav>
  )
}
