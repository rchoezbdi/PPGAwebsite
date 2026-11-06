'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { asMediaAlt, asMediaURL, text } from '../shared'

type RelatedPlan = Record<string, unknown>

const labels = {
  en: { next: 'Next plan', previous: 'Previous plan', slide: 'Go to plan' },
  es: { next: 'Plan siguiente', previous: 'Plan anterior', slide: 'Ir al plan' },
  pt: { next: 'Próximo plano', previous: 'Plano anterior', slide: 'Ir ao plano' },
} as const

export default function RelatedPlansCarousel({ content, locale }: { content: Record<string, unknown>; locale: string }) {
  const cards = Array.isArray(content.cards)
    ? content.cards.filter((card): card is RelatedPlan => Boolean(card && typeof card === 'object'))
    : []
  const trackRef = useRef<HTMLDivElement>(null)
  const scrollTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const interactionTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const leadingClones = useRef(1)
  const hoverPaused = useRef(false)
  const focusPaused = useRef(false)
  const interactionPaused = useRef(false)
  const [visibleCards, setVisibleCards] = useState(1)
  const [activeIndex, setActiveIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const [reducedMotion, setReducedMotion] = useState(false)
  const copy = labels[locale as keyof typeof labels] ?? labels.en
  const clones = Math.min(visibleCards, cards.length)
  leadingClones.current = clones
  const slides = cards.length > clones
    ? [
        ...cards.slice(-clones).map((card, index) => ({ card, key: `before-${index}`, clone: true })),
        ...cards.map((card, index) => ({ card, key: `plan-${index}`, clone: false })),
        ...cards.slice(0, clones).map((card, index) => ({ card, key: `after-${index}`, clone: true })),
      ]
    : cards.map((card, index) => ({ card, key: `plan-${index}`, clone: false }))

  useEffect(() => {
    const desktop = window.matchMedia('(min-width: 1025px)')
    const tablet = window.matchMedia('(min-width: 641px) and (max-width: 1024px)')
    const updateVisibleCards = () => setVisibleCards(desktop.matches ? 3 : tablet.matches ? 2 : 1)
    updateVisibleCards()
    desktop.addEventListener('change', updateVisibleCards)
    tablet.addEventListener('change', updateVisibleCards)
    return () => {
      desktop.removeEventListener('change', updateVisibleCards)
      tablet.removeEventListener('change', updateVisibleCards)
    }
  }, [])

  useEffect(() => {
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)')
    const updateMotionPreference = () => setReducedMotion(motion.matches)
    updateMotionPreference()
    motion.addEventListener('change', updateMotionPreference)
    return () => motion.removeEventListener('change', updateMotionPreference)
  }, [])

  useEffect(() => {
    const track = trackRef.current
    if (!track || cards.length <= 1) return
    const initialCard = track.children.item(clones) as HTMLElement | null
    if (initialCard) track.scrollLeft = initialCard.offsetLeft
    setActiveIndex(0)
  }, [cards.length, clones])

  useEffect(() => () => {
    if (scrollTimer.current) clearTimeout(scrollTimer.current)
    if (interactionTimer.current) clearTimeout(interactionTimer.current)
  }, [])

  const updatePaused = () => setPaused(hoverPaused.current || focusPaused.current || interactionPaused.current)
  const pauseForInteraction = () => {
    interactionPaused.current = true
    updatePaused()
    if (interactionTimer.current) clearTimeout(interactionTimer.current)
    interactionTimer.current = setTimeout(() => {
      interactionPaused.current = false
      updatePaused()
    }, 7000)
  }
  const move = (direction: -1 | 1) => {
    const track = trackRef.current
    if (!track || cards.length <= 1) return
    pauseForInteraction()
    const nextLogicalIndex = activeIndex + direction
    const nextPhysicalIndex = nextLogicalIndex < 0
      ? leadingClones.current - 1
      : nextLogicalIndex >= cards.length
        ? leadingClones.current + cards.length
        : leadingClones.current + nextLogicalIndex
    const nextCard = track.children.item(nextPhysicalIndex) as HTMLElement | null
    if (nextCard) track.scrollTo({ left: nextCard.offsetLeft, behavior: 'smooth' })
  }

  useEffect(() => {
    if (paused || reducedMotion || cards.length <= visibleCards) return
    const timer = setInterval(() => {
      const track = trackRef.current
      const nextCard = track?.children.item(leadingClones.current + activeIndex + 1) as HTMLElement | null
      if (track && nextCard) track.scrollTo({ left: nextCard.offsetLeft, behavior: 'smooth' })
    }, 5000)
    return () => clearInterval(timer)
  }, [activeIndex, cards.length, paused, reducedMotion, visibleCards])

  const onScroll = () => {
    const track = trackRef.current
    if (!track || !cards.length) return
    if (scrollTimer.current) clearTimeout(scrollTimer.current)
    scrollTimer.current = setTimeout(() => {
      const children = Array.from(track.children) as HTMLElement[]
      const nearestIndex = children.reduce((best, child, index) =>
        Math.abs(child.offsetLeft - track.scrollLeft) < Math.abs(children[best].offsetLeft - track.scrollLeft) ? index : best, 0)
      let normalizedIndex = nearestIndex
      if (nearestIndex < leadingClones.current) normalizedIndex += cards.length
      else if (nearestIndex >= leadingClones.current + cards.length) normalizedIndex -= cards.length
      if (normalizedIndex !== nearestIndex) {
        const normalizedCard = children[normalizedIndex]
        if (normalizedCard) track.scrollTo({ left: normalizedCard.offsetLeft, behavior: 'instant' })
      }
      setActiveIndex((normalizedIndex - leadingClones.current + cards.length) % cards.length)
    }, 100)
  }

  const goTo = (index: number) => {
    const track = trackRef.current
    const card = track?.children.item(leadingClones.current + index) as HTMLElement | null
    pauseForInteraction()
    if (track && card) track.scrollTo({ left: card.offsetLeft, behavior: 'smooth' })
  }

  return (
    <section
      aria-label={text(content.heading) || 'Related plans'}
      className="related-plans-carousel"
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          focusPaused.current = false
          updatePaused()
        }
      }}
      onFocusCapture={() => {
        focusPaused.current = true
        updatePaused()
      }}
      onMouseEnter={() => {
        hoverPaused.current = true
        updatePaused()
      }}
      onMouseLeave={() => {
        hoverPaused.current = false
        updatePaused()
      }}
      onTouchStart={pauseForInteraction}
    >
      {text(content.heading) ? <h2 className="related-plans-carousel__heading">{text(content.heading)}</h2> : null}
      <div aria-roledescription="carousel" className="related-plans-carousel__viewport" role="region">
        <div className="related-plans-carousel__track" onScroll={onScroll} ref={trackRef}>
          {slides.map(({ card, key, clone }) => {
            const image = asMediaURL(card.image) || asMediaURL(card.media) || text(card.imageUrl)
            const title = text(card.heading ?? card.title ?? card.label)
            const recommendation = text(card.badge) || text(card.description)
            const url = text(card.url)
            const planName = title.replace(/\s+Pro$/i, '')
            return (
              <article aria-hidden={clone || undefined} className="related-plans-carousel__slide" inert={clone || undefined} key={key}>
                <a aria-label={title} className="related-plans-carousel__card" href={url || undefined} tabIndex={clone ? -1 : undefined}>
                  {image ? <img alt={asMediaAlt(card.image, text(card.imageAlt) || title)} className="related-plans-carousel__image" loading="lazy" src={image} /> : null}
                  <h3 className="related-plans-carousel__title">{planName}<span>Pro</span></h3>
                  {recommendation ? <span className="related-plans-carousel__badge">{recommendation}</span> : null}
                </a>
              </article>
            )
          })}
        </div>
        {cards.length > visibleCards ? <>
          <button aria-label={copy.previous} className="related-plans-carousel__arrow related-plans-carousel__arrow--previous" onClick={() => move(-1)} type="button"><ChevronLeft aria-hidden="true" size={22} /></button>
          <button aria-label={copy.next} className="related-plans-carousel__arrow related-plans-carousel__arrow--next" onClick={() => move(1)} type="button"><ChevronRight aria-hidden="true" size={22} /></button>
        </> : null}
      </div>
      {cards.length > 1 ? <nav aria-label={locale === 'es' ? 'Paginación de planes' : locale === 'pt' ? 'Navegação dos planos' : 'Plan pagination'} className="related-plans-carousel__pagination">
        {cards.map((card, index) => <button aria-current={activeIndex === index ? 'true' : undefined} aria-label={`${copy.slide} ${index + 1}: ${text(card.heading ?? card.title ?? card.label)}`} className={activeIndex === index ? 'is-active' : ''} key={index} onClick={() => goTo(index)} type="button" />)}
      </nav> : null}
    </section>
  )
}