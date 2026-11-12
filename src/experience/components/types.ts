import type { LocalizedRoutes } from '@/experience/navigation/localizedRoutes'

export type ExperienceSite = {
  name: string
  slug: string
  supportedLocales: string[]
  localizedRoutes?: LocalizedRoutes
}

export type ExperienceComponentProps = {
  /** Editorial data for this instance (headings, cards, CTAs, ...). */
  content: Record<string, unknown>
  /** Presentation/config for this instance (variant, background, columns, ...). */
  settings: Record<string, unknown>
  locale: string
  site: ExperienceSite
  /** This `page-components` row's own id — needed by components that write back to their own
   * instance (e.g. Form submissions posting to /api/dxp/forms/submit). */
  instanceId?: string | number
}

export type NavigationItem = {
  id?: string | number | null
  label?: string
  linkType?: 'internal' | 'external' | 'none' | 'popup'
  page?: unknown
  url?: string | null
  modalKey?: string | null
  newWindow?: boolean | null
  children?: NavigationItem[] | null
}
