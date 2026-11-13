/** JSON contract between the DXP and the public website. No Payload dependency. */
import type { LocalizedRoutes } from '@/experience/navigation/localizedRoutes'

export const SITE_API_VERSION = 1 as const
export type ExperienceSite = { name: string; slug: string; supportedLocales: string[]; localizedRoutes?: LocalizedRoutes }
export type AppLayoutPart = { componentId: string | number; code: string; content: Record<string, unknown>; instanceId: string; name: string; position: number; role: string; settings: Record<string, unknown> }
export type AppLayout = { templateId: string | number; templateName: string; before: AppLayoutPart[]; after: AppLayoutPart[] }
export const isPageChrome = (role: unknown): boolean => role === 'alert-banner' || role === 'header' || role === 'footer'
export type RuntimeIntegration = { id: string | number; provider: string; loadingStrategy: string; consentPurposeId?: string | null; configuration: Record<string, unknown> }
export type PageComponentDTO = { instanceId: string | number; componentId: string | number; name: string; code: string; role?: string; type: string; atomicLevel: string; position: number; slot?: string | null; content: Record<string, unknown>; settings: Record<string, unknown>; visibility: Record<string, unknown> }
export type PageComposition = {
  manifestId: string
  version: number
  sections: Array<{ instanceId: string; code: string; position: number }>
}
export interface PageDTO {
  id: string | number
  title: string
  updatedAt?: string
  slug: string
  locale: string
  localePaths?: Record<string, string>
  localizedRoutes?: LocalizedRoutes
  translationGroup?: string | null
  status: string
  seo: Record<string, unknown>
  metadata: Record<string, unknown>
  components: PageComponentDTO[]
  composition?: PageComposition
  layout?: AppLayout | null
  designSystem: { id: string | number; name: string; tokens: Record<string, unknown>; settings: Record<string, unknown>; fonts: unknown[] } | null
  buttonStyle?: Record<string, unknown>
  integrations?: RuntimeIntegration[]
}
export type SitePageResponse = { apiVersion: typeof SITE_API_VERSION; page: PageDTO; site: ExperienceSite; locale: string; defaultSeo: Record<string, unknown>; favicon?: { url: string; mimeType?: string | null } }

type LegacyTag = { enabled?: boolean | null; iubendaPurposeId?: string | null }
export type LegacyIntegrationEntry = {
  iubenda?: { enabled?: boolean | null; siteId?: string | null; policyId?: string | null; autoBlocking?: boolean | null } | null
  googleTagManager?: (LegacyTag & { containerId?: string | null }) | null
  microsoftClarity?: (LegacyTag & { projectId?: string | null }) | null
  metaPixel?: (LegacyTag & { pixelId?: string | null }) | null
  linkedinInsight?: (LegacyTag & { partnerId?: string | null }) | null
  hubspot?: (LegacyTag & { portalId?: string | null }) | null
  dialpad?: (LegacyTag & { loadStrategy?: string | null; server?: string | null }) | null
  customScripts?: Array<LegacyTag & { id?: string | null; scriptType?: string | null; src?: string | null; code?: string | null }> | null
}
