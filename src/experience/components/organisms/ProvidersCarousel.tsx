'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useRef, type CSSProperties } from 'react'
import { asMediaURL, text } from '../shared'

type ProviderCard = Record<string, unknown>

const labels = {
  en: { next: 'Next provider', previous: 'Previous provider' },
  es: { next: 'Siguiente proveedor', previous: 'Proveedor anterior' },
  pt: { next: 'Próximo prestador', previous: 'Prestador anterior' },
} as const

export default function ProvidersCarousel({ content, locale }: { content: Record<string, unknown>; locale: string }) {
  const trackRef = useRef<HTMLDivElement>(null)
  const copy = labels[locale as keyof typeof labels] ?? labels.en
  const cards = Array.isArray(content.cards) ? content.cards.filter((card): card is ProviderCard => Boolean(card && typeof card === 'object')) : []
  const description = text(content.description)
  const background = asMediaURL(content.backgroundMedia)
  const mobileBackground = asMediaURL(content.backgroundMediaMobile)
  const backgroundStyle = background ? {
    '--providers-background': `url("${background}")`,
    '--providers-background-mobile': `url("${mobileBackground || background}")`,
  } as CSSProperties : undefined
  const scroll = (direction: -1 | 1) => {
    const track = trackRef.current
    if (!track) return
    track.scrollBy({ behavior: 'smooth', left: direction * Math.round(track.clientWidth * 0.72) })
  }

  return (
    <section className={`providers-carousel${description ? ' providers-carousel--distributor' : ''}`} style={backgroundStyle}>
      <div className="section-container providers-carousel__inner">
        <header className="providers-carousel__heading">
          {description ? <>
            <p className="providers-carousel__script-heading">{text(content.heading)}</p>
            {text(content.headingHighlight) ? <h2>{text(content.headingHighlight)}</h2> : null}
            <div className="providers-carousel__description">
              {description.split(/\n{2,}/).map((paragraph, index) => <p key={index}>{paragraph}</p>)}
            </div>
          </> : <>
            <h2>{text(content.heading)}</h2>
            {text(content.headingHighlight) ? <p>{text(content.headingHighlight)}</p> : null}
          </>}
        </header>
        <div aria-label={[text(content.heading), text(content.headingHighlight)].filter(Boolean).join(' ')} className="providers-carousel__viewport" role="region">
          <div className="providers-carousel__track" ref={trackRef} tabIndex={0}>
            {cards.map((card, index) => {
              const image = asMediaURL(card.image) || text(card.imageUrl)
              const heading = text(card.heading) || text(card.label) || text(card.title)
              return (
                <article className={`providers-carousel__card${image ? ' providers-carousel__card--image' : ''}`} key={`${heading}-${index}`} style={image ? { backgroundImage: `linear-gradient(0deg, rgba(5, 28, 67, .7), rgba(5, 28, 67, .04) 75%), url("${image}")` } : undefined}>
                  <h3>{heading}</h3>
                </article>
              )
            })}
          </div>
          <button aria-label={copy.previous} className="providers-carousel__control providers-carousel__control--previous" onClick={() => scroll(-1)} type="button"><ChevronLeft aria-hidden="true" size={24} /></button>
          <button aria-label={copy.next} className="providers-carousel__control providers-carousel__control--next" onClick={() => scroll(1)} type="button"><ChevronRight aria-hidden="true" size={24} /></button>
        </div>
      </div>
    </section>
  )
}
