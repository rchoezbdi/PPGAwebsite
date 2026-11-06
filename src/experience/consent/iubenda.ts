'use client'

import { useEffect, useState } from 'react'

export const IUBENDA_CONSENT_EVENT = 'bd:iubenda-consent-updated'

type IubendaWindow = Window & {
  _iub?: {
    csConfiguration?: { siteId?: string | number; cookiePolicyId?: string | number }
  }
}

/** Exported so callers that need the full granted-purposes set (e.g. building a
 * `PersonalizationContext.consentPurposes` list) can reuse this instead of re-parsing the cookie. */
export const readConsentPurposes = (): Record<string, boolean> | null => {
  if (typeof document === 'undefined') return null
  const config = (window as IubendaWindow)._iub?.csConfiguration
  const siteId = config?.siteId
  const cookiePolicyId = config?.cookiePolicyId
  if (!siteId && !cookiePolicyId) return null

  const siteCookiePattern = siteId != null ? new RegExp(`^_iub_cs-s${siteId}=`, 'i') : null
  const policyCookiePattern = cookiePolicyId != null ? new RegExp(`^_iub_cs-${cookiePolicyId}=`, 'i') : null

  for (const raw of document.cookie.split(';')) {
    const entry = raw.trim()
    if ((siteCookiePattern?.test(entry)) || (policyCookiePattern?.test(entry))) {
      try {
        const value = entry.slice(entry.indexOf('=') + 1)
        const parsed = JSON.parse(decodeURIComponent(value)) as { purposes?: Record<string, boolean> }
        return parsed.purposes ?? null
      } catch {
        return null
      }
    }
  }
  return null
}

/**
 * Adapted from iubenda's documented per-purpose consent check
 * (https://www.iubenda.com/en/help/1229): reads the `_iub_cs-*` consent cookie
 * iubenda's Cookie Solution writes once the visitor expresses a preference.
 */
export const hasIubendaConsent = (purposeId?: string | null): boolean => {
  if (!purposeId) return true
  const purposes = readConsentPurposes()
  if (!purposes) return false
  return Boolean(purposes[purposeId])
}

export const useIubendaConsent = (purposeId?: string | null): boolean => {
  const [trackedPurposeId, setTrackedPurposeId] = useState(purposeId)
  const [granted, setGranted] = useState(() => hasIubendaConsent(purposeId))

  // Re-derive synchronously during render when the purpose changes, instead of
  // setState-in-effect, per https://react.dev/learn/you-might-not-need-an-effect#adjusting-some-state-when-a-prop-changes
  if (purposeId !== trackedPurposeId) {
    setTrackedPurposeId(purposeId)
    setGranted(hasIubendaConsent(purposeId))
  }

  useEffect(() => {
    if (!purposeId) return
    const handler = () => setGranted(hasIubendaConsent(purposeId))
    window.addEventListener(IUBENDA_CONSENT_EVENT, handler)
    return () => window.removeEventListener(IUBENDA_CONSENT_EVENT, handler)
  }, [purposeId])

  return granted
}
