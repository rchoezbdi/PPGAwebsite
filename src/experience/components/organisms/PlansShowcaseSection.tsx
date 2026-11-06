'use client'

import { useRef } from 'react'
import { asMediaAlt, asMediaDimension, asMediaSrcSet, asMediaURL, designTextColor, resolveCTA, text, type CTAContent } from '../shared'
import type { ExperienceComponentProps } from '@/experience/registry/componentRegistry'
import Button from '../atoms/Button'
import ProductDocumentsList, { type ProductDocumentRef } from '../molecules/ProductDocumentsList'

type Benefit = { text?: string }
type Plan = {
  availabilityLabel?: string
  benefits?: Benefit[]
  countryCode?: string
  documents?: ProductDocumentRef[]
  image?: unknown
  imageAlt?: string
  imageUrl?: string
  name?: string
  planTier?: string
  planCode?: string
  primaryCTA?: CTAContent
  shortDescription?: string
}

const COUNTRY_NAMES: Record<string, string> = { BR: 'Brazil', CL: 'Chile' }

export default function PlansShowcaseSection({ content, settings, locale, site }: ExperienceComponentProps) {
  const p = { ...settings, ...content }
  const plans = (Array.isArray(p.plans) ? p.plans : []) as Plan[]
  const background = text(p.background) || 'primary'
  const anchorId = text(p.anchorId) === 'individual-plans' ? 'individual-plans' : undefined
  const track = useRef<HTMLDivElement>(null)
  const compareCTA = resolveCTA(p.compareCTA as CTAContent | undefined, locale, site)
  const helpIcon = asMediaURL(p.helpIcon) || text(p.helpIconUrl)
  const move = (direction: -1 | 1) => track.current?.scrollBy({ left: direction * (track.current.clientWidth * .82), behavior: 'smooth' })
  const detailPlan = plans.length === 1 ? plans[0] : undefined

  return (
    <section className={`plans-showcase plans-showcase--${background}${detailPlan ? ' plans-showcase--detail' : ''}`} id={anchorId}>
      {!detailPlan ? <div aria-hidden="true" className="plans-showcase__wave">
        <svg preserveAspectRatio="none" viewBox="0 0 1440 190">
          <path d="M0 0H1440V38Q720 135 0 38Z" style={{ fill: 'var(--surface)' }} />
          <path d="M0 38Q720 135 1440 38V85Q720 180 0 85Z" style={{ fill: 'color-mix(in srgb, var(--brand-bright) 12%, var(--surface))' }} />
          <path d="M0 85Q720 180 1440 85V190H0Z" fill="currentColor" />
        </svg>
      </div> : null}
      <div className="section-container plans-showcase__inner">
        <header className="plans-showcase__heading">
          <h2 style={designTextColor(p.headingColor) ? { color: designTextColor(p.headingColor) } : undefined}>{detailPlan ? <>{text(p.heading).trim()} <strong style={designTextColor(p.headingHighlightColor) ? { color: designTextColor(p.headingHighlightColor) } : undefined}>{text(p.headingHighlight).trim()}</strong></> : <><span>{text(p.heading) || 'Explore our'}</span><strong style={designTextColor(p.headingHighlightColor) ? { color: designTextColor(p.headingHighlightColor) } : undefined}>{text(p.headingHighlight) || 'most popular plans'}</strong></>}</h2>
        </header>
        {detailPlan ? <div className="plans-showcase__detail">
          <p className="plans-showcase__detail-description">{text(p.description) || text(detailPlan.shortDescription)}</p>
          {detailPlan.documents?.length ? <ProductDocumentsList appSlug={site.slug} documents={detailPlan.documents} locale={locale} planCode={detailPlan.planCode} variant="detail" /> : null}
        </div> : <div className="plans-showcase__carousel">
          <button aria-label={text(p.previousLabel) || 'Previous plans'} className="plans-showcase__arrow plans-showcase__arrow--previous" onClick={() => move(-1)} type="button">‹</button>
          <div className="plans-showcase__track" ref={track}>
            {plans.map((plan, index) => {
              const image = asMediaURL(plan.image) || text(plan.imageUrl)
              const cta = resolveCTA(plan.primaryCTA, locale, site)
              const planName = text(plan.name)
              // The editor's text governs the button; `{plan}` is replaced with the product name.
              const ctaLabel = cta?.label.replace(/\{plan\}/gi, planName).trim()
              const countryCode = text(plan.countryCode).toUpperCase()
              const availabilityLabel = text(plan.availabilityLabel)
              return (
                <article className="plans-showcase__card" key={`${plan.name}-${index}`}>
                  {image ? <img alt={asMediaAlt(plan.image, text(plan.imageAlt))} className="plans-showcase__image" height={asMediaDimension(plan.image, 'height')} loading="lazy" sizes="(max-width: 600px) 88vw, (max-width: 900px) 48vw, 25rem" src={image} srcSet={asMediaSrcSet(plan.image)} width={asMediaDimension(plan.image, 'width')} /> : null}
                  <div className="plans-showcase__content">
                    <h3>{plan.planTier === 'pro' ? planName.replace(/\s+pro$/i, '') : planName}{p.showProLabel === false || plan.planTier === 'standard' ? null : <> <strong>{text(p.proLabel) || 'Pro'}</strong></>}</h3>
                    {countryCode || availabilityLabel ? <p className="plans-showcase__availability">
                      {countryCode ? <img alt={COUNTRY_NAMES[countryCode] || countryCode} height="14" src={`/flags/4x3/${countryCode.toLowerCase()}.svg`} width="20" /> : null}
                      {availabilityLabel ? <span>{availabilityLabel}</span> : null}
                    </p> : null}
                    <p className="plans-showcase__description">{text(plan.shortDescription)}</p>
                    <h4>{text(p.highlightsLabel) || 'Highlights'}</h4>
                    <ul>{(plan.benefits ?? []).map((benefit, benefitIndex) => <li key={benefitIndex}>{text(benefit.text)}</li>)}</ul>
                    {cta ? <Button ariaLabel={ctaLabel} className="plans-showcase__details" href={cta.href} icon={cta.showIcon ? cta.icon || 'chevron-right' : undefined} iconPosition={cta.iconPosition ?? 'right'} label={ctaLabel} size="sm" target={cta.target} variant={cta.variant ?? 'primary'} /> : null}
                  </div>
                </article>
              )
            })}
          </div>
          <button aria-label={text(p.nextLabel) || 'Next plans'} className="plans-showcase__arrow plans-showcase__arrow--next" onClick={() => move(1)} type="button">›</button>
        </div>}
        {!detailPlan && p.showHelp !== false && (text(p.helpHeading) || compareCTA) ? <aside className="plans-showcase__help">
          {helpIcon ? <img alt="" loading="lazy" src={helpIcon} /> : null}
          <div><h3>{text(p.helpHeading)}</h3>{compareCTA ? <Button href={compareCTA.href} icon={compareCTA.showIcon ? compareCTA.icon || 'chevron-right' : undefined} iconPosition={compareCTA.iconPosition ?? 'right'} label={compareCTA.label} target={compareCTA.target} variant={compareCTA.variant ?? 'primary'} /> : null}</div>
        </aside> : null}
      </div>
    </section>
  )
}
