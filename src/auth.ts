import NextAuth from 'next-auth'
import Google from 'next-auth/providers/google'

// Server-side only — not exposed to the browser bundle
const INTERNAL_API = process.env.INTERNAL_API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000'

export const { handlers, auth, signIn, signOut } = NextAuth({
  debug: true,   // log OAuth flow details to the API (Next.js) terminal

  providers: [
    Google({
      clientId:     process.env.GOOGLE_CLIENT_ID  ?? '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
    }),
  ],

  // ---------------------------------------------------------------------------
  // Callbacks
  // ---------------------------------------------------------------------------
  callbacks: {
    /**
     * jwt — runs server-side after every OAuth round-trip.
     *
     * On the first sign-in `account` is populated. We use that window to call
     * our Fastify backend, upsert the user, and store our own JWT pair in the
     * NextAuth JWT so the client can pick it up from the session.
     *
     * Key fix: use `account.providerAccountId` for the Google user ID — it is
     * always set by NextAuth, whereas `profile.sub` typing is optional.
     */
    async jwt({ token, account, profile }) {
      if (account?.provider === 'google') {
        const googleId = account.providerAccountId          // guaranteed string
        const email    = (profile?.email ?? token.email) as string | undefined
        const name     = (profile?.name  ?? token.name)  as string | undefined
        const picture  = (profile as Record<string, unknown> | undefined)?.picture as string | undefined

        console.log('[NextAuth] jwt callback — syncing Google user to Fastify', {
          googleId,
          email,
          endpoint: `${INTERNAL_API}/api/v1/auth/google`,
        })

        try {
          const res = await fetch(`${INTERNAL_API}/api/v1/auth/google`, {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ googleId, email, name, picture }),
          })

          const text = await res.text()
          console.log('[NextAuth] Fastify response —', res.status, text.slice(0, 200))

          if (res.ok) {
            const json = JSON.parse(text) as {
              data: {
                user:         { id: string; email: string; role: string; avatarUrl?: string }
                accessToken:  string
                refreshToken: string
              }
            }
            token.accessToken  = json.data.accessToken
            token.refreshToken = json.data.refreshToken
            token.fastifyUser  = json.data.user
          } else {
            console.error('[NextAuth] Fastify returned non-OK status:', res.status, text)
          }
        } catch (err) {
          console.error('[NextAuth] Failed to reach Fastify API:', err)
        }
      }
      return token
    },

    /**
     * session — shapes the data that `useSession()` / `auth()` return.
     */
    async session({ session, token }) {
      session.accessToken  = token.accessToken  as string | undefined
      session.refreshToken = token.refreshToken as string | undefined
      session.fastifyUser  = token.fastifyUser  as {
        id: string; email: string; role: string; avatarUrl?: string
      } | undefined
      return session
    },
  },

  pages: {
    signIn: '/sign-in',
  },
})
