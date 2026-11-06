import FeatureCard from '../molecules/FeatureCard'
import SectionHeading from '../molecules/SectionHeading'
import Button from '../atoms/Button'
import Icon from '../atoms/Icon'
import Media from '../atoms/Media'
import CTAButton from '../molecules/CTAButton'
import ServiceTabsSection from './ServiceTabsSection'
import { asMediaURL, designTextColor, resolveCTA, text, type CTAContent } from '../shared'
import type { ExperienceComponentProps } from '@/experience/registry/componentRegistry'
import { resolveExperienceLink } from '@/experience/navigation/resolver'

type Feature = { customIcon?: unknown; description?: string; heading?: string; headingHighlight?: string; headingHighlightColor?: string; iconName?: string; image?: unknown; imageAlt?: string; imageUrl?: string; eyebrow?: string; url?: string; page?: unknown; linkType?: 'internal' | 'external' | 'none'; link?: CTAContent; linkButton?: boolean; linkLabel?: string; openInNewWindow?: boolean; show?: boolean }

export default function FeaturesSection({ content, locale, settings, site }: ExperienceComponentProps) {
  const p = { ...settings, ...content }
  const items = ((p.features ?? []) as Feature[]).filter((item) => item.show !== false)
  const background = text(p.background)
  const alignment = text(p.alignment) === 'center' ? 'center' : 'left'
  const cols = text(p.columns) || ''
  const variant = text(p.variant) || 'default'
  const isFinancialPriorities = p.financialPriorities === true
  const isPortuguesePriorities = isFinancialPriorities && locale === 'pt'
  const sectionHeading = text(p.heading).trim()
  const localizedFinancialHeadings: Record<string, { title: string; highlight: string }> = {
    'sólida base financiera en la que puedes confiar': { title: 'Sólida base financiera en la que', highlight: 'puedes confiar' },
    'base financeira sólida em que você pode confiar': { title: 'Base financeira sólida em que', highlight: 'você pode confiar' },
  }
  const localizedFinancialHeading = localizedFinancialHeadings[sectionHeading.toLowerCase()]
  const englishFinancialHeading = sectionHeading.match(/^a solid financial foundation( you can trust)?$/i)
  const isFinancialFoundation = Boolean(localizedFinancialHeading || englishFinancialHeading)
  const financialHeadingHighlight = text(p.headingHighlight) || localizedFinancialHeading?.highlight || (englishFinancialHeading?.[1] ? 'you can trust' : '')
  const financialHeadingTitle = localizedFinancialHeading?.title
    ?? (englishFinancialHeading?.[1] ? sectionHeading.slice(0, -' you can trust'.length) : sectionHeading)
  const whoWeAreHeading = `${sectionHeading.toLowerCase()}|${text(p.headingHighlight).trim().toLowerCase()}`
  const isWhoWeAreHeading = [
    'our purpose and|philosophy',
    'nuestro propósito y|filosofía',
    'nosso propósito e|filosofia',
  ].includes(whoWeAreHeading)
  const primaryCTA = p.primaryCTA as CTAContent | undefined
  const criticalCTA = resolveCTA(primaryCTA, locale, site)
  const criticalDocumentURL = asMediaURL(p.document)
  const criticalIconMedia = asMediaURL(p.customIcon)
  const corporateTopMedia = asMediaURL(p.topMedia)
  const uniqueServices = items.length === 4 && /^(unique services|servicios exclusivos|serviços exclusivos)$/i.test(text(p.heading).trim())
  const careersValuesCopy = {
    en: { title: 'The values that guide', highlight: 'how we work' },
    es: { title: 'Los valores que definen', highlight: 'nuestro trabajo' },
    pt: { title: 'Os valores que orientam', highlight: 'como atuamos' },
  } as const
  const careersValues = careersValuesCopy[locale as keyof typeof careersValuesCopy]
  const isCareersValues = Boolean(careersValues && /^(the values that guide how we work|los valores que definen nuestro trabajo|os valores que orientam como atuamos)$/i.test(text(p.heading).trim()))

  if (uniqueServices) {
    const serviceIcons = ['life-buoy', 'phone-forwarded', 'hospital', 'heart-pulse']
    return <section className="section unique-services-section">
      <div className="section-container">
        <SectionHeading align="center" title={text(p.heading)} />
        <div className="unique-services-section__grid">
          {items.map((item, index) => (
            <article className={`unique-services-section__item${index === 0 ? ' unique-services-section__item--featured' : ''}`} key={index}>
              <span aria-hidden="true" className="unique-services-section__icon"><Icon name={serviceIcons[index] ?? 'circle-help'} size={40} /></span>
              <div className="unique-services-section__copy">
                <h3>{text(item.heading)}</h3>
                <p>{text(item.description)}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  }

  if (variant === 'service-tabs') return <ServiceTabsSection description={text(p.description)} heading={text(p.heading)} highlight={text(p.headingHighlight)} services={items} />

  if (variant === 'corporate-group') return <section className="corporate-group-section" id={text(p.anchorId) === 'corporate-group' ? 'corporate-group' : undefined}>
    <div aria-hidden="true" className="corporate-group-section__top-curve" style={corporateTopMedia ? { backgroundImage: `url("${corporateTopMedia}")` } : undefined}>
      <svg viewBox="0 0 1000 100" preserveAspectRatio="none"><path d="M0 20C250 100 750 100 1000 20V100H0Z" /></svg>
    </div>
    <div className="section-container corporate-group-section__inner">
      <header className="corporate-group-section__heading">
        <h2>{text(p.heading)} <mark style={designTextColor(p.headingHighlightColor) ? { color: designTextColor(p.headingHighlightColor) } : undefined}>{text(p.headingHighlight)}</mark></h2>
      </header>
      <p className="corporate-group-section__description">{text(p.description)}</p>
      <div className="corporate-group-section__features">
        {items.map((item, index) => <article key={index}><h3>{text(item.heading)}</h3><p>{text(item.description)}</p></article>)}
      </div>
      {criticalCTA ? <div className="corporate-group-section__action"><CTAButton ariaLabel={`${criticalCTA.label} sobre ${[text(p.heading), text(p.headingHighlight)].filter(Boolean).join(' ')}`} cta={primaryCTA} locale={locale} site={site} /></div> : null}
      {(text(p.legalNotice) || text(p.eligibilityNotice)) ? <footer className="corporate-group-section__legal">
        {text(p.legalNotice) ? <p>{text(p.legalNotice)}</p> : null}
        {text(p.eligibilityNotice) ? <p>{text(p.eligibilityNotice)}</p> : null}
      </footer> : null}
    </div>
  </section>

  if (variant === 'key-benefits') return <section className="section key-benefits-section">
    <div className="section-container">
      <header><h2>{text(p.heading)} {text(p.headingHighlight) ? <mark style={designTextColor(p.headingHighlightColor) ? { color: designTextColor(p.headingHighlightColor) } : undefined}>{text(p.headingHighlight)}</mark> : null}</h2><p>{text(p.description)}</p></header>
      <div className="key-benefits-section__grid">{items.map((item, index) => <article key={index}><h3>{text(item.heading)}</h3><p>{text(item.description)}</p></article>)}</div>
    </div>
  </section>

  if (variant === 'critical-select') return <section className="section critical-select-section">
    <div className="section-container">
      <h2>{text(p.eyebrow)}</h2>
      <div className="critical-select-section__panel">
        <div className="critical-select-section__intro">
          <div className="critical-select-section__title">{criticalIconMedia ? <Media alt="" className="critical-select-section__icon-image" objectFit="contain" src={criticalIconMedia} /> : <Icon name={text(p.iconName) || 'badge-check'} size={38} />}<div><h3>{text(p.heading)}</h3><p>{text(p.supportingText)}</p></div></div>
          <p className="critical-select-section__description">{text(p.description)}</p>
          <div className="critical-select-section__action">{criticalCTA ? <Button href={criticalDocumentURL || criticalCTA.href} icon={criticalCTA.showIcon ? criticalCTA.icon || 'external-link' : undefined} label={criticalCTA.label} target={criticalDocumentURL ? '_blank' : criticalCTA.target} variant={criticalCTA.variant ?? 'primary'} /> : null}<em>{text(p.footerText)}</em></div>
        </div>
        <ul className="critical-select-section__benefits">{items.map((item, index) => <li key={index}>{text(item.description)}</li>)}</ul>
      </div>
    </div>
  </section>

  return (
    <section className={`section${background && background !== 'white' ? ` section--${background}` : ''} features-section features-section--${variant}${isFinancialPriorities ? ' features-section--financial-priorities' : ''}${variant === 'first-aid-kit' ? ` features-section--first-aid-kit-count-${items.length}` : ''}${isCareersValues ? ' features-section--careers-values' : ''}${isFinancialFoundation ? ' features-section--financial-foundation' : ''}${isWhoWeAreHeading ? ' features-section--who-we-are' : ''}${cols ? ` features-section--cols-${cols}` : ''}`} data-columns={cols || undefined}>
      <div className="section-container">
        <SectionHeading align={isCareersValues || isFinancialFoundation || isWhoWeAreHeading || isFinancialPriorities ? 'center' : alignment} description={isPortuguesePriorities ? text(p.heading) : text(p.description)} descriptionColor={designTextColor(p.descriptionColor)} eyebrow={isPortuguesePriorities ? '' : text(p.eyebrow)} highlight={isPortuguesePriorities ? text(p.eyebrow).split(/\s+/).slice(-2).join(' ') : isCareersValues ? careersValues.highlight : isFinancialFoundation ? financialHeadingHighlight : text(p.headingHighlight)} highlightColor={designTextColor(p.headingHighlightColor)} title={isPortuguesePriorities ? text(p.eyebrow).split(/\s+/).slice(0, -2).join(' ') : isCareersValues ? careersValues.title : isFinancialFoundation ? financialHeadingTitle : text(p.heading)} titleColor={designTextColor(p.headingColor)} />
        <div className="grid">
          {items.map((item, index) => (
            (() => {
              const button = resolveCTA(item.link, locale, site)
              const legacyHref = resolveExperienceLink({ linkType: item.linkType, page: item.page as Parameters<typeof resolveExperienceLink>[0]['page'], url: item.url, locale, fallbackSite: site.slug, localizedRoutes: site.localizedRoutes }).href
              return <FeatureCard alignment={alignment} buttonIcon={button?.showIcon ? button.icon || 'chevron-right' : undefined} buttonIconPosition={button?.iconPosition ?? 'right'} buttonVariant={button?.variant ?? 'outline'} description={item.description} eyebrow={item.eyebrow} href={item.link?.showButton === false ? undefined : button?.href ?? legacyHref ?? undefined} icon={item.iconName} imageAlt={text(item.imageAlt)} imageOverlay={isFinancialFoundation} key={index} linkButton={Boolean(button) || item.linkButton} linkLabel={button?.label || item.linkLabel} media={asMediaURL(item.image) || text(item.imageUrl) || asMediaURL(item.customIcon)} mediaRecord={item.image} openInNewWindow={isFinancialFoundation || button?.newWindow || item.openInNewWindow} panelSide={index % 2 ? 'right' : 'left'} title={item.heading} titleHighlight={item.headingHighlight} titleHighlightColor={designTextColor(item.headingHighlightColor)} />
            })()
          ))}
        </div>
      </div>
    </section>
  )
}
