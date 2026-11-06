import Heading from '../atoms/Heading'
import Text from '../atoms/Text'
import CTAGroup from '../molecules/CTAGroup'
import Media from '../atoms/Media'
import { asMediaURL, designTextColor, text, type CTAContent } from '../shared'
import type { ExperienceComponentProps } from '@/experience/registry/componentRegistry'

/** Was previously implemented as `CTAComponent`, a thin wrapper that forced Hero into a "cta"
 * variant. Rebuilt as its own organism (Heading? + Text? + CTAGroup) so it composes real
 * molecules/atoms instead of piggybacking on an unrelated organism. */
export default function SectionCTA({ content, settings, locale, site }: ExperienceComponentProps) {
  const p = { ...settings, ...content }
  const background = text(p.background) || 'primary'
  const supportHeading = text(p.heading).trim()
  const normalizedSupportHeading = supportHeading.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
  const isWhyBestDoctorsSupport = /^(?:reach out to our friendly customer service team|comunicate con nuestro equipo de atencion al cliente|caso tenha alguma duvida, entre em contato com nossa equipe de atendimento ao cliente)/.test(normalizedSupportHeading)

  if (text(p.variant) === 'testimonial-story') return (
    <section className="section cta-section cta-section--testimonial-story">
      <div className="section-container cta-box">
        <div className="cta-section__story-content">
          <Heading level="h2"><span style={designTextColor(p.headingColor) ? { color: designTextColor(p.headingColor) } : undefined}>{text(p.heading)}</span>{text(p.headingHighlight) ? <> <mark style={designTextColor(p.headingHighlightColor) ? { color: designTextColor(p.headingHighlightColor) } : undefined}>{text(p.headingHighlight)}</mark></> : null}</Heading>
          <Text className="section-subtitle">{text(p.description)}</Text>
          <CTAGroup alignment="left" locale={locale} primaryCTA={p.primaryCTA as CTAContent | undefined} site={site} />
        </div>
        <div className="cta-section__story-image">
          <Media alt={text(p.imageAlt) || 'Open book with a blue heart'} src={asMediaURL(p.image) || text(p.imageUrl)} />
        </div>
        {text(p.legalNotice) ? <p className="cta-section__legal-notice">{text(p.legalNotice)}</p> : null}
      </div>
    </section>
  )

  if (text(p.variant) === 'first-aid-help') return (
    <section className="section cta-section cta-section--first-aid-help">
      <div className="section-container cta-box">
        <div className="cta-section__kit-media">
          <Media alt={text(p.imageAlt) || 'Kit, Best Doctors Insurance assistant'} src={asMediaURL(p.image)} />
        </div>
        <div className="cta-section__kit-content">
          <Heading level="h2"><span style={designTextColor(p.headingColor) ? { color: designTextColor(p.headingColor) } : undefined}>{text(p.heading)}</span>{text(p.headingHighlight) ? <> <mark style={designTextColor(p.headingHighlightColor) ? { color: designTextColor(p.headingHighlightColor) } : undefined}>{text(p.headingHighlight)}</mark></> : null}</Heading>
          <Text className="section-subtitle">{text(p.description)}</Text>
          <CTAGroup locale={locale} primaryCTA={p.primaryCTA as CTAContent | undefined} secondaryCTA={p.secondaryCTA as CTAContent | undefined} site={site} />
        </div>
      </div>
    </section>
  )

  return (
    <section className={`section section--${background} cta-section${isWhyBestDoctorsSupport ? ' cta-section--why-best-doctors-support' : ''}`}>
      <div className="section-container cta-box">
        {isWhyBestDoctorsSupport
          ? <Text className="cta-section__support-copy">{text(p.heading)}</Text>
          : <Heading level="h2"><span style={designTextColor(p.headingColor) ? { color: designTextColor(p.headingColor) } : undefined}>{text(p.heading)}</span>{text(p.headingHighlight) ? <> <mark style={designTextColor(p.headingHighlightColor) ? { color: designTextColor(p.headingHighlightColor) } : undefined}>{text(p.headingHighlight)}</mark></> : null}</Heading>}
        {!isWhyBestDoctorsSupport && text(p.description) ? <Text className="section-subtitle">{text(p.description)}</Text> : null}
        <CTAGroup alignment="center" locale={locale} primaryCTA={isWhyBestDoctorsSupport && p.primaryCTA ? {
          ...(p.primaryCTA as CTAContent),
          ...(site?.slug === 'ppga' ? { href: '/ppga/soporte', url: undefined } : {}),
          showIcon: (p.primaryCTA as CTAContent).showIcon ?? true,
          icon: text((p.primaryCTA as CTAContent).icon) || 'chevron-right',
        } : p.primaryCTA as CTAContent | undefined} secondaryCTA={p.secondaryCTA as CTAContent | undefined} site={site} />
      </div>
    </section>
  )
}
