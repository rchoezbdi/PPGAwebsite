import Image from 'next/image'
import { resolveExperienceLink } from '@/experience/navigation/resolver'
import type { ExperienceComponentProps } from '@/experience/registry/componentRegistry'
import { asMediaDimension, asMediaOptimizerURL, asMediaURL, text } from '../shared'

type ServiceAction = {
  accent?: string
  label?: string
  linkType?: 'internal' | 'external' | 'none'
  newWindow?: boolean
  page?: unknown
  title?: string
  url?: string
}

export default function ServiceActionGrid({ content, settings, locale, site }: ExperienceComponentProps) {
  const p = { ...settings, ...content }
  const actions = (Array.isArray(p.actions) ? p.actions : []) as ServiceAction[]
  const decoration = asMediaURL(p.decoration) || text(p.decorationUrl)

  return (
    <section className={`service-action-grid${p.animate === false ? '' : ' service-action-grid--animated'}`}>
      <div className="section-container service-action-grid__inner">
        <header className="service-action-grid__heading">
          <h2>{text(p.heading)}</h2>
          {text(p.description) ? <p>{text(p.description)}</p> : null}
        </header>
        <div className="service-action-grid__items">
          {actions.map((action, index) => {
            const link = resolveExperienceLink({
              fallbackSite: site.slug,
              localizedRoutes: site.localizedRoutes,
              linkType: action.linkType ?? 'external',
              locale,
              page: action.page as Parameters<typeof resolveExperienceLink>[0]['page'],
              url: action.url,
            })
            const card = <><strong>{action.accent}</strong><span>{action.label}</span></>
            return link.href
              ? <a className="service-action-grid__card" href={link.href} key={`${action.accent ?? action.title}-${index}`} rel={action.newWindow ? 'noreferrer' : undefined} target={action.newWindow ? '_blank' : undefined}>{card}</a>
              : <div className="service-action-grid__card" key={`${action.accent ?? action.title}-${index}`}>{card}</div>
          })}
        </div>
        {decoration ? <Image alt="" aria-hidden="true" className="service-action-grid__decoration" height={asMediaDimension(p.decoration, 'height') ?? 502} loading="lazy" quality={30} sizes="37.5rem" src={asMediaOptimizerURL(decoration)} width={asMediaDimension(p.decoration, 'width') ?? 600} /> : null}
      </div>
    </section>
  )
}
