'use client'

import { useEffect, useRef, useState } from 'react'

export type CounterProps = {
  animate?: boolean
  decimals?: number
  locale?: string
  prefix?: string
  suffix?: string
  value: number
}

/** Animated count-up used by MetricCard/TrustMetricsSection — only animates when `animate` is
 * true and the user hasn't asked for reduced motion; otherwise renders the final value directly
 * so the SSR'd markup and the client-hydrated markup match (no layout shift, no flash of "0"). */
export default function Counter({ animate = true, decimals = 0, locale, prefix = '', suffix = '', value }: CounterProps) {
  const [display, setDisplay] = useState(value)
  const ref = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    if (!animate || typeof window === 'undefined' || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const node = ref.current
    if (!node) return
    let frame = 0
    let started = false
    const run = () => {
      if (started) return
      started = true
      const duration = 1200
      const start = performance.now()
      const step = (now: number) => {
        const progress = Math.min(1, (now - start) / duration)
        const eased = 1 - (1 - progress) * (1 - progress)
        setDisplay(value * eased)
        if (progress < 1) frame = requestAnimationFrame(step)
      }
      frame = requestAnimationFrame(step)
    }
    const observer = new IntersectionObserver((entries) => { if (entries[0]?.isIntersecting) run() }, { threshold: 0.4 })
    observer.observe(node)
    return () => { observer.disconnect(); cancelAnimationFrame(frame) }
  }, [animate, value])

  const formatted = locale
    ? new Intl.NumberFormat(locale, { minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(display)
    : display.toFixed(decimals)
  return <span ref={ref}>{prefix}{formatted}{suffix}</span>
}
