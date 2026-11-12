import React from 'react'
import ClientExperienceComponent from '@/experience/renderer/ClientExperienceComponent'
import ProvidersCarousel from '@/experience/components/organisms/ProvidersCarousel'
import RelatedPlansCarousel from '@/experience/components/organisms/RelatedPlansCarousel'
import { asMediaAlt, asMediaURL, designTextColor, text } from '@/experience/components/shared'
import type { ExperienceComponentProps } from '@/experience/components/types'
import { mergeProps } from '@/experience/components/mergeProps'

export default function GridComponent({ content, locale, settings, site }: ExperienceComponentProps) {
  const p = mergeProps(content, settings)
  if (text(p.variant) === 'providers-carousel') return <ProvidersCarousel content={p} locale={locale} />
  if (text(p.variant) === 'related-plans-carousel') return <RelatedPlansCarousel content={p} locale={locale} />
  const background = text(p.background)
  const className = `section${background && background !== 'white' ? ` section--${background}` : ''}`
  const items = (p.cards ?? p.features ?? p.actions ?? p.items ?? []) as Array<Record<string, unknown>>
  const columnsCount = text(p.columns) || (items.length === 4 ? '4' : '')
  const headingLower = text(p.heading).toLowerCase()
  const headingHighlight = text(p.headingHighlight)
  const heading = text(p.heading)
  const headingPrefix = headingHighlight && heading.endsWith(headingHighlight) ? heading.slice(0, -headingHighlight.length).trimEnd() : heading
  const isProviders = headingLower.includes('provider') || headingLower.includes('proveedor') || headingLower.includes('provedor')
  const showBadge = p.showBadge !== false && p.variant !== 'providers' && p.variant !== 'logos' && !isProviders
  const grid = (
    <div className="grid">
      {items.map((item, i) => (
        <article className="card" data-editor-field="cards" data-editor-index={i} key={text(item.id) || i}>
          {(asMediaURL(item.image) || asMediaURL(item.media) || text(item.imageUrl)) ? <img className="card__media" src={asMediaURL(item.image) || asMediaURL(item.media) || text(item.imageUrl)} alt={text(item.imageAlt) || text(item.alt) || asMediaAlt(item.image) || asMediaAlt(item.media) || text(item.heading ?? item.label ?? item.title)} /> : null}
          {showBadge ? <div className="card-badge">0{i + 1}</div> : null}
          {(() => {
            const cardTitle = text(item.heading ?? item.label ?? item.title)
            const titleKey = cardTitle.toLowerCase()
            const cardIcon = text(item.icon) || (/message|mensaje|mensagem/.test(titleKey) ? 'mail' : /talk|contact|cont[aá]ct|fale/.test(titleKey) ? 'phone' : /feedback|coment/.test(titleKey) ? 'message-square' : '')
            return <div className="card__heading">{cardIcon ? <span aria-hidden="true" className="card__title-icon"><ClientExperienceComponent code="icon" content={{ name: cardIcon, size: 28 }} locale={locale} settings={{}} site={site} /></span> : null}<h3>{cardTitle}</h3></div>
          })()}
          {(item.description ?? item.subtitle) ? <p>{text(item.description ?? item.subtitle)}</p> : null}
          {text(item.meta) ? <p className="card-meta">{text(item.meta)}</p> : null}
          {text(item.modalKey) ? (
            <ClientExperienceComponent code="modal-trigger" content={{ className: 'card__link', icon: item.showIcon === false || text(item.buttonIcon) === 'none' ? undefined : text(item.buttonIcon) || 'arrow-right', label: text(item.linkLabel) || 'Learn more', modalKey: text(item.modalKey), variant: text(item.buttonVariant) || 'primary' }} locale={locale} settings={{}} site={site} />
          ) : text(item.url) ? (
            (() => {
              const href = text(item.url)
              const ppgaDocumentDownload = site.slug === 'ppga' && href.startsWith('/api/dxp/documents/download?')
              return (
                <a
                  className={`card__link${ppgaDocumentDownload ? ' card__link--ppga-document' : ''}`}
                  href={href}
                  rel={ppgaDocumentDownload ? 'noopener noreferrer' : undefined}
                  target={ppgaDocumentDownload ? '_blank' : undefined}
                >
                  {text(item.linkLabel) || 'Learn more'}
                  {item.showIcon !== false && text(item.buttonIcon) !== 'none' ? <ClientExperienceComponent code="icon" content={{ name: text(item.buttonIcon) || 'arrow-right', size: 16 }} locale={locale} settings={{}} site={site} /> : null}
                  {ppgaDocumentDownload ? <span aria-hidden="true" className="card__link-arrow">→</span> : null}
                </a>
              )
            })()
          ) : null}
        </article>
      ))}
    </div>
  )
  return (
    <section className={`${className} grid-section grid-section--${text(p.variant) || 'default'}${columnsCount ? ` grid-section--cols-${columnsCount}` : ''}${isProviders ? ' grid-section--providers' : ''}`} data-columns={columnsCount || undefined}>
      <div className="section-container">
        {text(p.eyebrow) && <div className="eyebrow"><span />{text(p.eyebrow)}</div>}
        {heading && <h2 style={designTextColor(p.headingColor) ? { color: designTextColor(p.headingColor) } : undefined}>{headingHighlight && headingPrefix !== heading ? <>{headingPrefix} <mark style={designTextColor(p.headingHighlightColor) ? { color: designTextColor(p.headingHighlightColor) } : undefined}>{headingHighlight}</mark></> : heading}</h2>}
        {text(p.description) && <p className="section-subtitle" style={designTextColor(p.descriptionColor) ? { color: designTextColor(p.descriptionColor) } : undefined}>{text(p.description)}</p>}
        {p.collapsible ? (
          // Native <details>/<summary> disclosure — no client component needed, same
          // no-JS-required pattern the FAQ accordion already uses. Matches production's real
          // "View/Hide Standard Products" toggle on Our Plans (a plain show/hide, nothing else).
          <details className="grid-section__disclosure">
            {/* The visible label text swaps via CSS `content: attr()` (data-closed/data-open), so
                it never reaches the accessibility tree on its own — <details>/<summary> already
                announces expanded/collapsed state natively, but still needs a real accessible
                name for what's being toggled, hence the explicit aria-label here. */}
            <summary aria-label={text(p.collapsedLabel) || 'View more'} className="grid-section__disclosure-summary">
              <span aria-hidden="true" className="grid-section__disclosure-label" data-closed={text(p.collapsedLabel) || 'View more'} data-open={text(p.expandedLabel) || 'Hide'} />
              <ClientExperienceComponent code="icon" content={{ name: 'chevron-down', size: 16 }} locale={locale} settings={{}} site={site} />
            </summary>
            {grid}
          </details>
        ) : grid}
      </div>
    </section>
  )
}
