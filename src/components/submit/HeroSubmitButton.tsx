'use client'

import { useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { SubmitModal } from './SubmitModal'

interface HeroSubmitButtonProps {
  className?: string
  children: React.ReactNode
}

export function HeroSubmitButton({ className, children }: HeroSubmitButtonProps) {
  const [open, setOpen] = useState(false)
  // useAuth is still imported so the context is available, but we no longer
  // redirect — the SubmitModal handles the "not signed in" state internally.
  useAuth()

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={className}>
        {children}
      </button>
      <SubmitModal open={open} onClose={() => setOpen(false)} />
    </>
  )
}
