'use client'

import { useEffect, useState, type ReactNode } from 'react'

/** Mobile-only alternative to a horizontal marquee: a scrolling line looks fine on desktop, but on
 * a narrow viewport it shows permanently truncated/mid-word text at both edges (the actual bug
 * reported against AlertBar/LegacyUtilityHeader on mobile). This shows one full, readable slide
 * at a time instead and auto-advances — same mental model as HeroCarousel, much smaller scale.
 * CSS (`.mobile-slide-rotator`) gates this to mobile only; desktop keeps the existing marquee,
 * which this renders alongside (not instead of) so no caller has to fork its content in two. */
export default function MobileSlideRotator({ slides, intervalMs = 4500, className, showDots = true }: {
  slides: ReactNode[]
  intervalMs?: number
  className?: string
  showDots?: boolean
}) {
  const [active, setActive] = useState(0)

  useEffect(() => {
    if (slides.length < 2) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const timer = window.setInterval(() => setActive((index) => (index + 1) % slides.length), intervalMs)
    return () => window.clearInterval(timer)
  }, [slides.length, intervalMs])

  if (!slides.length) return null
  return (
    <div className={`mobile-slide-rotator${className ? ` ${className}` : ''}`}>
      {slides.map((slide, index) => (
        <div className="mobile-slide-rotator__slide" data-active={index === active} key={index}>{slide}</div>
      ))}
      {showDots && slides.length > 1 ? (
        <div aria-hidden="true" className="mobile-slide-rotator__dots">
          {slides.map((_, index) => <span className={index === active ? 'is-active' : ''} key={index} />)}
        </div>
      ) : null}
    </div>
  )
}
