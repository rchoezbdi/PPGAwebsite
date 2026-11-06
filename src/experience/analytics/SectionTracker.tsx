'use client'

import { useEffect } from 'react'

declare global {
  interface Window {
    dataLayer?: Array<Record<string, unknown>>
  }
}

interface SectionTrackerProps {
  appSlug?: string
  pageSlug?: string
  locale?: string
}

export function SectionTracker({
  appSlug = 'home',
  pageSlug = 'page',
  locale = 'es',
}: SectionTrackerProps) {
  useEffect(() => {
    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) return

    const trackedSections = new Set<string>()

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
            const target = entry.target as HTMLElement
            const sectionId = target.dataset.sectionId || ''
            if (!sectionId || trackedSections.has(sectionId)) return

            trackedSections.add(sectionId)

            const sectionCode = target.dataset.sectionCode || 'section'
            const sectionPosition = Number(target.dataset.sectionPosition || 0)
            const sectionHeading = (target.dataset.sectionHeading || '').slice(0, 100)

            const eventPayload = {
              event: 'section_view',
              app_slug: appSlug,
              hostname: window.location.hostname,
              page_slug: pageSlug,
              locale,
              section_id: sectionId,
              section_code: sectionCode,
              section_position: sectionPosition,
              section_heading: sectionHeading,
            }

            window.dataLayer = window.dataLayer || []
            window.dataLayer.push(eventPayload)
          }
        })
      },
      {
        threshold: 0.5, // 50% visibility required
      }
    )

    // Observe all elements with data-section-id within the page
    const elements = document.querySelectorAll('[data-section-id]')
    elements.forEach((el) => observer.observe(el))

    return () => {
      observer.disconnect()
      trackedSections.clear()
    }
  }, [appSlug, pageSlug, locale])

  return null
}
