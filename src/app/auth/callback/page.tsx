'use client'

import { useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'

// ---------------------------------------------------------------------------
// /auth/callback
//
// Landing page after Google OAuth completes. NextAuth has already run its
// jwt + session callbacks and stored the Fastify tokens in the session.
// This page reads them and copies them into localStorage (AuthContext) so the
// rest of the app can use them for API calls.
// ---------------------------------------------------------------------------

export default function AuthCallbackPage() {
  const { data: session, status } = useSession()
  const { login } = useAuth()
  const router    = useRouter()
  const synced    = useRef(false)   // prevent double-sync in Strict Mode

  useEffect(() => {
    if (status === 'loading' || synced.current) return

    if (status === 'authenticated' && session?.accessToken && session?.fastifyUser) {
      synced.current = true
      login({
        user: {
          id:         session.fastifyUser.id,
          email:      session.fastifyUser.email,
          role:       session.fastifyUser.role,
          avatarUrl:  session.fastifyUser.avatarUrl,
        },
        accessToken:  session.accessToken,
        refreshToken: session.refreshToken ?? '',
      })
      router.replace('/dashboard')
    } else if (status === 'unauthenticated') {
      router.replace('/sign-in')
    }
  }, [session, status, login, router])

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-[#FDFDF9]">
      <div className="flex flex-col items-center gap-3 text-stone-500">
        <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
        <p className="text-sm">Signing you in…</p>
      </div>
    </div>
  )
}
