'use client'

import { useAuth }        from '@/context/AuthContext'
import { HomeWorkbench }  from './HomeWorkbench'

// ---------------------------------------------------------------------------
// HeroOrWelcome — gate between guest hero and logged-in workbench
//
// • Guests / loading → full marketing hero (passed as `hero` prop from the
//   server component so it can be statically rendered without any JS).
// • Logged-in users  → HomeWorkbench (URL scan + trending row).
// ---------------------------------------------------------------------------

interface Props {
  hero: React.ReactNode
}

export function HeroOrWelcome({ hero }: Props) {
  const { user, isLoading } = useAuth()

  // While hydrating, keep the hero to avoid layout shift
  if (isLoading || !user) return <>{hero}</>

  const displayName = user.displayName || user.email?.split('@')[0] || 'there'

  return <HomeWorkbench displayName={displayName} />
}
