'use client'

import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import Icon from '../atoms/Icon'
import Link from '../atoms/Link'
import { openContentModal } from '../shared'
import LanguageSelector, { type LanguageOption } from '../molecules/LanguageSelector'
import PortalSelector, { type PortalOption } from '../molecules/PortalSelector'
import type { ResolvedNavItem } from './SiteHeader'

const CLOSE_LABEL: Record<string, string> = { en: 'Close menu', es: 'Cerrar menú', pt: 'Fechar menu' }

/** Reuses the exact same navigation/language/portal data SiteHeader resolved for desktop — no
 * separate mobile content model. */
export default function MobileNavigation({ items, languages, locale, logoAlt, logoURL, onClose, open, portalButtonText, portalButtonVariant, portalButtonIcon, portalButtonHidden, portals, siteName }: {
  items: ResolvedNavItem[]
  languages?: LanguageOption[]
  locale: string
  logoAlt: string
  logoURL: string
  onClose: () => void
  open: boolean
  portalButtonText?: string
  portalButtonVariant?: 'primary' | 'secondary' | 'outline'
  portalButtonIcon?: string
  portalButtonHidden?: boolean
  portals?: PortalOption[]
  siteName: string
}) {
  const drawerRef = useRef<HTMLDivElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    // Move focus into the dialog on open (it doesn't happen on its own — a <div role="dialog">
    // isn't natively focusable/focused) and trap Tab/Shift+Tab inside it, same as any modal
    // should; without this, keyboard users tabbing past the trigger land back on page content
    // hidden behind the scrim.
    const previouslyFocused = document.activeElement as HTMLElement | null
    closeButtonRef.current?.focus()
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { onClose(); return }
      if (event.key !== 'Tab' || !drawerRef.current) return
      const focusable = drawerRef.current.querySelectorAll<HTMLElement>('a[href], button:not([disabled])')
      if (!focusable.length) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', onKeyDown)
      previouslyFocused?.focus()
    }
  }, [open, onClose])

  if (!open) return null
  const closeLabel = CLOSE_LABEL[locale] ?? CLOSE_LABEL.en

  // Portaled to <body> rather than rendered inline inside <header> — the header sets
  // `isolation: isolate` (its own stacking context, for its sticky backdrop-blur layering), which
  // silently trapped this drawer's `position: fixed` + high z-index *inside* the header's local
  // stacking order instead of the page's real top layer. Without the portal, the Alert Bar and
  // page content below the header rendered visually on top of the "open" drawer.
  return createPortal((
    <div className="mobile-nav" role="dialog" aria-modal="true">
      <div aria-hidden="true" className="mobile-nav__scrim" onClick={onClose} />
      <div className="mobile-nav__drawer" ref={drawerRef}>
        <div className="mobile-nav__header">
          {logoURL ? <img alt={logoAlt} className="experience-header__logo" src={logoURL} /> : <strong>{siteName}</strong>}
          <button aria-label={closeLabel} className="mobile-nav__close" onClick={onClose} ref={closeButtonRef} type="button"><Icon name="close" /></button>
        </div>
        <ul className="mobile-nav__items">
          {items.map((item, index) =>
            item.children?.length ? (
              // A group ("About us", "Support"...) collapses behind its own disclosure — same
              // native <details> pattern DropdownMenu/LanguageSelector already use elsewhere in
              // this header, instead of always rendering every child inline (a long nav pushed
              // the drawer into several screens of scrolling before a visitor reached the bottom
              // language/login controls).
              <li key={item.id ?? `${item.label}-${index}`}>
                <details className="mobile-nav__group">
                  <summary>{item.label}<Icon ariaHidden name="chevron-down" size={16} /></summary>
                  <ul className="mobile-nav__submenu">
                    {item.children.map((child, childIndex) => (
                      <li key={child.id ?? `${child.label}-${childIndex}`}>{child.href ? <Link href={child.href}>{child.label}</Link> : child.modalKey ? <button onClick={() => { openContentModal(child.modalKey as string); onClose() }} type="button">{child.label}</button> : <span>{child.label}</span>}</li>
                    ))}
                  </ul>
                </details>
              </li>
            ) : (
              <li key={item.id ?? `${item.label}-${index}`}>
                {item.href ? <Link href={item.href}>{item.label}</Link> : item.modalKey ? <button onClick={() => { openContentModal(item.modalKey as string); onClose() }} type="button">{item.label}</button> : <span>{item.label}</span>}
              </li>
            ),
          )}
        </ul>
        <div className="mobile-nav__footer">
          <LanguageSelector languages={languages} />
          <PortalSelector hidden={portalButtonHidden} icon={portalButtonIcon} locale={locale} portals={portals} triggerLabel={portalButtonText || undefined} variant={portalButtonVariant} />
        </div>
      </div>
    </div>
  ), document.body)
}
