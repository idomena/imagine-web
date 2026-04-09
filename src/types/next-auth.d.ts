import 'next-auth'
import 'next-auth/jwt'

declare module 'next-auth' {
  interface Session {
    accessToken?:  string
    refreshToken?: string
    fastifyUser?: {
      id:         string
      email:      string
      role:       string
      avatarUrl?: string
    }
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    accessToken?:  string
    refreshToken?: string
    fastifyUser?: {
      id:         string
      email:      string
      role:       string
      avatarUrl?: string
    }
  }
}
