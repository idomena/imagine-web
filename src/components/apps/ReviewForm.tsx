'use client'

import { useState } from 'react'
import { Star, CheckCircle, Loader2, LogIn } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { useAuth } from '@/context/AuthContext'
import type { AppReview } from '@/lib/api/types'

// ---------------------------------------------------------------------------
// ReviewForm — real star rating + comment form connected to the backend.
//
// Props:
//   primaryColor  — brand colour for stars / submit button
//   accentText    — darker tint for text on white bg
//   appId         — used for API calls
//   initialReviews — server-fetched reviews (SSR)
//   initialTotal  — total review count from server
//   initialAvg    — pre-computed average from server
// ---------------------------------------------------------------------------

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080'

const RATING_LABELS = ['', 'Poor', 'Fair', 'Good', 'Great', 'Excellent']

interface Props {
  primaryColor:   string
  accentText:     string
  appId:          string
  initialReviews: AppReview[]
  initialTotal:   number
  initialAvg:     number | null
}

function displayName(email: string) {
  return email.split('@')[0] ?? 'User'
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const mins  = Math.floor(diff / 60_000)
  const hours = Math.floor(diff / 3_600_000)
  const days  = Math.floor(diff / 86_400_000)
  if (mins  < 2)  return 'Just now'
  if (mins  < 60) return `${mins}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days  < 30) return `${days}d ago`
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export function ReviewForm({
  primaryColor, accentText, appId, initialReviews, initialTotal, initialAvg,
}: Props) {
  const { user, accessToken } = useAuth()

  const [reviews,    setReviews]    = useState<AppReview[]>(initialReviews)
  const [total,      setTotal]      = useState(initialTotal)
  const [avgRating,  setAvgRating]  = useState(initialAvg)

  const [rating,     setRating]     = useState(0)
  const [hovered,    setHovered]    = useState(0)
  const [comment,    setComment]    = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted,  setSubmitted]  = useState(false)
  const [error,      setError]      = useState('')

  const displayStars = hovered || rating

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (rating === 0 || !comment.trim() || !accessToken) return
    setSubmitting(true); setError('')

    try {
      const res = await fetch(`${API_BASE}/api/v1/apps/${appId}/reviews`, {
        method:  'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization:  `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ rating, comment: comment.trim() }),
      })
      const json = await res.json() as { data?: AppReview; error?: { message?: string } }
      if (!res.ok) throw new Error(json.error?.message ?? `Error ${res.status}`)

      const newReview = json.data!
      // Update local state — replace existing review from same user or prepend
      setReviews(prev => {
        const filtered = prev.filter(r => r.userId !== newReview.userId)
        return [newReview, ...filtered]
      })
      setTotal(t => t + (reviews.some(r => r.userId === newReview.userId) ? 0 : 1))
      // Recompute avg locally
      setAvgRating(prev => {
        const all = [
          ...reviews.filter(r => r.userId !== newReview.userId),
          newReview,
        ]
        return all.reduce((s, r) => s + r.rating, 0) / all.length
      })

      setRating(0); setComment(''); setSubmitted(true)
      setTimeout(() => setSubmitted(false), 4000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div>

      {/* ── Existing reviews list ─────────────────────────────────────────── */}
      {reviews.length > 0 && (
        <div className="divide-y divide-stone-50">
          {reviews.map(r => {
            const name = displayName(r.user.email)
            return (
              <div key={r.id} className="px-6 py-4 flex items-start gap-3">
                {/* Avatar */}
                {r.user.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={r.user.avatarUrl}
                    alt={name}
                    referrerPolicy="no-referrer"
                    className="h-8 w-8 shrink-0 rounded-full object-cover border border-stone-100"
                  />
                ) : (
                  <div
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white select-none"
                    style={{ background: `${primaryColor}cc` }}
                  >
                    {name[0]?.toUpperCase() ?? '?'}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold text-stone-800">{name}</span>
                    <span className="text-[11px] text-stone-400">{timeAgo(r.createdAt)}</span>
                  </div>
                  <div className="mt-0.5 flex gap-0.5">
                    {[1,2,3,4,5].map(s => (
                      <Star
                        key={s}
                        className="h-3 w-3"
                        fill={s <= r.rating ? accentText : 'none'}
                        stroke={s <= r.rating ? accentText : '#d6d3d1'}
                        strokeWidth={1.5}
                      />
                    ))}
                  </div>
                  <p className="mt-1 text-sm text-stone-500 leading-relaxed">{r.comment}</p>
                </div>
              </div>
            )
          })}
          {total > reviews.length && (
            <div className="px-6 py-3 text-center text-xs text-stone-400">
              Showing {reviews.length} of {total} reviews
            </div>
          )}
        </div>
      )}

      {/* ── Form ─────────────────────────────────────────────────────────────── */}
      {!user ? (
        <div className="px-6 py-6 border-t border-stone-50 flex items-center justify-between gap-4">
          <p className="text-sm text-stone-400">Sign in to leave a review</p>
          <Link
            href="/sign-in"
            className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold text-white transition-all"
            style={{ background: accentText }}
          >
            <LogIn className="h-3.5 w-3.5" />
            Sign In
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="px-6 py-5 border-t border-stone-50">

          {/* Star picker */}
          <div className="flex items-center gap-1 mb-4">
            {[1,2,3,4,5].map(s => (
              <button
                key={s}
                type="button"
                onMouseEnter={() => setHovered(s)}
                onMouseLeave={() => setHovered(0)}
                onClick={() => setRating(s)}
                className="transition-transform hover:scale-110 active:scale-95"
                aria-label={`${s} star${s > 1 ? 's' : ''}`}
              >
                <Star
                  className="h-6 w-6 transition-colors"
                  fill={s <= displayStars ? accentText : 'none'}
                  stroke={s <= displayStars ? accentText : '#d6d3d1'}
                  strokeWidth={1.5}
                />
              </button>
            ))}
            {rating > 0 && (
              <span className="ml-2 text-xs text-stone-400">
                {RATING_LABELS[rating]}
              </span>
            )}
          </div>

          <textarea
            value={comment}
            onChange={e => setComment(e.target.value)}
            placeholder="What did you think of this app?"
            maxLength={1000}
            rows={3}
            required
            className={cn(inputCls, 'resize-none w-full mb-3')}
          />

          {error && (
            <p className="mb-3 text-xs text-red-500">{error}</p>
          )}

          <div className="flex items-center justify-between gap-3">
            <span className="text-xs text-stone-400">{comment.length} / 1000</span>
            <button
              type="submit"
              disabled={rating === 0 || !comment.trim() || submitting}
              className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ background: accentText }}
            >
              {submitting
                ? <><Loader2 className="h-4 w-4 animate-spin" /> Posting…</>
                : submitted
                  ? <><CheckCircle className="h-4 w-4" /> Posted!</>
                  : 'Post Review'
              }
            </button>
          </div>
        </form>
      )}
    </div>
  )
}

const inputCls =
  'rounded-xl border border-stone-200 bg-stone-50 px-3.5 py-2.5 text-sm text-stone-800 ' +
  'placeholder:text-stone-400 outline-none transition ' +
  'focus:border-teal-400 focus:bg-white focus:ring-2 focus:ring-teal-400/20'
