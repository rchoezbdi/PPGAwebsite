import Button from '../atoms/Button'
import { mediaQueries } from '@/experience/design-system/breakpoints'
import { asMediaAlt, asMediaURL, designTextColor, resolveCTA, text, type CTAContent } from '../shared'
import type { ExperienceComponentProps } from '@/experience/registry/componentRegistry'

export default function ExperienceCardSection({ content, locale, site }: ExperienceComponentProps) {
  const image = asMediaURL(content.image) || text(content.imageUrl)
  const mobileImage = asMediaURL(content.imageMobile) || text(content.imageMobileUrl)
  const cta = resolveCTA(content.cta as CTAContent | undefined, locale, site)

  return <section className="section experience-card-section">
    <div className="section-container">
      <h2 className="experience-card-section__heading">
        {text(content.heading)}{text(content.headingHighlight) ? <> <mark style={designTextColor(content.headingHighlightColor) ? { color: designTextColor(content.headingHighlightColor) } : undefined}>{text(content.headingHighlight)}</mark></> : null}
      </h2>
      <div className="experience-card-section__visual">
        {image ? <picture>
          {mobileImage ? <source media={mediaQueries.mobile} srcSet={mobileImage} /> : null}
          <img alt={asMediaAlt(content.image, text(content.imageAlt))} className="experience-card-section__image" loading="lazy" src={image} />
        </picture> : null}
        <div className="experience-card-section__card">
          <h3>{text(content.cardHeading)}</h3>
          <p>{text(content.description)}</p>
          {cta ? <Button href={cta.href} icon={cta.showIcon ? cta.icon || 'chevron-right' : undefined} iconPosition={cta.iconPosition ?? 'right'} label={cta.label} target={cta.target} variant={cta.variant ?? 'primary'} /> : null}
        </div>
      </div>
    </div>
  </section>
}
