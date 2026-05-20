'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Star, Trophy, Flame, PartyPopper } from 'lucide-react'

type AchievementType = 'xp' | 'level' | 'streak' | 'unlock'

interface Achievement {
  type: AchievementType
  title: string
  description: string
  value?: number
}

const achievementConfig = {
  xp: {
    icon: Star,
    gradient: 'from-purple-400 to-violet-500',
    bgGradient: 'from-purple-50 to-violet-50',
    borderColor: 'border-purple-300',
  },
  level: {
    icon: Trophy,
    gradient: 'from-emerald-400 to-teal-500',
    bgGradient: 'from-emerald-50 to-teal-50',
    borderColor: 'border-emerald-300',
  },
  streak: {
    icon: Flame,
    gradient: 'from-orange-400 to-red-500',
    bgGradient: 'from-orange-50 to-red-50',
    borderColor: 'border-orange-300',
  },
  unlock: {
    icon: PartyPopper,
    gradient: 'from-blue-400 to-indigo-500',
    bgGradient: 'from-blue-50 to-indigo-50',
    borderColor: 'border-blue-300',
  },
}

interface AchievementToastProps {
  achievement: Achievement | null
  onDismiss: () => void
}

export function AchievementToast({ achievement, onDismiss }: AchievementToastProps) {
  useEffect(() => {
    if (achievement) {
      const timer = setTimeout(onDismiss, 4000)
      return () => clearTimeout(timer)
    }
  }, [achievement, onDismiss])

  const config = achievement ? achievementConfig[achievement.type] : null
  const Icon = config?.icon ?? Star

  return (
    <AnimatePresence>
      {achievement && config && (
        <motion.div
          initial={{ opacity: 0, y: -100, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -50, scale: 0.9 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          className="fixed top-4 left-4 right-4 z-[100] mx-auto max-w-sm sm:top-24"
        >
          <motion.div
            onClick={onDismiss}
            whileTap={{ scale: 0.98 }}
            className={`cursor-pointer rounded-3xl border-2 ${config.borderColor} bg-gradient-to-r ${config.bgGradient} p-4 shadow-2xl backdrop-blur-lg`}
          >
            <div className="flex items-center gap-4">
              {/* Icon */}
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', delay: 0.1 }}
                className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${config.gradient} shadow-lg`}
              >
                <Icon className="h-7 w-7 text-white" />
              </motion.div>

              {/* Content */}
              <div className="flex-1">
                <motion.p
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.15 }}
                  className="text-sm font-bold text-stone-900"
                >
                  {achievement.title}
                </motion.p>
                <motion.p
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                  className="text-xs text-stone-600"
                >
                  {achievement.description}
                </motion.p>
                {achievement.value !== undefined && (
                  <motion.p
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ type: 'spring', delay: 0.25 }}
                    className={`mt-1 text-lg font-bold bg-gradient-to-r ${config.gradient} bg-clip-text text-transparent`}
                  >
                    +{achievement.value} {achievement.type === 'xp' ? 'XP' : ''}
                  </motion.p>
                )}
              </div>
            </div>

            {/* Progress bar animation */}
            <motion.div
              initial={{ scaleX: 1 }}
              animate={{ scaleX: 0 }}
              transition={{ duration: 4, ease: 'linear' }}
              className={`mt-3 h-1 origin-left rounded-full bg-gradient-to-r ${config.gradient}`}
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// ── Hook for managing achievements ────────────────────────────────────────────

export function useAchievements() {
  const [currentAchievement, setCurrentAchievement] = useState<Achievement | null>(null)
  const [queue, setQueue] = useState<Achievement[]>([])

  const showAchievement = (achievement: Achievement) => {
    if (currentAchievement) {
      setQueue((prev) => [...prev, achievement])
    } else {
      setCurrentAchievement(achievement)
    }
  }

  const dismissAchievement = () => {
    setCurrentAchievement(null)
    if (queue.length > 0) {
      const [next, ...rest] = queue
      setQueue(rest)
      setTimeout(() => setCurrentAchievement(next), 300)
    }
  }

  return {
    currentAchievement,
    showAchievement,
    dismissAchievement,
  }
}
