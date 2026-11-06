'use client'

import { useEffect, useRef, useState } from 'react'
import Button, { type ButtonVariant } from '../atoms/Button'
import SectionHeading from '../molecules/SectionHeading'
import TestimonialCard from '../molecules/TestimonialCard'
import { asMediaAlt, asMediaURL, designTextColor, resolveCTA, text, type CTAContent } from '../shared'
import type { ExperienceComponentProps } from '@/experience/registry/componentRegistry'

type Testimonial = { cta?: CTAContent | null; buttonIcon?: string; buttonVariant?: ButtonVariant; excerpt?: string; image?: unknown; imageAlt?: string; imageUrl?: string; linkType?: 'internal' | 'external' | 'none'; page?: unknown; personName?: string; quote?: string; relatedPlan?: { name?: string }; role?: string; showIcon?: boolean; title?: string; url?: string }

// The full Testimonials page ("Life-changing stories") always says "Watch video" — every item
// there links straight to a real video. Preview placements use
// "View more" instead — verified against both live production contexts per locale, not guessed
// (production's own PT copy reuses the ES "Ver vídeo" string verbatim, not a PT translation).
const EDITORIAL_LINK_LABEL: Record<string, string> = { en: 'Watch video', es: 'Ver vídeo', pt: 'Ver vídeo' }
const DEFAULT_LINK_LABEL: Record<string, string> = { en: 'View more', es: 'Ver más', pt: 'Saiba mais' }

export default function TestimonialsSection({ content, settings, locale, site }: ExperienceComponentProps) {
  const p = { ...settings, ...content }
  const items = (p.testimonials ?? p.selectedTestimonials ?? []) as Testimonial[]
  const limit = typeof p.maximumItems === 'number' ? p.maximumItems : 3
  const background = text(p.background)
  const variant = text(p.variant) || 'default'
  const labels = variant === 'editorial' ? EDITORIAL_LINK_LABEL : DEFAULT_LINK_LABEL
  const itemLinkLabel = labels[locale] ?? labels.en
  const cardCTA = (item: Testimonial): CTAContent | null => item.cta !== undefined ? item.cta : {
    label: itemLinkLabel,
    linkType: item.linkType,
    page: item.page,
    url: item.url,
    variant: item.buttonVariant ?? 'outline',
    icon: item.buttonIcon ?? 'play',
    showIcon: item.showIcon ?? true,
  }
  const viewAllCTA = resolveCTA(p.viewAllCTA as CTAContent, locale, site)
  const carousel = text(p.displayMode) === 'carousel'
  const track = useRef<HTMLDivElement>(null)
  const isRepositioning = useRef(false)
  const [activeIndex, setActiveIndex] = useState(0)
  const visibleItems = items.slice(0, limit)
  const carouselItems = carousel && visibleItems.length > 1
    ? [
        { item: visibleItems[visibleItems.length - 1], index: visibleItems.length - 1, clone: true },
        ...visibleItems.map((item, index) => ({ item, index, clone: false })),
        { item: visibleItems[0], index: 0, clone: true },
      ]
    : visibleItems.map((item, index) => ({ item, index, clone: false }))
  useEffect(() => {
    const element = track.current
    const firstRealCard = element?.querySelector<HTMLElement>('.testimonial-card:not(.testimonial-card--clone)')
    const firstCard = element?.querySelector<HTMLElement>('.testimonial-card')
    if (element && firstRealCard && firstCard) element.scrollLeft = firstRealCard.offsetLeft - firstCard.offsetLeft
    if (element) element.dataset.ready = 'true'
  }, [])
  const onCarouselScroll = () => {
    const element = track.current
    if (!element) return
    const cards = Array.from(element.querySelectorAll<HTMLElement>('.testimonial-card'))
    const viewportStart = element.getBoundingClientRect().left
    const nearestCard = cards.reduce((best, card) =>
      Math.abs(card.getBoundingClientRect().left - viewportStart) < Math.abs(best.getBoundingClientRect().left - viewportStart) ? card : best, cards[0])
    const nearestIndex = Number(nearestCard?.dataset.testimonialIndex ?? 0)
    if (nearestCard?.classList.contains('testimonial-card--clone')) {
      const realCard = cards.find(card => !card.classList.contains('testimonial-card--clone') && Number(card.dataset.testimonialIndex) === nearestIndex)
      if (realCard) {
        isRepositioning.current = true
        element.scrollLeft += realCard.offsetLeft - nearestCard.offsetLeft
        requestAnimationFrame(() => { isRepositioning.current = false })
      }
    }
    if (!isRepositioning.current) setActiveIndex(nearestIndex)
  }
  const goToSlide = (index: number) => {
    const card = track.current?.querySelector<HTMLElement>(`.testimonial-card:not(.testimonial-card--clone)[data-testimonial-index="${index}"]`)
    if (card && track.current) track.current.scrollTo({ left: card.offsetLeft - (track.current.querySelector<HTMLElement>('.testimonial-card')?.offsetLeft ?? 0), behavior: 'smooth' })
  }

  return (
    <section className={`section${background && background !== 'white' ? ` section--${background}` : ''} testimonials-section testimonials-section--${variant}${carousel ? ' testimonials-section--carousel' : ''}`}>
      <div className="section-container">
        <SectionHeading description={text(p.description)} descriptionColor={designTextColor(p.descriptionColor)} eyebrow={text(p.eyebrow)} highlight={text(p.headingHighlight)} highlightColor={designTextColor(p.headingHighlightColor)} title={text(p.heading)} titleColor={designTextColor(p.headingColor)} />
        {carousel ? <div aria-label={text(p.heading) || 'Member testimonials'} className="testimonials-carousel" role="region">
          <div className="testimonials-carousel__track" data-ready="false" onScroll={onCarouselScroll} ref={track} tabIndex={0}>
            {carouselItems.map(({ item, index, clone }, cardPosition) => {
            return (
              <TestimonialCard
                author={item.personName}
                cta={cardCTA(item)}
                imageAlt={asMediaAlt(item.image, text(item.imageAlt))}
                clone={clone}
                image={asMediaURL(item.image) || text(item.imageUrl)}
                key={`${index}-${clone ? `clone-${cardPosition}` : 'real'}`}
                locale={locale}
                quote={item.quote ?? item.excerpt}
                role={p.showPlan && item.relatedPlan?.name ? item.relatedPlan.name : item.role}
                site={site}
                slideIndex={index}
                title={item.title}
                carousel
              />
            )
          })}
          </div>
          {visibleItems.length > 1 ? <nav aria-label={locale === 'es' ? 'Paginación de testimonios' : locale === 'pt' ? 'Navegação dos depoimentos' : 'Testimonials pagination'} className="testimonials-carousel__pagination">
            {visibleItems.map((_, index) => <button aria-current={activeIndex === index ? 'true' : undefined} aria-label={`${locale === 'es' ? 'Ir al testimonio' : locale === 'pt' ? 'Ir ao depoimento' : 'Go to testimonial'} ${index + 1}`} className={activeIndex === index ? 'is-active' : ''} key={index} onClick={() => goToSlide(index)} type="button" />)}
          </nav> : null}
        </div> : <div className="grid">
          {visibleItems.map((item, index) => {
            return <TestimonialCard author={item.personName} cta={cardCTA(item)} imageAlt={asMediaAlt(item.image, text(item.imageAlt))} image={asMediaURL(item.image) || text(item.imageUrl)} key={index} locale={locale} quote={item.quote ?? item.excerpt} role={p.showPlan && item.relatedPlan?.name ? item.relatedPlan.name : item.role} site={site} title={item.title} />
          })}
        </div>}
        {viewAllCTA?.href ? (
          <div className="testimonials-section__actions">
            <Button href={viewAllCTA.href} icon={viewAllCTA.showIcon ? viewAllCTA.icon || 'chevron-right' : undefined} iconPosition={viewAllCTA.iconPosition ?? 'right'} label={viewAllCTA.label} target={viewAllCTA.target} variant={viewAllCTA.variant ?? 'outline'} />
          </div>
        ) : null}
      </div>
    </section>
  )
}
