'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { Loader2, AlertCircle, Eye, EyeOff } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/context/AuthContext'
import { apiClient, ApiError } from '@/lib/api/client'

export default function SignInPage() {
  const { login }   = useAuth()
  const router      = useRouter()

  const [email,        setEmail]        = useState('')
  const [password,     setPassword]     = useState('')
  const [showPass,     setShowPass]     = useState(false)
  const [status,       setStatus]       = useState<'idle' | 'loading' | 'google' | 'error'>('idle')
  const [error,        setError]        = useState('')

  // ── Google ─────────────────────────────────────────────────────────────────

  async function handleGoogle() {
    setStatus('google'); setError('')
    await signIn('google', { callbackUrl: '/auth/callback' })
  }

  // ── Email / password ────────────────────────────────────────────────────────

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('loading'); setError('')

    try {
      const json = await apiClient.post<{
        data: { user: { id: string; email: string; role: string; avatarUrl?: string }; accessToken: string; refreshToken: string }
      }>('/api/v1/auth/login', { email, password })

      const { user, accessToken, refreshToken } = json.data
      login({ user, accessToken, refreshToken })
      router.push('/dashboard')
    } catch (err) {
      setStatus('error')
      setError(err instanceof ApiError ? err.message : err instanceof Error ? err.message : 'Sign in failed.')
    }
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-[#FDFDF9] px-4">
      <div className="w-full max-w-sm">

        <div className="rounded-2xl border border-stone-200 bg-white p-8 shadow-sm">
          <div className="mb-7 text-center">
            <h1 className="text-xl font-bold text-stone-900">Welcome back</h1>
            <p className="mt-1 text-sm text-stone-500">Sign in to your account</p>
          </div>

          {/* Google — primary */}
          <button
            type="button"
            onClick={handleGoogle}
            disabled={status === 'google' || status === 'loading'}
            className="mb-5 flex w-full items-center justify-center gap-3 rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-sm font-medium text-stone-700 shadow-sm transition hover:bg-stone-50 active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {status === 'google'
              ? <Loader2 className="h-4 w-4 animate-spin" />
              : <GoogleIcon />
            }
            Continue with Google
          </button>

          {/* Divider */}
          <div className="mb-5 flex items-center gap-3">
            <div className="flex-1 h-px bg-stone-100" />
            <span className="text-xs text-stone-400">or continue with email</span>
            <div className="flex-1 h-px bg-stone-100" />
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-stone-700">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                autoComplete="email"
                className={inputCls}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-stone-700">Password</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                  className={cn(inputCls, 'pr-10')}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 transition-colors"
                  tabIndex={-1}
                  aria-label={showPass ? 'Hide password' : 'Show password'}
                >
                  {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {status === 'error' && (
              <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3.5 py-3 text-sm text-red-600">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={status === 'loading' || status === 'google'}
              className="btn-primary mt-1 w-full justify-center disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {status === 'loading'
                ? <><Loader2 className="h-4 w-4 animate-spin" /> Signing in…</>
                : 'Sign In'
              }
            </button>

          </form>
        </div>

        <p className="mt-5 text-center text-sm text-stone-500">
          Don&apos;t have an account?{' '}
          <Link href="/sign-up" className="font-medium text-teal-700 hover:text-teal-600 transition-colors">
            Sign up
          </Link>
        </p>

      </div>
    </div>
  )
}

// ── Google icon ────────────────────────────────────────────────────────────────

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
      <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
  )
}

const inputCls =
  'w-full rounded-xl border border-stone-200 bg-stone-50 px-3.5 py-2.5 text-sm text-stone-800 ' +
  'placeholder:text-stone-400 outline-none transition ' +
  'focus:border-teal-400 focus:bg-white focus:ring-2 focus:ring-teal-400/20'
