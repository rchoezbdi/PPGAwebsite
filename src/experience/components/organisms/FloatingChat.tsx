'use client'

import { useEffect } from 'react'
import Icon from '../atoms/Icon'
import { text } from '../shared'
import type { ExperienceComponentProps } from '@/experience/registry/componentRegistry'

/** Provider-agnostic: any chat vendor is supported by pointing `scriptUrl` at that vendor's
 * embed script (most auto-render their own floating bubble once loaded) and `widgetId` at
 * whatever id/token that script expects — nothing here is written against a specific SDK. A
 * `provider: 'whatsapp'` shortcut is the one exception, since a WhatsApp deep link needs no
 * external script at all. */
export default function FloatingChat({ content, settings }: ExperienceComponentProps) {
  const p = { ...settings, ...content }
  const enabled = p.enabled !== false
  const provider = text(p.provider)
  const scriptUrl = text(p.scriptUrl)
  const widgetId = text(p.widgetId)
  const phone = text(p.phone)

  useEffect(() => {
    if (!enabled || provider === 'whatsapp' || !scriptUrl) return
    const script = document.createElement('script')
    script.src = scriptUrl
    script.async = true
    if (widgetId) script.dataset.widgetId = widgetId
    document.body.appendChild(script)
    return () => { document.body.removeChild(script) }
  }, [enabled, provider, scriptUrl, widgetId])

  if (!enabled) return null
  if (provider === 'whatsapp' && phone) {
    return (
      <a aria-label="Chatear por WhatsApp" className="floating-chat floating-chat--whatsapp" href={`https://wa.me/${phone.replace(/[^\d]/g, '')}`} rel="noreferrer" target="_blank">
        <Icon name="whatsapp" size={26} />
      </a>
    )
  }
  return null
}
