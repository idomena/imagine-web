'use client'

import { motion } from 'framer-motion'
import { Map, Sparkles, Rocket } from 'lucide-react'

interface JourneyHeroProps {
  title?: string
  subtitle?: string
  appsCount?: number
}

export function JourneyHero({
  title = 'Your AI Journey',
  subtitle = 'Discover and explore amazing AI apps',
  appsCount = 0,
}: JourneyHeroProps) {
  return (
    <section className="relative overflow-hidden py-8 sm:py-12">
      {/* Background decorations */}
      <div className="pointer-events-none absolute inset-0">
        {/* Gradient orbs */}
        <motion.div
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{ duration: 4, repeat: Infinity }}
          className="absolute -left-20 top-0 h-64 w-64 rounded-full bg-gradient-to-br from-emerald-200 to-teal-300 blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1, 1.15, 1],
            opacity: [0.25, 0.4, 0.25],
          }}
          transition={{ duration: 5, repeat: Infinity, delay: 1 }}
          className="absolute -right-20 bottom-0 h-72 w-72 rounded-full bg-gradient-to-br from-orange-200 to-amber-300 blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1, 1.08, 1],
            opacity: [0.2, 0.35, 0.2],
          }}
          transition={{ duration: 6, repeat: Infinity, delay: 2 }}
          className="absolute left-1/2 top-1/2 h-48 w-48 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-br from-purple-200 to-violet-300 blur-3xl"
        />
      </div>

      <div className="relative z-10 mx-auto max-w-md px-4 text-center">
        {/* Icon */}
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
          className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-emerald-400 to-teal-500 shadow-xl shadow-emerald-200/50"
        >
          <Map className="h-10 w-10 text-white" />
        </motion.div>

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-3xl font-bold text-stone-900 sm:text-4xl"
        >
          {title}
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-2 text-base text-stone-500"
        >
          {subtitle}
        </motion.p>

        {/* Stats pills */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-5 flex items-center justify-center gap-3"
        >
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="inline-flex items-center gap-2 rounded-full border-2 border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-bold text-emerald-700"
          >
            <Rocket className="h-4 w-4" />
            {appsCount} Apps
          </motion.div>
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="inline-flex items-center gap-2 rounded-full border-2 border-purple-200 bg-purple-50 px-4 py-2 text-sm font-bold text-purple-700"
          >
            <Sparkles className="h-4 w-4" />
            Explore Now
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}
