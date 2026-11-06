import CTAButton from './CTAButton'
import type { CTAContent } from '../shared'
import type { ExperienceSite } from '@/experience/registry/componentRegistry'
import Heading from '../atoms/Heading'
import Media from '../atoms/Media'
import Text from '../atoms/Text'

export default function TestimonialCard({ author, carousel = false, clone = false, cta, image, imageAlt, locale = 'en', quote, role, site, slideIndex, title }: {
  author?: string
  carousel?: boolean
  clone?: boolean
  cta?: CTAContent | null
  image?: string
  imageAlt?: string
  locale?: string
  quote?: string
  role?: string
  site?: ExperienceSite
  slideIndex?: number
  title?: string
}) {
  if (!quote && !author) return null

  const content = <>
    {title ? <Heading level="h3" size="sm">{title}</Heading> : null}
    <Text className="testimonial-card__quote">{quote ? (/^[“\"]/.test(quote) ? quote : `“${quote}”`) : ''}</Text>
    {author ? (
      <footer className="testimonial-card__author">
        <strong>{author}</strong>
        {role ? <span>{role}</span> : null}
      </footer>
    ) : null}
    <CTAButton className="testimonial-card__link" cta={cta} defaultIcon="play" defaultVariant="outline" locale={locale} site={site} />
  </>

  return (
    <article aria-hidden={clone || undefined} className={`testimonial-card${carousel ? ' testimonial-card--carousel' : ''}${clone ? ' testimonial-card--clone' : ''}`} data-testimonial-index={slideIndex} inert={clone || undefined}>
      {image ? <Media alt={imageAlt} className="testimonial-card__media" src={image} /> : null}
      {carousel ? <div className="testimonial-card__overlay">{content}</div> : content}
    </article>
  )
}
