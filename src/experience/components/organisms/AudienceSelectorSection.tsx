import AudienceCard from '../molecules/AudienceCard'
import SectionHeading from '../molecules/SectionHeading'
import { asMediaURL, designTextColor, text, type CTAContent } from '../shared'
import type { ExperienceComponentProps } from '@/experience/registry/componentRegistry'

type Audience = { cta?: CTAContent; description?: string; image?: unknown; imageAlt?: string; mobileImage?: unknown; subtitle?: string; title?: string }

/** Fixes the bug found in the audit: the old GridComponent read `cards ?? features ?? actions`
 * and never `audiences`, so real AudienceSelector content silently rendered empty. */
export default function AudienceSelectorSection({ content, settings, locale, site }: ExperienceComponentProps) {
  const p = { ...settings, ...content }
  const items = (p.audiences ?? []) as Audience[]
  const background = text(p.background)

  return (
    <section className={`section${background && background !== 'white' ? ` section--${background}` : ''} audience-selector-section`}>
      <div className="section-container">
        <SectionHeading description={text(p.description)} descriptionColor={designTextColor(p.descriptionColor)} highlight={text(p.headingHighlight)} highlightColor={designTextColor(p.headingHighlightColor)} title={text(p.heading)} titleColor={designTextColor(p.headingColor)} />
        <div className="audience-grid">
          {items.map((item, index) => (
            <AudienceCard cta={item.cta} description={item.description ?? item.subtitle} imageAlt={item.imageAlt} imageMedia={item.image} key={index} locale={locale} media={asMediaURL(item.image)} mobileMedia={asMediaURL(item.mobileImage)} site={site} title={item.title} />
          ))}
        </div>
      </div>
    </section>
  )
}
