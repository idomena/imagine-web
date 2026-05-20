'use client'

import { JourneyCard, type CardBadge } from '@/components/gamified/JourneyCard'
import { JourneyFeed } from '@/components/gamified/JourneyFeed'
import { JourneyHero } from '@/components/gamified/JourneyHero'
import { ProgressHeader } from '@/components/gamified/ProgressHeader'
import { useGamification } from '@/components/gamified/GamificationContext'
import type { App, Category } from '@/lib/api/types'

interface GamifiedFeedProps {
  apps: App[]
  categories: Category[]
}

function computeBadge(publishedAt: Date | string | null | undefined): CardBadge | undefined {
  if (!publishedAt) return undefined
  const d = publishedAt instanceof Date ? publishedAt : new Date(publishedAt as string)
  if (isNaN(d.getTime())) return undefined
  const days = (Date.now() - d.getTime()) / 86_400_000
  if (days <= 7) return 'new'
  if (days <= 30) return 'trending'
  return undefined
}

export function GamifiedFeed({ apps, categories }: GamifiedFeedProps) {
  const { progress, isAppUnlocked } = useGamification()
  const categoryMap = new Map(categories.map((c) => [c.id, c.name]))

  // Calculate XP rewards based on position (earlier = more XP)
  const getXpReward = (index: number) => {
    if (index < 3) return 100
    if (index < 10) return 75
    if (index < 20) return 50
    return 25
  }

  return (
    <div className="relative min-h-screen bg-background">
      {/* Hero section */}
      <JourneyHero
        title="Your AI Journey"
        subtitle="Discover and launch amazing AI apps"
        appsCount={apps.length}
      />

      {/* Sticky progress header */}
      <ProgressHeader
        level={progress.level}
        xp={progress.xp}
        xpToNextLevel={progress.xpToNextLevel}
        streak={progress.streak}
        appsExplored={progress.appsExplored}
      />

      {/* Main journey feed */}
      <div className="mt-8 sm:mt-12">
        <JourneyFeed>
          {apps.map((app, index) => (
            <JourneyCard
              key={app.id}
              app={app}
              index={index}
              badge={computeBadge(app.publishedAt)}
              categoryName={app.categoryId ? categoryMap.get(app.categoryId) : undefined}
              isUnlocked={isAppUnlocked(app.id, index)}
              xpReward={getXpReward(index)}
            />
          ))}
        </JourneyFeed>
      </div>
    </div>
  )
}
