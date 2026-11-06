import { resolveExperienceLink } from '@/experience/navigation/resolver'
import type { ExperienceSite } from '@/experience/registry/componentRegistry'
import type { ButtonVariant } from './atoms/Button'

/** Raw CMS shape for a single call-to-action — the same shape used across Hero/CTAGroup/PlanCard/
 * etc. so editorial content is interchangeable between any of them. */
export type CTAContent = {
  href?: string | null
  label?: string | null
  linkType?: 'internal' | 'external' | 'none' | 'popup' | null
  newWindow?: boolean | null
  page?: unknown
  url?: string | null
  email?: string | null
  phone?: string | null
  variant?: ButtonVariant | null
  showIcon?: boolean | null
  icon?: string | null
  iconPosition?: 'left' | 'right' | null
  showButton?: boolean | null
  modalKey?: string | null
}

export const text = (value: unknown): string => (typeof value === 'string' ? value : '')
export const num = (value: unknown): number | undefined => (typeof value === 'number' ? value : undefined)
export const readButtonCTA = (source: Record<string, unknown>, fields: Partial<Record<keyof CTAContent | 'cta', string>> = {}, defaults: CTAContent = {}): CTAContent | null => {
  const cta = source[fields.cta ?? 'cta']
  if (cta !== undefined) return cta && typeof cta === 'object' && !Array.isArray(cta) ? { ...defaults, ...cta } : null
  const legacyFields: Record<keyof CTAContent, string> = {
    href: 'href', label: 'buttonLabel', linkType: 'linkType', newWindow: 'newWindow', page: 'page', url: 'url',
    email: 'email', phone: 'phone',
    variant: 'buttonVariant', showIcon: 'showIcon', icon: 'buttonIcon', iconPosition: 'iconPosition', showButton: 'showButton', modalKey: 'modalKey',
  }
  const legacy = Object.fromEntries(Object.entries(legacyFields).flatMap(([name, key]) => {
    const value = source[fields[name as keyof CTAContent] ?? key]
    return value === undefined ? [] : [[name, value]]
  })) as CTAContent
  return { ...defaults, ...legacy }
}
export const designTextColor = (value: unknown): string | undefined => {
  const color = text(value).trim()
  if (/^color\.[\w.-]+$/.test(color)) return `var(--ds-color-${color.slice(6).replace(/[^a-zA-Z0-9_-]/g, '-')})`
  return undefined
}

/** Lets a Card (rendered by one component instance) open another instance — a Form or a Rich
 * Content block further down the same page — in a modal instead of linking/scrolling to it. E.g.
 * Support's "Message"/"Talk to us"/"Feedback portal" cards each open their matching instance the
 * way production's Elementor popups do. Card and target never share React props (PageRenderer
 * mounts each `page-components` row independently), so a page-wide CustomEvent is the simplest
 * way to connect a trigger to the instance whose own `content.modalKey` matches — same pattern
 * already used for `IUBENDA_CONSENT_EVENT`. Any component can opt in by setting
 * `content.displayMode:'modal'` plus a `content.modalKey` and rendering itself through
 * `<ContentModal>` (see molecules/ContentModal.tsx) instead of its normal inline wrapper. */
export const CONTENT_MODAL_EVENT = 'bd:open-content-modal'
export const openContentModal = (modalKey: string): void => {
  if (typeof window === 'undefined' || !modalKey) return
  window.dispatchEvent(new CustomEvent(CONTENT_MODAL_EVENT, { detail: { modalKey } }))
}

export const resolveCTA = (cta: CTAContent | null | undefined, locale: string, site?: ExperienceSite): { href: string | null; label: string; newWindow: boolean; target?: string; variant?: ButtonVariant | null; showIcon?: boolean; icon?: string | null; iconPosition?: 'left' | 'right' | null } | null => {
  if (!cta?.label || cta.showButton === false) return null
  const showIcon = cta.icon !== 'none' && (cta.showIcon == null ? Boolean(cta.icon) : Boolean(cta.showIcon))
  const icon = showIcon ? cta.icon : undefined
  if (cta.modalKey) return { href: `modal:${cta.modalKey}`, label: cta.label, newWindow: false, variant: cta.variant, showIcon, icon, iconPosition: cta.iconPosition }
  const url = cta.url ?? cta.href ?? (cta.email?.trim() ? `mailto:${cta.email.trim()}` : cta.phone?.trim() ? `tel:${cta.phone.trim()}` : undefined)
  const resolved = resolveExperienceLink({ linkType: cta.linkType, page: cta.page as Parameters<typeof resolveExperienceLink>[0]['page'], url, locale, fallbackSite: site?.slug, localizedRoutes: site?.localizedRoutes })
  if (!resolved.href) return null
  return { href: resolved.href, label: cta.label, newWindow: resolved.newWindow, target: resolved.newWindow ? '_blank' : undefined, variant: cta.variant, showIcon, icon, iconPosition: cta.iconPosition }
}

export const normalizeMediaURL = (value?: string | null): string => {
  if (!value) return ''
  if (value.startsWith('/')) return value
  if (/^https?:\/\//i.test(value)) {
    try {
      const parsed = new URL(value)
      // Payload may persist its configured serverURL for a DAM file. Using the canonical
      // relative route keeps that file on the browser's current origin and inside CSP `self`.
      if (parsed.pathname.startsWith('/api/media/file/')) return `${parsed.pathname}${parsed.search}${parsed.hash}`
    } catch {
      return value
    }
    return value
  }
  return `/media/${value}`
}

export const asMediaOptimizerURL = (value: string): string => {
  // Local Payload media routes are addressable by filename without the upload prefix. Keeping
  // the prefix makes some existing files resolve to 404/403 in the image optimizer.
  if (!value) return value
  try {
    const url = new URL(value, 'https://media.local')
    const currentAssets: Record<string, string> = {
      '/api/media/file/Ellipse-3-2.webp': '/api/media/file/Ellipse-3-4.webp',
      '/api/media/file/freepik__enhance__27327-1-raster.webp': '/api/media/file/freepik__enhance__27327-1-raster-5.webp',
    }
    const currentPath = currentAssets[url.pathname]
    if (currentPath) url.pathname = currentPath
    if (!currentPath && !url.searchParams.has('prefix')) return value
    url.searchParams.delete('prefix')
    return `${url.pathname}${url.search}${url.hash}`
  } catch {
    return value
  }
}

export const asMediaURL = (value: unknown): string => {
  if (!value || typeof value !== 'object') return ''
  const record = value as Record<string, unknown>
  return normalizeMediaURL(typeof record.url === 'string' ? record.url : undefined)
}

/** Keeps DAM derivatives optional: plain editorial URLs continue to render unchanged. */
export const asMediaSrcSet = (value: unknown): string | undefined => {
  if (!value || typeof value !== 'object') return undefined
  const record = value as Record<string, unknown>
  const original = asMediaURL(value)
  const originalWidth = typeof record.width === 'number' ? record.width : 0
  const originalMimeType = typeof record.mimeType === 'string' ? record.mimeType : ''
  const sizes = record.sizes && typeof record.sizes === 'object' ? record.sizes as Record<string, unknown> : {}
  const candidates = Object.values(sizes).flatMap((entry) => {
    if (!entry || typeof entry !== 'object') return []
    const size = entry as Record<string, unknown>
    if (originalMimeType && typeof size.mimeType === 'string' && size.mimeType !== originalMimeType) return []
    const url = normalizeMediaURL(typeof size.url === 'string' ? size.url : undefined)
    const width = typeof size.width === 'number' ? size.width : 0
    return url && width ? [[url, width] as const] : []
  })
  if (original && originalWidth) candidates.push([original, originalWidth])
  const unique = new Map(candidates.map(([url, width]) => [url, width]))
  return unique.size ? [...unique].sort(([, left], [, right]) => left - right).map(([url, width]) => `${url} ${width}w`).join(', ') : undefined
}

export const asMediaDimension = (value: unknown, dimension: 'width' | 'height'): number | undefined => {
  if (!value || typeof value !== 'object') return undefined
  const valueAtDimension = (value as Record<string, unknown>)[dimension]
  return typeof valueAtDimension === 'number' && valueAtDimension > 0 ? valueAtDimension : undefined
}

export const asMediaAlt = (value: unknown, fallback = ''): string => {
  // Prefer editable editorial text, then DAM metadata. Filenames are internal identifiers,
  // not useful alternative text for screen readers or search engines.
  if (fallback.trim()) return fallback.trim()
  if (!value || typeof value !== 'object') return ''
  const record = value as Record<string, unknown>
  return text(record.alt).trim()
}
