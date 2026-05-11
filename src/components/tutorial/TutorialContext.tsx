'use client'

import { createContext, useContext, useEffect, useState } from 'react'

const STORAGE_KEY = 'imagine_tutorial_done'

export interface TutorialStep {
  target:   string | null   // data-tutorial attribute value; null = centered welcome bubble
  title:    string
  body:     string
  position: 'top' | 'bottom' | 'center'
}

export const STEPS: TutorialStep[] = [
  {
    target:   null,
    title:    'Welcome to Imagine 👋',
    body:     'The open marketplace for AI apps. Let\'s take a 30-second tour.',
    position: 'center',
  },
  {
    target:   'hero-search',
    title:    'Submit any app',
    body:     'Paste your app link here and hit Launch — it goes live on the marketplace instantly.',
    position: 'bottom',
  },
  {
    target:   'nav-explore',
    title:    'Explore all apps',
    body:     'Browse every app on the platform, filtered by category.',
    position: 'bottom',
  },
  {
    target:   'nav-trending',
    title:    'Trending now',
    body:     'See which apps the community is using and loving right now.',
    position: 'bottom',
  },
  {
    target:   'nav-submit',
    title:    'Submit your app',
    body:     'Tap + anytime to submit your AI app. No approval process, no waiting.',
    position: 'top',
  },
  {
    target:   'nav-signup',
    title:    'Create a free account',
    body:     'Sign up to submit apps, leave reviews, and track your launches from your dashboard.',
    position: 'bottom',
  },
]

interface TutorialContextValue {
  isOpen: boolean
  step:   number
  total:  number
  next:   () => void
  back:   () => void
  skip:   () => void
}

const TutorialContext = createContext<TutorialContextValue | null>(null)

export function TutorialProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  const [step,   setStep]   = useState(0)
  const total = STEPS.length

  useEffect(() => {
    if (!localStorage.getItem(STORAGE_KEY)) {
      setIsOpen(true)
    }
  }, [])

  function finish() {
    localStorage.setItem(STORAGE_KEY, '1')
    setIsOpen(false)
    setStep(0)
  }

  function next() {
    if (step < total - 1) setStep(s => s + 1)
    else finish()
  }

  function back() {
    if (step > 0) setStep(s => s - 1)
  }

  return (
    <TutorialContext.Provider value={{ isOpen, step, total, next, back, skip: finish }}>
      {children}
    </TutorialContext.Provider>
  )
}

export function useTutorial() {
  const ctx = useContext(TutorialContext)
  if (!ctx) throw new Error('useTutorial must be used inside TutorialProvider')
  return ctx
}
