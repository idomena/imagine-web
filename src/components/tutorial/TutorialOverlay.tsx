'use client'

import { useEffect, useState, useCallback } from 'react'
import { useTutorial, STEPS } from './TutorialContext'

interface BubblePos {
  top:        number
  left:       number
  arrowSide:  'top' | 'bottom' | 'none'
  arrowLeft:  number
}

function findVisible(name: string): HTMLElement | null {
  const els = document.querySelectorAll(`[data-tutorial="${name}"]`)
  for (const el of els) {
    const r = el.getBoundingClientRect()
    if (r.width > 0 && r.height > 0) return el as HTMLElement
  }
  return null
}

function calcPos(el: HTMLElement): BubblePos {
  const r       = el.getBoundingClientRect()
  const bubbleW = 280
  const gap     = 12

  const elCenterX = r.left + r.width / 2
  let left = elCenterX - bubbleW / 2
  left = Math.max(12, Math.min(left, window.innerWidth - bubbleW - 12))

  const arrowLeft = Math.max(16, Math.min(elCenterX - left - 8, bubbleW - 32))

  const spaceBelow = window.innerHeight - r.bottom
  const spaceAbove = r.top

  if (spaceBelow >= 140 || spaceBelow >= spaceAbove) {
    return { top: r.bottom + gap, left, arrowSide: 'top', arrowLeft }
  } else {
    return { top: r.top - gap, left, arrowSide: 'bottom', arrowLeft }
  }
}

export function TutorialOverlay() {
  const { isOpen, step, total, next, back, skip } = useTutorial()
  const [pos, setPos] = useState<BubblePos | null>(null)
  const current = STEPS[step]!

  const reposition = useCallback(() => {
    if (!isOpen || !current.target) { setPos(null); return }
    const el = findVisible(current.target)
    if (el) setPos(calcPos(el))
    else    setPos(null)
  }, [isOpen, current.target])

  useEffect(() => {
    reposition()
    window.addEventListener('resize', reposition)
    return () => window.removeEventListener('resize', reposition)
  }, [reposition])

  if (!isOpen) return null

  const isCentered = current.position === 'center' || (!current.target && pos === null)

  return (
    <>
      {/* Dim overlay */}
      <div
        className="fixed inset-0 z-[190] bg-black/40"
        onClick={skip}
        aria-hidden
      />

      {isCentered ? (
        /* ── Centered welcome bubble ── */
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-5 pointer-events-none">
          <Bubble
            step={step}
            total={total}
            title={current.title}
            body={current.body}
            onNext={next}
            onBack={back}
            onSkip={skip}
            arrowSide="none"
            arrowLeft={0}
          />
        </div>
      ) : pos ? (
        /* ── Anchored tooltip bubble ── */
        <div
          className="fixed z-[200] pointer-events-none"
          style={{
            top:   pos.arrowSide === 'bottom' ? pos.top - 160 : pos.top,
            left:  pos.left,
            width: 280,
          }}
        >
          <Bubble
            step={step}
            total={total}
            title={current.title}
            body={current.body}
            onNext={next}
            onBack={back}
            onSkip={skip}
            arrowSide={pos.arrowSide}
            arrowLeft={pos.arrowLeft}
          />
        </div>
      ) : null}
    </>
  )
}

// ── Bubble UI ─────────────────────────────────────────────────────────────────

interface BubbleProps {
  step:      number
  total:     number
  title:     string
  body:      string
  onNext:    () => void
  onBack:    () => void
  onSkip:    () => void
  arrowSide: 'top' | 'bottom' | 'none'
  arrowLeft: number
}

function Bubble({ step, total, title, body, onNext, onBack, onSkip, arrowSide, arrowLeft }: BubbleProps) {
  const isLast = step === total - 1

  return (
    <div className="pointer-events-auto relative w-[280px]">

      {/* Arrow pointing UP (bubble is below the element) */}
      {arrowSide === 'top' && (
        <div
          className="absolute -top-[8px] h-0 w-0"
          style={{
            left:        arrowLeft,
            borderLeft:  '8px solid transparent',
            borderRight: '8px solid transparent',
            borderBottom: '8px solid white',
          }}
        />
      )}

      {/* Card */}
      <div className="rounded-2xl bg-white shadow-2xl shadow-black/20 border border-stone-100 overflow-hidden">
        {/* Top gradient bar */}
        <div className="h-[3px]" style={{ background: 'linear-gradient(90deg, #14b8a6, #6366f1)' }} />

        <div className="p-4">
          {/* Step counter */}
          <p className="text-[10px] font-semibold uppercase tracking-widest text-stone-400 mb-1">
            {step + 1} / {total}
          </p>

          {/* Title */}
          <p className="text-sm font-bold text-stone-900 leading-snug">{title}</p>

          {/* Body */}
          <p className="mt-1.5 text-xs text-stone-500 leading-relaxed">{body}</p>

          {/* Progress dots */}
          <div className="mt-3 flex items-center gap-1">
            {Array.from({ length: total }).map((_, i) => (
              <span
                key={i}
                className="block rounded-full transition-all duration-300"
                style={{
                  width:      i === step ? '14px' : '5px',
                  height:     '5px',
                  background: i === step ? '#6366f1' : '#e2e8f0',
                }}
              />
            ))}
          </div>

          {/* Buttons */}
          <div className="mt-3 flex items-center justify-between gap-2">
            <button
              onClick={onSkip}
              className="text-[11px] text-stone-400 hover:text-stone-600 transition-colors"
            >
              Skip tutorial
            </button>

            <div className="flex items-center gap-1.5">
              {step > 0 && (
                <button
                  onClick={onBack}
                  className="rounded-full px-3 py-1.5 text-[11px] font-medium text-stone-500 hover:bg-stone-100 transition-colors"
                >
                  Back
                </button>
              )}
              <button
                onClick={onNext}
                className="rounded-full px-4 py-1.5 text-[11px] font-semibold text-white transition-all active:scale-95"
                style={{ background: 'linear-gradient(135deg, #14b8a6, #6366f1)' }}
              >
                {isLast ? 'Done' : 'Next →'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Arrow pointing DOWN (bubble is above the element) */}
      {arrowSide === 'bottom' && (
        <div
          className="absolute -bottom-[8px] h-0 w-0"
          style={{
            left:        arrowLeft,
            borderLeft:  '8px solid transparent',
            borderRight: '8px solid transparent',
            borderTop:   '8px solid white',
          }}
        />
      )}
    </div>
  )
}
