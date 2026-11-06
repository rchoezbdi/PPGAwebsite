'use client'

import { useId, useState, type KeyboardEvent } from 'react'
import { asMediaAlt, asMediaURL, text } from '../shared'

type Service = { heading?: string; description?: string; image?: unknown; imageAlt?: string; imageUrl?: string }

export default function ServiceTabsSection({ heading, highlight, description, services }: { heading: string; highlight: string; description: string; services: Service[] }) {
  const [active, setActive] = useState(0)
  const tabId = useId()
  const service = services[active]
  const blocks = text(service?.description).split(/\n{2,}|(?=\b(?:InterConsultation®|Individual Case Management|Cuidado Dirigido|Gestão de Casos Individuais|Best Doctors Concierge™|Telemedicine|Telemedicina|BD2Go app|Aplicación BD2Go|Aplicativo BD2Go|Digital Pass & Member Portal|Pase Digital y Portal del Asegurado|Passe digital e Portal do Segurado)\b)/).map((block) => block.trim()).filter(Boolean)
  const image = asMediaURL(service?.image) || text(service?.imageUrl)
  const onTabKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (!services.length) return
    const keys: Record<string, number> = { ArrowLeft: index - 1, ArrowRight: index + 1, Home: 0, End: services.length - 1 }
    if (!(event.key in keys)) return
    event.preventDefault()
    const next = (keys[event.key] + services.length) % services.length
    setActive(next)
    document.getElementById(`${tabId}-tab-${next}`)?.focus()
  }
  return <section className="service-tabs-section">
    <div className="section-container service-tabs-section__inner">
      <header><h2>{heading}</h2><strong>{highlight}</strong><p>{description}</p></header>
      <div aria-label="Services" className="service-tabs-section__tabs" role="tablist">{services.map((item, index) => <button aria-controls={`${tabId}-panel`} aria-selected={active === index} id={`${tabId}-tab-${index}`} key={index} onClick={() => setActive(index)} onKeyDown={(event) => onTabKeyDown(event, index)} role="tab" tabIndex={active === index ? 0 : -1} type="button">{text(item.heading)}</button>)}</div>
      <div aria-labelledby={`${tabId}-tab-${active}`} className="service-tabs-section__panel" id={`${tabId}-panel`} role="tabpanel">
        {image ? <img alt={text(service?.imageAlt) || asMediaAlt(service?.image) || text(service?.heading)} loading="lazy" src={image} /> : null}
        <div><h3>{text(service?.heading)}</h3>{blocks.map((block, index) => { const [title, ...body] = block.split(/:\s*/, 2); return <p key={index}><b>{title}</b>{body[0] ? <> {body[0]}</> : null}</p> })}</div>
      </div>
    </div><span aria-hidden="true" className="service-tabs-section__word">Services</span>
  </section>
}
