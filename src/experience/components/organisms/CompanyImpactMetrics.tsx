import Button from '../atoms/Button'
import Counter from '../atoms/Counter'
import { resolveCTA, text, type CTAContent } from '../shared'
import type { ExperienceComponentProps } from '@/experience/registry/componentRegistry'

type ImpactMetric = { closing?: string; description?: string; details?: string; highlight?: string; label?: string; presentation?: 'standard' | 'service-results'; prefix?: string; suffix?: string; title?: string; value?: number }

export default function CompanyImpactMetrics({ content, settings, locale, site }: ExperienceComponentProps) {
  const p = { ...settings, ...content }
  const metrics = (Array.isArray(p.metrics) ? p.metrics : []) as ImpactMetric[]
  const isWhyBestDoctorsMetricSet = metrics.length === 3
    && [104, 18, 28000].every((value) => metrics.some((metric) => metric.value === value))
  const whyBestDoctors = p.variant === 'why-best-doctors' || isWhyBestDoctorsMetricSet
  const financialPresentation = p.financialPresentation === true
  const cta = resolveCTA(p.cta as CTAContent | undefined, locale, site)
  const isFinancialStatementsCTA = cta?.label === 'See our financial statements'
    && typeof cta.href === 'string'
    && /(?:^|\/)financial-information(?:[/?#]|$)/.test(cta.href)

  return (
    <section aria-label={financialPresentation ? (locale === 'es' ? 'Resultados financieros' : locale === 'pt' ? 'Resultados financeiros' : 'Financial results') : undefined} className={`company-impact${whyBestDoctors ? ' company-impact--why-best-doctors' : ''}${financialPresentation ? ' company-impact--financial-performance' : ''}${p.animateNumbers === false ? '' : ' company-impact--animated'}`} role={financialPresentation ? 'group' : undefined}>
      <div className="section-container company-impact__inner">
        <div className="company-impact__grid">
          {metrics.map((metric, index) => {
            const metricLabel = text(metric.label).trim()
            const localizedSpeed = whyBestDoctors && index === 1
              ? /^(más rápido|mais rápido)\s+(.+)$/i.exec(text(metric.title).trim())
              : null
            return <article className={`company-impact__metric${metric.presentation === 'service-results' ? ' company-impact__metric--service-results' : ''}`} key={`${metric.label}-${index}`}>
              {whyBestDoctors && metricLabel ? <span className="company-impact__label">{metricLabel}</span> : null}
              {metric.presentation === 'service-results' ? <>
                <p className="company-impact__service-intro">{text(metric.title)}</p>
                <strong className="company-impact__service-highlight">{text(metric.highlight)}</strong>
                <h3 className="company-impact__service-closing">{text(metric.closing)}</h3>
                <ul className="company-impact__service-details">{text(metric.details).split(/\r?\n/).filter(Boolean).map((detail) => <li key={detail}>{detail}</li>)}</ul>
              </> : whyBestDoctors ? <>
                <div className="company-impact__value">
                  {metric.prefix ? <span className="company-impact__prefix">{metric.prefix}</span> : null}
                  <span className="company-impact__number"><Counter animate={p.animateNumbers !== false} decimals={0} locale={locale === 'es' ? 'es-ES' : locale === 'pt' ? 'pt-BR' : 'en-US'} suffix={text(metric.suffix)} value={typeof metric.value === 'number' ? metric.value : 0} /></span>
                </div>
                <strong>{localizedSpeed?.[1] ?? text(metric.title)}</strong>
                <p>{localizedSpeed?.[2] ?? text(metric.description)}</p>
              </> : <>
                <div className="company-impact__number"><Counter animate={p.animateNumbers !== false} decimals={text(metric.prefix).startsWith('US$') ? 1 : 0} prefix={text(metric.prefix)} suffix={text(metric.suffix)} value={typeof metric.value === 'number' ? metric.value : 0} /></div>
                <strong>{text(metric.label)}</strong>
                <h3>{text(metric.title)}</h3>
                <p>{text(metric.description)}</p>
              </>}
            </article>
          })}
        </div>
        {cta ? <Button className="company-impact__cta" href={cta.href} icon={cta.showIcon ? cta.icon || 'chevron-right' : undefined} iconPosition={cta.iconPosition ?? 'right'} label={cta.label} target={cta.target} variant={cta.variant ?? (isFinancialStatementsCTA ? 'primary' : 'secondary')} /> : null}
      </div>
    </section>
  )
}
