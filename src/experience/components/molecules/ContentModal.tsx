'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import Icon from '../atoms/Icon'
import { CONTENT_MODAL_EVENT } from '../shared'

const CLOSE_LABEL: Record<string, string> = { en: 'Close', es: 'Cerrar', pt: 'Fechar' }

/** Shared modal chrome for any component instance that opts into `displayMode:'modal'` — Form
 * and RichContent both use this today. Listens for CONTENT_MODAL_EVENT itself so the component
 * using it only needs to render <ContentModal modalKey={...}>{its own content}</ContentModal> in
 * place of its normal inline wrapper; it stays unmounted (renders null) until a matching trigger
 * fires. Portaled to <body> for the same stacking-context reason SearchModal/MobileNavigation
 * already document. */
export default function ContentModal({ children, locale, modalKey }: { children: ReactNode; locale: string; modalKey: string }) {
  const [open, setOpen] = useState(false)
  const triggerRef = useRef<HTMLElement | null>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const handler = (event: Event) => {
      const detail = (event as CustomEvent<{ modalKey?: string }>).detail
      if (detail?.modalKey !== modalKey) return
      triggerRef.current = document.activeElement as HTMLElement
      setOpen(true)
    }
    window.addEventListener(CONTENT_MODAL_EVENT, handler)
    return () => window.removeEventListener(CONTENT_MODAL_EVENT, handler)
  }, [modalKey])

  useEffect(() => {
    if (!open) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const focusTimer = setTimeout(() => closeButtonRef.current?.focus(), 10)
    const close = () => { setOpen(false); triggerRef.current?.focus() }
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === 'Escape') close() }
    window.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', onKeyDown)
      clearTimeout(focusTimer)
    }
  }, [open])

  if (!open) return null
  const close = () => { setOpen(false); triggerRef.current?.focus() }

  return createPortal((
    <div aria-modal="true" className="content-modal" role="dialog">
      <div aria-hidden="true" className="content-modal__scrim" onClick={close} />
      <div className="content-modal__panel">
        <button aria-label={CLOSE_LABEL[locale] || CLOSE_LABEL.en} className="content-modal__close" onClick={close} ref={closeButtonRef} type="button">
          <Icon name="close" size={16} />
        </button>
        {children}
      </div>
    </div>
  ), document.body)
}
