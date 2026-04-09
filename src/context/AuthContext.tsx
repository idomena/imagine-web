'use client'

import { createContext, useContext, useEffect, useState, useCallback } from 'react'

// ---------------------------------------------------------------------------
// Auth context — lightweight client-side auth state backed by localStorage.
// ---------------------------------------------------------------------------

export interface AuthUser {
  id:           string
  email:        string
  role:         string
  avatarUrl?:   string | null
  displayName?: string | null
}

interface AuthContextValue {
  user:        AuthUser | null
  accessToken: string | null
  isLoading:   boolean
  login:       (data: { user: AuthUser; accessToken: string; refreshToken: string }) => void
  logout:      () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user,        setUser]        = useState<AuthUser | null>(null)
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [isLoading,   setIsLoading]   = useState(true)

  // Hydrate from localStorage on first render
  useEffect(() => {
    try {
      const token      = localStorage.getItem('accessToken')
      const storedUser = localStorage.getItem('authUser')
      if (token && storedUser) {
        setAccessToken(token)
        setUser(JSON.parse(storedUser) as AuthUser)
      }
    } catch { /* ignore parse errors */ }
    setIsLoading(false)
  }, [])

  const login = useCallback(
    (data: { user: AuthUser; accessToken: string; refreshToken: string }) => {
      localStorage.setItem('accessToken',  data.accessToken)
      localStorage.setItem('refreshToken', data.refreshToken)
      localStorage.setItem('authUser',     JSON.stringify(data.user))
      setAccessToken(data.accessToken)
      setUser(data.user)
    },
    [],
  )

  const logout = useCallback(() => {
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('authUser')
    setAccessToken(null)
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, accessToken, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>')
  return ctx
}
