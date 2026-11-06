'use client'

import { useId, useRef, useState, type KeyboardEvent } from 'react'
import { Check, X } from 'lucide-react'
import Media from '../atoms/Media'
import { asMediaURL, text } from '../shared'

type AppointmentItem = {
  label?: string
  image?: unknown
  imageAlt?: string
}

type AppointmentTip = {
  heading?: string
  intro?: string
  value?: string
  label?: string
  description?: string
}

type AppointmentTab = {
  label?: string
  heading?: string
  description?: string
  subheading?: string
  closing?: string
  image?: unknown
  imageAlt?: string
  url?: string
  linkLabel?: string
  items?: AppointmentItem[]
  tip?: AppointmentTip
}

type FirstAidScheduledAppointmentsProps = {
  locale?: string
  tabs?: AppointmentTab[]
}

// Question banners are written as a regular lead-in followed by a bold tail.
const bannerLeadIns: Record<string, RegExp> = {
  en: /^(How can I|What if the hospital)\s+([\s\S]+)$/i,
  es: /^(¿Cómo puedo|¿Qué ocurre si el hospital)\s+([\s\S]+)$/i,
  pt: /^(Como posso|E se o hospital)\s+([\s\S]+)$/i,
}
export const splitBannerHeading = (heading: string, locale: string) => {
  const match = bannerLeadIns[locale.slice(0, 2).toLowerCase()]?.exec(heading.trim())
  return match ? { lead: match[1], tail: match[2] } : null
}

// "Whenever possible" -> navy lead-in plus the last word highlighted.
export const splitLastWord = (value: string) => {
  const trimmed = value.trim()
  const index = trimmed.lastIndexOf(' ')
  return index > 0 ? { lead: trimmed.slice(0, index), tail: trimmed.slice(index + 1) } : { lead: '', tail: trimmed }
}

export default function FirstAidScheduledAppointments({ locale = 'en', tabs = [] }: FirstAidScheduledAppointmentsProps) {
  const id = useId()
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([])
  const [active, setActive] = useState(0)
  if (!tabs.length) return null
  const language = locale.slice(0, 2).toLowerCase()

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const nextByKey: Record<string, number> = {
      ArrowRight: index + 1,
      ArrowLeft: index - 1,
      Home: 0,
      End: tabs.length - 1,
    }
    if (!(event.key in nextByKey)) return
    event.preventDefault()
    const next = (nextByKey[event.key] + tabs.length) % tabs.length
    setActive(next)
    tabRefs.current[next]?.focus()
  }

  return (
    <section className="first-aid-scheduled-appointments" lang={locale}>
      <div aria-label={language === 'pt' ? 'Opções de agendamento' : language === 'es' ? 'Opciones para programar una cita' : 'Appointment options'} className="first-aid-guide-tabs__list" role="tablist">
        {tabs.map((tab, index) => <button
          aria-controls={`${id}-panel-${index}`}
          aria-selected={active === index}
          className={`first-aid-guide-tabs__tab${active === index ? ' is-active' : ''}`}
          id={`${id}-tab-${index}`}
          key={`${text(tab.label)}-${index}`}
          onClick={() => setActive(index)}
          onKeyDown={(event) => onKeyDown(event, index)}
          ref={(element) => { tabRefs.current[index] = element }}
          role="tab"
          tabIndex={active === index ? 0 : -1}
          type="button"
        >{text(tab.label)}</button>)}
      </div>
      {tabs.map((tab, index) => {
        const image = asMediaURL(tab.image)
        const panelId = `${id}-panel-${index}`
        const banner = splitBannerHeading(text(tab.heading), locale)
        const paragraphs = text(tab.description).split(/\n{2,}/).map((part) => part.trim()).filter(Boolean)
        const possible = text(tab.subheading) ? splitLastWord(text(tab.subheading)) : null
        return <div
          aria-labelledby={`${id}-tab-${index}`}
          className={`first-aid-scheduled-appointments__panel${index === 0 ? ' first-aid-scheduled-appointments__panel--coordination' : ' first-aid-scheduled-appointments__panel--direct'}`}
          hidden={active !== index}
          id={panelId}
          key={panelId}
          role="tabpanel"
          tabIndex={0}
        >
          <header className="first-aid-guide-tabs__banner first-aid-scheduled-appointments__banner">
            {image ? <Media alt={text(tab.imageAlt)} className="first-aid-guide-tabs__icon" objectFit="contain" src={image} /> : null}
            <h2>{banner ? <>{banner.lead} <strong>{banner.tail}</strong></> : <strong>{text(tab.heading)}</strong>}</h2>
          </header>
          {index === 0 ? <div className="first-aid-scheduled-appointments__coordination">
            {paragraphs.map((paragraph, paragraphIndex) => <h3 className="first-aid-scheduled-appointments__lead" key={paragraphIndex}>{paragraph}</h3>)}
            {tab.url && tab.linkLabel ? <a className="first-aid-scheduled-appointments__email" href={tab.url}>{tab.linkLabel}</a> : null}
            {text(tab.subheading) ? <p className="first-aid-scheduled-appointments__subheading">{text(tab.subheading)}</p> : null}
            {tab.items?.length ? <ul className="first-aid-scheduled-appointments__items">
              {tab.items.map((item, itemIndex) => {
                const itemImage = asMediaURL(item.image)
                return <li key={`${text(item.label)}-${itemIndex}`}>
                  {itemImage ? <Media alt={text(item.imageAlt)} className="first-aid-scheduled-appointments__item-image" objectFit="contain" src={itemImage} /> : null}
                  <span>{text(item.label)}</span>
                </li>
              })}
            </ul> : null}
            {tab.tip ? <aside className="first-aid-scheduled-appointments__tip">
              <h3 className="first-aid-scheduled-appointments__tip-label">{text(tab.tip.heading) || (language === 'pt' ? 'Dica' : 'TIP')}</h3>
              <div className="first-aid-scheduled-appointments__tip-content">
                {text(tab.tip.intro) ? <p className="first-aid-scheduled-appointments__tip-intro">{text(tab.tip.intro)}</p> : null}
                <div className="first-aid-scheduled-appointments__deadline">
                  <strong>{text(tab.tip.value)}</strong>
                  <b>{text(tab.tip.label)}</b>
                </div>
                {text(tab.tip.description) ? <p className="first-aid-scheduled-appointments__tip-after">{text(tab.tip.description)}</p> : null}
              </div>
            </aside> : null}
          </div> : <div className="first-aid-scheduled-appointments__direct">
            {paragraphs.length ? <div className="first-aid-scheduled-appointments__cases">
              {paragraphs.map((paragraph, paragraphIndex) => <article className="first-aid-scheduled-appointments__case" key={paragraphIndex}>
                <span aria-hidden="true" className={`first-aid-scheduled-appointments__case-icon${paragraphIndex === 1 ? ' is-negative' : ''}`}>{paragraphIndex === 1 ? <X size={28} strokeWidth={2.5} /> : <Check size={28} strokeWidth={2.5} />}</span>
                <p>{paragraph}</p>
              </article>)}
            </div> : null}
            {possible ? <h3 className="first-aid-scheduled-appointments__possible">{possible.lead ? <>{possible.lead} </> : null}<span>{possible.tail}</span></h3> : null}
            {text(tab.closing) ? <p className="first-aid-scheduled-appointments__closing">{text(tab.closing)}</p> : null}
          </div>}
        </div>
      })}
    </section>
  )
}
