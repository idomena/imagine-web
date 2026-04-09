'use client'

import { useRef, useState, useEffect, useCallback } from 'react'
import { cn } from '@/lib/utils'

// ---------------------------------------------------------------------------
// ScreenshotGallery — Apple App Store-style horizontal scroll gallery
//
// Each slide shows a desktop screenshot with an optional mobile phone-frame
// inset in the bottom-right corner.
//
// Props:
//   items       — array of { src, label?, mobileSrc? }
//   compact     — smaller cards for inline use (e.g., submit modal)
//   className   — wrapper override
// ---------------------------------------------------------------------------

export interface GalleryItem {
  src:       string   // desktop screenshot (URL or data URI)
  label?:    string
  mobileSrc?: string  // optional mobile screenshot
}

interface Props {
  items:     GalleryItem[]
  compact?:  boolean
  className?: string
}

export function ScreenshotGallery({ items, compact = false, className }: Props) {
  const trackRef   = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState(0)

  // Update active dot on scroll
  const onScroll = useCallback(() => {
    const track = trackRef.current
    if (!track) return
    const idx = Math.round(track.scrollLeft / track.clientWidth)
    setActive(Math.min(idx, items.length - 1))
  }, [items.length])

  useEffect(() => {
    const track = trackRef.current
    if (!track) return
    track.addEventListener('scroll', onScroll, { passive: true })
    return () => track.removeEventListener('scroll', onScroll)
  }, [onScroll])

  function scrollTo(idx: number) {
    trackRef.current?.scrollTo({ left: trackRef.current.clientWidth * idx, behavior: 'smooth' })
  }

  if (!items.length) return null

  return (
    <div className={cn('flex flex-col gap-3', className)}>

      {/* ── Scroll track ──────────────────────────────────────────────────── */}
      <div
        ref={trackRef}
        className={cn(
          'flex overflow-x-auto gap-4 scroll-smooth',
          'snap-x snap-mandatory',
          '[scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
          compact ? 'pb-1' : 'pb-2',
        )}
        style={{ WebkitOverflowScrolling: 'touch' } as React.CSSProperties}
      >
        {items.map((item, i) => (
          <Slide key={i} item={item} compact={compact} isFirst={i === 0} />
        ))}
        {/* Trailing spacer so last card doesn't butt against the edge */}
        <div className="shrink-0 w-4" aria-hidden />
      </div>

      {/* ── Pagination dots ────────────────────────────────────────────────── */}
      {items.length > 1 && (
        <div className="flex items-center justify-center gap-1.5" role="tablist" aria-label="Gallery slides">
          {items.map((_, i) => (
            <button
              key={i}
              role="tab"
              aria-selected={i === active}
              aria-label={`Slide ${i + 1}`}
              onClick={() => scrollTo(i)}
              className={cn(
                'rounded-full transition-all duration-300',
                i === active
                  ? 'w-5 h-1.5 bg-teal-600'
                  : 'w-1.5 h-1.5 bg-stone-300 hover:bg-stone-400',
              )}
            />
          ))}
        </div>
      )}

    </div>
  )
}

// ── Slide card ─────────────────────────────────────────────────────────────────

function Slide({ item, compact, isFirst }: { item: GalleryItem; compact: boolean; isFirst: boolean }) {
  const cardW   = compact ? 'w-[72%] sm:w-[55%]' : 'w-[82%] sm:w-[65%]'
  const rounded = compact ? 'rounded-xl' : 'rounded-2xl'

  return (
    <div
      className={cn(
        'relative shrink-0 snap-start overflow-hidden',
        cardW,
        rounded,
        'border border-stone-200 bg-stone-50',
        compact
          ? 'shadow-[0_4px_16px_rgba(0,0,0,0.08)]'
          : 'shadow-[0_8px_32px_rgba(0,0,0,0.10)]',
        // The first card has extra left margin so the peek of the next card is visible
        isFirst ? 'ml-1' : '',
      )}
    >
      {/* Desktop screenshot */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={item.src}
        alt={item.label ?? 'Screenshot'}
        className="aspect-video w-full object-cover object-top"
        loading="lazy"
      />

      {/* Mobile inset — phone frame with screenshot */}
      {item.mobileSrc && (
        <div className={cn(
          'absolute bottom-2 right-2',
          'rounded-[10px] overflow-hidden',
          'border-2 border-white shadow-[0_4px_12px_rgba(0,0,0,0.20)]',
          compact ? 'w-[42px]' : 'w-[60px]',
        )}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={item.mobileSrc}
            alt={`${item.label ?? ''} mobile`}
            className="aspect-[9/16] w-full object-cover object-top"
            loading="lazy"
          />
        </div>
      )}

      {/* Label pill */}
      {item.label && (
        <div className={cn(
          'absolute bottom-2 left-2',
          'rounded-full border border-white/80 bg-white/80 backdrop-blur-sm',
          'text-stone-700 font-medium',
          compact ? 'px-2 py-0.5 text-[10px]' : 'px-3 py-1 text-xs',
        )}>
          {item.label}
        </div>
      )}
    </div>
  )
}
