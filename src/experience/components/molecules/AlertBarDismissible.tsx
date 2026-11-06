'use client'

import { useEffect, useState, type ReactNode } from 'react'
import Icon from '../atoms/Icon'

const STORAGE_KEY = 'bd-alertbar-dismissed-at'
const DISMISS_DURATION_MS = 6 * 60 * 60 * 1000 // 6 hours — explicit product decision (23 sep):
// a visitor who closes it clearly doesn't want to see it again immediately on every page/refresh
// (that's the whole point of a close button), but it's still a real, time-relevant notice (e.g.
// an emergency advisory) that should come back later in the same session rather than being gone
// for good — 6h covers "closed it once this visit" without needing per-message dismissal state.

const CLOSE_LABEL: Record<string, string> = { en: 'Close', es: 'Cerrar', pt: 'Fechar' }

/** Wraps the real AlertBar/LegacyUtilityHeader content (passed as children — a Server Component
 * is fine as a child of a Client Component, no need to make the whole bar client-side) with
 * dismiss state. `localStorage` read only happens after mount (SSR always renders the bar open,
 * matching how every other viewer-storage read in this codebase already guards against the
 * server/client mismatch — see MobileNavigation's own client-only effects). */
export default function AlertBarDismissible({ children, locale }: { children: ReactNode; locale: string }) {
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY)
      const dismissedAt = raw ? Number(raw) : 0
      if (Number.isFinite(dismissedAt) && Date.now() - dismissedAt < DISMISS_DURATION_MS) setDismissed(true)
    } catch {
      // Private browsing / blocked storage — fail open (bar stays visible), never fail closed.
    }
  }, [])

  if (dismissed) return null

  const close = () => {
    setDismissed(true)
    try { window.localStorage.setItem(STORAGE_KEY, String(Date.now())) } catch { /* same fail-open as above */ }
  }

  const closeLabel = CLOSE_LABEL[locale] ?? CLOSE_LABEL.en
  return (
    <div className="alert-bar-dismissible">
      {children}
      <button aria-label={closeLabel} className="alert-bar-dismissible__close" onClick={close} type="button">
        <Icon ariaHidden name="close" size={14} />
      </button>
    </div>
  )
}
