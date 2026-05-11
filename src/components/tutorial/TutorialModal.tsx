'use client'

import { useTutorial } from './TutorialContext'
import { Search, Compass, LayoutGrid, Smartphone, Plus, Sparkles } from 'lucide-react'

const STEPS = [
  {
    icon:        <Sparkles className="h-8 w-8 text-violet-500" />,
    title:       'Welcome to Imagine',
    description: 'The first open marketplace for AI apps. No App Store taxes. No gatekeeping. No waiting. Just launch.',
    cta:         "Let's go",
  },
  {
    icon:        <Search className="h-8 w-8 text-teal-500" />,
    title:       'Search & Discover',
    description: 'Use the search bar on the home screen to find AI apps by name or keyword. Type anything — we'll find it instantly.',
    cta:         'Next',
  },
  {
    icon:        <Compass className="h-8 w-8 text-indigo-500" />,
    title:       'Explore & Trending',
    description: 'Hit Explore to browse every app on the platform, or Trending to see what the community is using right now.',
    cta:         'Next',
  },
  {
    icon:        <LayoutGrid className="h-8 w-8 text-orange-400" />,
    title:       'View App Details',
    description: 'Click any app card to see screenshots, reviews, pricing, and a direct link to launch the app.',
    cta:         'Next',
  },
  {
    icon:        <Plus className="h-8 w-8 text-violet-500" />,
    title:       'Submit Your App',
    description: 'Built something? Tap the + button anywhere to submit your AI app to the marketplace in minutes — no approval needed.',
    cta:         'Next',
  },
  {
    icon:        <Smartphone className="h-8 w-8 text-teal-500" />,
    title:       "You're all set",
    description: 'Create a free account to submit apps, leave reviews, and track your launches on your dashboard.',
    cta:         'Start exploring',
  },
]

export function TutorialModal() {
  const { isOpen, step, total, next, back, skip } = useTutorial()

  if (!isOpen) return null

  const current = STEPS[step]!

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        onClick={skip}
        aria-hidden
      />

      {/* Card */}
      <div className="relative w-full max-w-sm rounded-3xl bg-white shadow-2xl shadow-black/10 border border-stone-200/80 overflow-hidden">

        {/* Top gradient bar */}
        <div className="h-1 w-full" style={{ background: 'linear-gradient(90deg, #14b8a6, #6366f1, #f97316)' }} />

        <div className="px-7 pt-8 pb-7 flex flex-col items-center text-center">

          {/* Icon */}
          <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-stone-50 border border-stone-100 shadow-sm">
            {current.icon}
          </div>

          {/* Step counter */}
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-stone-400">
            Step {step + 1} of {total}
          </p>

          {/* Title */}
          <h2 className="text-xl font-bold text-stone-900 leading-snug">
            {current.title}
          </h2>

          {/* Description */}
          <p className="mt-3 text-sm text-stone-500 leading-relaxed">
            {current.description}
          </p>

          {/* Progress dots */}
          <div className="mt-6 flex items-center gap-1.5">
            {STEPS.map((_, i) => (
              <span
                key={i}
                className="block rounded-full transition-all duration-300"
                style={{
                  width:      i === step ? '20px' : '6px',
                  height:     '6px',
                  background: i === step ? '#6366f1' : '#e2e8f0',
                }}
              />
            ))}
          </div>

          {/* Buttons */}
          <div className="mt-6 flex w-full flex-col gap-2">
            <button
              onClick={next}
              className="w-full rounded-full py-3 text-sm font-semibold text-white transition-all active:scale-95 shadow-sm"
              style={{ background: 'linear-gradient(135deg, #14b8a6, #6366f1)' }}
            >
              {current.cta}
            </button>

            <div className="flex items-center justify-between">
              <button
                onClick={back}
                disabled={step === 0}
                className="px-4 py-2 text-xs font-medium text-stone-400 hover:text-stone-600 transition-colors disabled:opacity-0"
              >
                Back
              </button>
              <button
                onClick={skip}
                className="px-4 py-2 text-xs font-medium text-stone-400 hover:text-stone-600 transition-colors"
              >
                Skip tutorial
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
