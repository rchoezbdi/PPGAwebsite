'use client'

import { useState } from 'react'
import { asMediaAlt, asMediaURL, readButtonCTA, text, type CTAContent } from '../shared'
import type { ExperienceComponentProps } from '@/experience/registry/componentRegistry'
import CTAButton from '../molecules/CTAButton'
import { planComparisonSelection } from '@/lib/planComparisonSelection'

type Plan = { code?: string; name?: string; planTier?: string; image?: unknown; imageAlt?: string; imageUrl?: string; detailsHref?: string; detailsCTA?: CTAContent }
type Row = { label?: string; note?: string; values?: Record<string, string | string[] | undefined> }
type Category = { heading?: string; rows?: Row[] }

const labelsByLocale = {
  en: { choosePlans: 'Choose plans to compare', plan: 'Plan', contact: 'Contact us', details: 'Details' },
  es: { choosePlans: 'Elige planes para comparar', plan: 'Plan', contact: 'Contáctanos', details: 'Detalles' },
  pt: { choosePlans: 'Escolha planos para comparar', plan: 'Plano', contact: 'Fale conosco', details: 'Ver detalhes' },
}

const renderValue = (value: string | string[] | undefined) => {
  if (!value) return <span className="plan-comparison__empty">—</span>
  if (Array.isArray(value)) {
    return (
      <ul className="plan-comparison__cell-list">
        {value.map((line, i) => <li key={i}>{line}</li>)}
      </ul>
    )
  }
  const lines = value.split(/\r?\n/)
  if (lines.length > 1) {
    return (
      <span className="plan-comparison__cell-lines">
        {lines.map((line, i) => <span key={i}>{line}</span>)}
      </span>
    )
  }
  return (
    <span>{value}</span>
  )
}

/**
 * Real plan×benefit comparison matrix (up to 3 plans side by side, chosen from `plans[]` via 3
 * selects), matching production's own comparison tool. `content` shape/data is already fully
 * populated in the `components`/`page-components` rows (see catalog.ts for the mirrored
 * contract) — this organism is purely the renderer, built once real values existed to render.
 */
export default function PlanComparisonSection({ content, settings, locale, site }: ExperienceComponentProps) {
  const p = { ...settings, ...content }
  const labels = labelsByLocale[locale as keyof typeof labelsByLocale] ?? labelsByLocale.en
  const plans = (Array.isArray(p.plans) ? p.plans : []) as Plan[]
  const categories = (Array.isArray(p.categories) ? p.categories : []) as Category[]
  // Governed buttons: each reads its `cta` group, falling back to the legacy flat fields and i18n labels.
  const contactCTA = readButtonCTA(p, { cta: 'contactCTA' }, { label: labels.contact, variant: 'primary', showIcon: false, linkType: 'internal', url: text(p.contactHref) || '/home/support' })
  const detailsCTA = (plan: Plan) => readButtonCTA(plan as Record<string, unknown>, { cta: 'detailsCTA' }, { label: labels.details, variant: 'outline', icon: 'chevron-right', showIcon: true, linkType: 'internal', url: plan.detailsHref })
  const compareTableCTA = readButtonCTA(p, { cta: 'compareTableCTA' }, { label: text(p.compareTableLabel) || 'Download full comparison table', variant: 'outline', icon: 'download', showIcon: true, linkType: 'external', url: text(p.compareTableUrl) })

  const [chosen, setChosen] = useState<string[]>([])
  const selection = planComparisonSelection(plans, chosen.length ? chosen : p.defaultSelection)

  const planByCode = (code: string) => plans.find((pl) => pl.code === code)
  const setSlot = (index: number, code: string) => setChosen(selection.map((current, i) => i === index ? code : current))

  return (
    <section className="section plan-comparison">
      <div className="section-container">
        {text(p.heading) ? <h2>{text(p.heading)}</h2> : null}
        {text(p.description) ? <p className="plan-comparison__description">{text(p.description)}</p> : null}

        {(text(p.compareHeadingDesktop) || text(p.compareHeadingMobile)) ? (
          <h2 className="plan-comparison__compare-heading">
            <span className="plan-comparison__compare-heading--desktop">
              {text(p.compareHeadingDesktop)}{text(p.compareHeadingHighlight) ? <> <mark>{text(p.compareHeadingHighlight)}</mark></> : null}
            </span>
            <span className="plan-comparison__compare-heading--mobile">
              {text(p.compareHeadingMobile) || text(p.compareHeadingDesktop)}{text(p.compareHeadingHighlight) ? <> <mark>{text(p.compareHeadingHighlight)}</mark></> : null}
            </span>
          </h2>
        ) : null}

        <div className="plan-comparison__cards">
          {selection.map((code, i) => {
            const plan = planByCode(code)
            const image = asMediaURL(plan?.image) || text(plan?.imageUrl)
            if (!plan) return null
            return (
              <article className="plan-comparison__card" key={`card-${i}`}>
                {image ? <img alt={text(plan.imageAlt) || asMediaAlt(plan.image, text(plan.name))} className="plan-comparison__card-image" loading="lazy" src={image} /> : null}
                <div className="plan-comparison__card-actions">
                  <CTAButton cta={contactCTA} defaultVariant="primary" locale={locale} site={site} size="sm" />
                  <CTAButton cta={detailsCTA(plan)} defaultVariant="outline" locale={locale} site={site} size="sm" />
                </div>
              </article>
            )
          })}
        </div>

        <div aria-label={labels.choosePlans} className="plan-comparison__selectors" role="group">
          {selection.map((code, i) => (
            <select
              aria-label={`${labels.plan} ${i + 1}`}
              className="plan-comparison__select"
              key={`select-${i}`}
              onChange={(e) => setSlot(i, e.target.value)}
              value={code}
            >
              {plans.filter((candidate) => candidate.code === code || !selection.includes(candidate.code ?? '')).map((candidate) => (
                <option key={candidate.code} value={candidate.code}>{text(candidate.name)}{candidate.planTier === 'pro' && !/pro$/i.test(text(candidate.name)) ? ' Pro' : ''}</option>
              ))}
            </select>
          ))}
        </div>

        {categories.map((category, ci) => (
          <div className="plan-comparison__category" key={ci}>
            <h3>{text(category.heading)}</h3>
            <div className="plan-comparison__matrix">
              {(category.rows ?? []).map((row, ri) => (
                <div className="plan-comparison__row" key={ri}>
                  <div className="plan-comparison__row-label">{text(row.label)}{text(row.note) ? <small className="plan-comparison__row-note">{text(row.note)}</small> : null}</div>
                  {selection.map((code, i) => (
                    <div className={`plan-comparison__cell${i === 0 ? ' plan-comparison__cell--primary' : ''}`} key={i}>
                      {renderValue(row.values?.[code])}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        ))}

        {compareTableCTA?.url || compareTableCTA?.page || compareTableCTA?.email || compareTableCTA?.phone || compareTableCTA?.modalKey ? (
          <div className="plan-comparison__download">
            <CTAButton cta={compareTableCTA} defaultIcon="download" defaultVariant="outline" locale={locale} site={site} />
          </div>
        ) : null}
      </div>
    </section>
  )
}
