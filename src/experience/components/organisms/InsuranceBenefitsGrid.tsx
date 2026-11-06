import type { ExperienceComponentProps } from '@/experience/registry/componentRegistry'
import Image from 'next/image'
import { asMediaAlt, asMediaDimension, asMediaOptimizerURL, asMediaURL, readButtonCTA, text } from '../shared'
import CTAButton from '../molecules/CTAButton'

type InsuranceBenefit = {
  description?: string
  icon?: unknown
  iconAlt?: string
  iconUrl?: string
  title?: string
}

export default function InsuranceBenefitsGrid({ content, settings, locale, site }: ExperienceComponentProps) {
  const p = { ...settings, ...content }
  const benefits = (Array.isArray(p.benefits) ? p.benefits : []) as InsuranceBenefit[]
  const cta = readButtonCTA(p, {}, { icon: 'chevron-right', variant: 'primary' })

  return (
    <section className={`insurance-benefits${p.animate === false ? '' : ' insurance-benefits--animated'}`}>
      <div className="section-container insurance-benefits__inner">
        <div className="insurance-benefits__grid">
          {benefits.map((benefit, index) => {
            const icon = asMediaURL(benefit.icon) || text(benefit.iconUrl)
            return (
              <article className="insurance-benefits__item" data-editor-field="benefits" data-editor-index={index} key={`${benefit.title}-${index}`}>
                {icon ? <Image alt={asMediaAlt(benefit.icon, text(benefit.iconAlt))} className="insurance-benefits__icon" data-editor-field="benefits" data-editor-index={index} height={asMediaDimension(benefit.icon, 'height') ?? 128} loading="lazy" sizes="(max-width: 600px) 4.5rem, 5.5rem" src={asMediaOptimizerURL(icon)} width={asMediaDimension(benefit.icon, 'width') ?? 128} /> : null}
                <div>
                  <h3 data-editor-field="benefits" data-editor-index={index}>{text(benefit.title)}</h3>
                  <p data-editor-field="benefits" data-editor-index={index}>{text(benefit.description)}</p>
                </div>
              </article>
            )
          })}
        </div>
        <span data-editor-field={p.cta ? 'cta' : 'buttonLabel'}><CTAButton className="insurance-benefits__cta" cta={cta} locale={locale} site={site} /></span>
      </div>
    </section>
  )
}
