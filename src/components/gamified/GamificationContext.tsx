'use client'

import { createContext, useContext, useState, ReactNode, useCallback } from 'react'
import { AchievementToast, useAchievements } from './AchievementToast'

// ── User Progress State ───────────────────────────────────────────────────────

interface UserProgress {
  level: number
  xp: number
  xpToNextLevel: number
  streak: number
  appsExplored: number
  unlockedApps: string[]
}

interface GamificationContextValue {
  progress: UserProgress
  addXp: (amount: number) => void
  incrementStreak: () => void
  exploreApp: (appId: string) => void
  isAppUnlocked: (appId: string, index: number) => boolean
}

const GamificationContext = createContext<GamificationContextValue | null>(null)

const XP_PER_LEVEL = 500
const UNLOCK_EVERY_N_APPS = 3 // Unlock every 3 apps, rest requires exploration

export function GamificationProvider({ children }: { children: ReactNode }) {
  const [progress, setProgress] = useState<UserProgress>({
    level: 1,
    xp: 150,
    xpToNextLevel: XP_PER_LEVEL,
    streak: 3,
    appsExplored: 12,
    unlockedApps: [],
  })

  const { currentAchievement, showAchievement, dismissAchievement } = useAchievements()

  const addXp = useCallback((amount: number) => {
    setProgress((prev) => {
      const newXp = prev.xp + amount
      const leveledUp = newXp >= prev.xpToNextLevel
      
      if (leveledUp) {
        // Show level up achievement
        showAchievement({
          type: 'level',
          title: 'Level Up!',
          description: `You reached Level ${prev.level + 1}`,
          value: prev.level + 1,
        })
        
        return {
          ...prev,
          level: prev.level + 1,
          xp: newXp - prev.xpToNextLevel,
          xpToNextLevel: XP_PER_LEVEL + (prev.level * 100), // Increase XP needed per level
        }
      }

      // Show XP gained
      showAchievement({
        type: 'xp',
        title: 'XP Earned!',
        description: 'Keep exploring to level up',
        value: amount,
      })

      return { ...prev, xp: newXp }
    })
  }, [showAchievement])

  const incrementStreak = useCallback(() => {
    setProgress((prev) => {
      const newStreak = prev.streak + 1
      
      showAchievement({
        type: 'streak',
        title: 'Streak Extended!',
        description: `${newStreak} day streak! Keep it going!`,
        value: newStreak,
      })

      return { ...prev, streak: newStreak }
    })
  }, [showAchievement])

  const exploreApp = useCallback((appId: string) => {
    setProgress((prev) => {
      if (prev.unlockedApps.includes(appId)) return prev

      const newUnlockedApps = [...prev.unlockedApps, appId]
      const newAppsExplored = prev.appsExplored + 1

      showAchievement({
        type: 'unlock',
        title: 'New App Discovered!',
        description: 'You unlocked a new AI app',
      })

      return {
        ...prev,
        appsExplored: newAppsExplored,
        unlockedApps: newUnlockedApps,
      }
    })

    // Also give XP for exploring
    addXp(25)
  }, [showAchievement, addXp])

  // Determine if an app is unlocked based on index (for the journey feel)
  const isAppUnlocked = useCallback((appId: string, index: number) => {
    // First N apps are always unlocked for engagement
    if (index < 8) return true
    // After that, every UNLOCK_EVERY_N_APPS is a "milestone" unlock
    if ((index + 1) % UNLOCK_EVERY_N_APPS === 0) return true
    // Explicitly unlocked apps
    return progress.unlockedApps.includes(appId)
  }, [progress.unlockedApps])

  return (
    <GamificationContext.Provider
      value={{
        progress,
        addXp,
        incrementStreak,
        exploreApp,
        isAppUnlocked,
      }}
    >
      {children}
      <AchievementToast
        achievement={currentAchievement}
        onDismiss={dismissAchievement}
      />
    </GamificationContext.Provider>
  )
}

export function useGamification() {
  const context = useContext(GamificationContext)
  if (!context) {
    throw new Error('useGamification must be used within a GamificationProvider')
  }
  return context
}
