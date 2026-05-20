'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { motion } from 'framer-motion'
import { Loader2, AlertCircle, Eye, EyeOff, Sparkles, Layers, Users } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/context/AuthContext'
import { apiClient, ApiError } from '@/lib/api/client'

export default function SignUpPage() {
  const { login } = useAuth()
  const router    = useRouter()

  const [displayName, setDisplayName] = useState('')
  const [email,       setEmail]       = useState('')
  const [password,    setPassword]    = useState('')
  const [showPass,    setShowPass]    = useState(false)
  const [status,      setStatus]      = useState<'idle' | 'loading' | 'google' | 'error'>('idle')
  const [error,       setError]       = useState('')

  async function handleGoogle() {
    setStatus('google'); setError('')
    await signIn('google', { callbackUrl: '/auth/callback' })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('loading'); setError('')
    try {
      const json = await apiClient.post<{
        data: { user: { id: string; email: string; role: string }; accessToken: string; refreshToken: string }
      }>('/api/v1/auth/register', { email, password, displayName: displayName.trim() || undefined })
      const { user, accessToken, refreshToken } = json.data
      login({ user, accessToken, refreshToken })
      localStorage.setItem('imagine_tutorial_pending', '1')
      router.push('/')
    } catch (err) {
      setStatus('error')
      setError(err instanceof ApiError ? err.message : err instanceof Error ? err.message : 'Sign up failed.')
    }
  }

  return (
    <div className="flex min-h-screen" style={{ background: 'rgb(var(--color-background))' }}>

      {/* ── Left brand panel (desktop only) ── */}
      <div className="hidden lg:flex lg:w-[480px] xl:w-[520px] shrink-0 flex-col justify-between relative overflow-hidden"
        style={{ background: 'linear-gradient(145deg, #0C4A6E 0%, #0E7490 40%, #0F766E 100%)' }}
      >
        {/* Dot grid */}
        <div
          className="pointer-events-none absolute inset-0 opacity-10"
          style={{ backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)', backgroundSize: '28px 28px' }}
          aria-hidden
        />
        {/* Glow blobs */}
        <div className="pointer-events-none absolute -top-32 -right-32 h-[500px] w-[500px] rounded-full opacity-20"
          style={{ background: 'radial-gradient(circle, #2DD4BF, transparent 70%)' }} aria-hidden />
        <div className="pointer-events-none absolute -bottom-20 -left-20 h-[350px] w-[350px] rounded-full opacity-15"
          style={{ background: 'radial-gradient(circle, #38BDF8, transparent 70%)' }} aria-hidden />

        {/* Content */}
        <div className="relative z-10 flex flex-col h-full px-12 py-14">

          {/* Logo */}
          <Link href="/" className="inline-flex items-center gap-2 mb-auto">
            <Image src="/imagine-logo.png" alt="Imagine" width={140} height={42} className="h-10 w-auto object-contain brightness-0 invert" />
          </Link>

          {/* Headline */}
          <div className="my-auto">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="text-4xl font-black text-white leading-tight tracking-tight"
            >
              Build. Share.<br />Get discovered.
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="mt-4 text-sky-200 text-base leading-relaxed"
            >
              Your AI app, in front of the right audience.
            </motion.p>

            {/* Perks */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="mt-10 flex flex-col gap-4"
            >
              {[
                { icon: <Sparkles className="h-4 w-4" />, text: 'Submit your app in under 5 minutes' },
                { icon: <Layers className="h-4 w-4" />,   text: 'Reach thousands of AI enthusiasts' },
                { icon: <Users className="h-4 w-4" />,    text: 'Earn XP and grow with the community' },
              ].map(({ icon, text }) => (
                <div key={text} className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/10 text-sky-200 shrink-0">
                    {icon}
                  </div>
                  <span className="text-sm font-medium text-sky-100">{text}</span>
                </div>
              ))}
            </motion.div>
          </div>

          {/* Footer */}
          <p className="text-xs text-sky-300/60 mt-auto pt-8">
            © 2026 Imagine Marketplace
          </p>
        </div>
      </div>

      {/* ── Right form panel ── */}
      <div className="flex flex-1 flex-col items-center justify-center px-5 py-12">

        {/* Mobile logo */}
        <div className="lg:hidden mb-8">
          <Link href="/">
            <Image src="/imagine-logo.png" alt="Imagine" width={140} height={42} className="h-9 w-auto object-contain" />
          </Link>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-[400px]"
        >
          {/* Heading */}
          <div className="mb-8">
            <h1 className="text-2xl font-black text-slate-900">Create your account</h1>
            <p className="mt-1 text-sm text-slate-500">Join the Imagine community — it&apos;s free</p>
          </div>

          {/* Google */}
          <button
            type="button"
            onClick={handleGoogle}
            disabled={status === 'google' || status === 'loading'}
            className="mb-5 flex w-full items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm transition-all hover:border-slate-300 hover:shadow-md active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {status === 'google' ? <Loader2 className="h-4 w-4 animate-spin" /> : <GoogleIcon />}
            Continue with Google
          </button>

          {/* Divider */}
          <div className="mb-5 flex items-center gap-3">
            <div className="flex-1 h-px bg-slate-100" />
            <span className="text-xs font-medium text-slate-400">or email</span>
            <div className="flex-1 h-px bg-slate-100" />
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">
                Display name <span className="normal-case font-normal text-slate-400">(optional)</span>
              </label>
              <input
                type="text"
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                placeholder="Your name"
                maxLength={100}
                autoComplete="name"
                className={inputCls}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">Email</label>
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
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">Password</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Min. 8 characters"
                  required
                  minLength={8}
                  maxLength={72}
                  autoComplete="new-password"
                  className={cn(inputCls, 'pr-10')}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  tabIndex={-1}
                  aria-label={showPass ? 'Hide password' : 'Show password'}
                >
                  {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <p className="text-xs text-slate-400">Minimum 8 characters</p>
            </div>

            {status === 'error' && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-start gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600"
              >
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                {error}
              </motion.div>
            )}

            <button
              type="submit"
              disabled={status === 'loading' || status === 'google'}
              className="btn-primary mt-1 w-full justify-center py-3 text-base disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {status === 'loading'
                ? <><Loader2 className="h-4 w-4 animate-spin" /> Creating account…</>
                : 'Join Imagine'
              }
            </button>

          </form>

          <p className="mt-6 text-center text-sm text-slate-500">
            Already have an account?{' '}
            <Link href="/sign-in" className="font-bold text-sky-600 hover:text-sky-500 transition-colors">
              Sign in
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  )
}

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
  'w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 ' +
  'placeholder:text-slate-300 outline-none transition-all ' +
  'focus:border-sky-400 focus:ring-2 focus:ring-sky-400/20 focus:shadow-sm'
