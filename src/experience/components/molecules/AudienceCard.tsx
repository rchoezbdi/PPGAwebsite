import Heading from '../atoms/Heading'
import Media from '../atoms/Media'
import Text from '../atoms/Text'
import CTAButton from './CTAButton'
import { asMediaAlt, type CTAContent } from '../shared'
import type { ExperienceSite } from '@/experience/registry/componentRegistry'

/** Generic by design — the component has no idea whether it's rendering "Individual" or
 * "Corporate"; that's purely editorial `title`/`description`/`media` content. */
export default function AudienceCard({ cta, description, imageAlt, imageMedia, locale, media, mobileMedia, site, title }: {
  cta?: CTAContent | null
  description?: string
  imageAlt?: string
  imageMedia?: unknown
  locale: string
  media?: string
  mobileMedia?: string
  site?: ExperienceSite
  title?: string
}) {
  if (!title) return null
  return (
    <article className="audience-card">
      <Media alt={imageAlt || asMediaAlt(imageMedia) || title} className="audience-card__media" mobileSrc={mobileMedia} src={media} />
      <div className="audience-card__content">
        <Heading level="h3">{title}</Heading>
        <Text tone="muted">{description}</Text>
        <CTAButton cta={cta} defaultIcon="arrow-right" defaultVariant="outline" locale={locale} site={site} />
      </div>
    </article>
  )
}
