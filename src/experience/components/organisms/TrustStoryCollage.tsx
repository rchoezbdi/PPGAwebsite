import type { ExperienceComponentProps } from '@/experience/registry/componentRegistry'
import { asMediaAlt, asMediaURL, text } from '../shared'

const source = (media: unknown, fallback: unknown) => asMediaURL(media) || text(fallback)

export default function TrustStoryCollage({ content, settings }: ExperienceComponentProps) {
  const p = { ...settings, ...content }
  const primaryImage = source(p.primaryImage, p.primaryImageUrl)
  const secondaryImage = source(p.secondaryImage, p.secondaryImageUrl)
  const tertiaryImage = source(p.tertiaryImage, p.tertiaryImageUrl)
  const decoration = source(p.decoration, p.decorationUrl)

  return (
    <section className={`trust-story${p.animate === false ? '' : ' trust-story--animated'}`}>
      <div className="section-container trust-story__inner">
        <div className="trust-story__collage">
          {primaryImage ? <img alt={asMediaAlt(p.primaryImage, text(p.primaryImageAlt))} className="trust-story__image trust-story__image--primary" loading="lazy" src={primaryImage} /> : null}
          {secondaryImage ? <img alt={asMediaAlt(p.secondaryImage, text(p.secondaryImageAlt))} className="trust-story__image" loading="lazy" src={secondaryImage} /> : null}
          {tertiaryImage ? <img alt={asMediaAlt(p.tertiaryImage, text(p.tertiaryImageAlt))} className="trust-story__image" loading="lazy" src={tertiaryImage} /> : null}
          {decoration ? <img alt="" aria-hidden="true" className="trust-story__decoration" loading="lazy" src={decoration} /> : null}
        </div>
        <div className="trust-story__copy">
          <h2>{text(p.heading)}</h2>
          <p className="trust-story__highlight">{text(p.highlight)}</p>
          <p className="trust-story__description">{text(p.description)}</p>
        </div>
      </div>
    </section>
  )
}
