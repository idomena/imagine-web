'use client'

import { motion } from 'framer-motion'
import { Flame, Star, Trophy, Zap } from 'lucide-react'

interface ProgressHeaderProps {
  level?: number
  xp?: number
  xpToNextLevel?: number
  streak?: number
  appsExplored?: number
}

export function ProgressHeader({
  level = 1,
  xp = 150,
  xpToNextLevel = 500,
  streak = 3,
  appsExplored = 12,
}: ProgressHeaderProps) {
  const progressPercent = Math.min((xp / xpToNextLevel) * 100, 100)

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="sticky top-[calc(var(--header-pt)+0.5rem)] z-30 mx-4 sm:mx-auto sm:max-w-md"
    >
      <div className="rounded-3xl border-2 border-stone-200/60 bg-white/95 p-4 shadow-xl shadow-stone-200/40 backdrop-blur-lg">
        {/* Top stats row */}
        <div className="flex items-center justify-between gap-4">
          {/* Level badge */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="flex items-center gap-2"
          >
            <div className="relative flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 shadow-lg shadow-emerald-200/50">
              <Trophy className="h-5 w-5 text-white" />
              <motion.div
                className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-white text-xs font-bold text-emerald-600 shadow-md"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', delay: 0.2 }}
              >
                {level}
              </motion.div>
            </div>
            <div>
              <p className="text-xs font-semibold text-stone-400">Level</p>
              <p className="text-sm font-bold text-stone-900">Explorer</p>
            </div>
          </motion.div>

          {/* Streak */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="flex items-center gap-2"
          >
            <div className="relative flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-orange-400 to-red-500 shadow-md shadow-orange-200/50 animate-streak-glow">
              <Flame className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-xs font-semibold text-stone-400">Streak</p>
              <p className="text-sm font-bold text-orange-600">{streak} days</p>
            </div>
          </motion.div>

          {/* Apps explored */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="flex items-center gap-2"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 shadow-md shadow-blue-200/50">
              <Zap className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-xs font-semibold text-stone-400">Explored</p>
              <p className="text-sm font-bold text-blue-600">{appsExplored}</p>
            </div>
          </motion.div>
        </div>

        {/* XP Progress bar */}
        <div className="mt-4">
          <div className="mb-1.5 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Star className="h-4 w-4 text-purple-500 fill-purple-500" />
              <span className="text-xs font-bold text-purple-600">{xp} XP</span>
            </div>
            <span className="text-xs font-semibold text-stone-400">{xpToNextLevel - xp} to Level {level + 1}</span>
          </div>
          <div className="h-3 w-full overflow-hidden rounded-full bg-purple-100">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
              className="h-full rounded-full bg-gradient-to-r from-purple-400 via-violet-500 to-purple-600"
            />
          </div>
        </div>
      </div>
    </motion.div>
  )
}
