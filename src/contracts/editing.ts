/** Editing contract the site publishes for the DXP. No Payload dependency; additive changes keep the version. */
export const EDITING_CONTRACT_VERSION = 1 as const
export const PREVIEW_PROTOCOL_VERSION = 1 as const
export const PREVIEW_MESSAGE_SOURCE = 'experience-site-preview' as const
export const EDITOR_MESSAGE_SOURCE = 'experience-editor' as const

export type EditableFieldType = 'text' | 'textarea' | 'richText' | 'image' | 'select' | 'checkbox' | 'relationship' | 'group' | 'array'

export type EditableField = {
  name: string
  label?: string
  type: EditableFieldType
  /** `button` groups are Button instances; their `variant` options come from the site's Button. */
  role?: 'button'
  required?: boolean
  localized?: boolean
  maxLength?: number
  options?: string[]
  defaultValue?: string | number | boolean
  relationTo?: string
  hasMany?: boolean
  minRows?: number
  maxRows?: number
  fields?: EditableField[]
}

export type EditableSection = {
  /** Stable id, equal to the catalog `type` stored by the DXP. */
  id: string
  /** Normalised component code used by the renderer registry. */
  code: string
  version: number
  name: string
  description: string
  category: string
  /** False when the section has no editable content and must not be offered in the add menu. */
  insertable: boolean
  fields: EditableField[]
  /** Sample content for previews and new instances. */
  sample: Record<string, unknown>
}

export type PreviewCapabilities = {
  protocol: typeof PREVIEW_PROTOCOL_VERSION
  /** Path of the site route that renders pages and sections from editor messages. */
  route: string
  pageFrame: boolean
  sectionFrame: boolean
  designReview: boolean
  liveUpdates: boolean
  selection: boolean
  viewports: Array<{ id: 'desktop' | 'tablet' | 'mobile'; width: number }>
}

export type SiteEditingContract = {
  contractVersion: typeof EDITING_CONTRACT_VERSION
  site: string
  buttonVariants: string[]
  sections: EditableSection[]
  preview: PreviewCapabilities
  design: {
    tokens: Record<string, unknown>
    fonts: unknown[]
    buttonStyle: Record<string, unknown>
    components: Array<{ id: string; name: string; level: string; sourcePath: string; previewId: string | null }>
  }
}

/** Messages are plain JSON; both ends check origin, source, protocol and type before acting. */
export type EditorToSiteMessage =
  | { source: typeof EDITOR_MESSAGE_SOURCE; protocol: typeof PREVIEW_PROTOCOL_VERSION; type: 'render'; payload: PreviewRenderPayload }
  | { source: typeof EDITOR_MESSAGE_SOURCE; protocol: typeof PREVIEW_PROTOCOL_VERSION; type: 'select'; instanceId: string | null }

export type SiteToEditorMessage =
  | { source: typeof PREVIEW_MESSAGE_SOURCE; protocol: typeof PREVIEW_PROTOCOL_VERSION; type: 'ready' }
  | { source: typeof PREVIEW_MESSAGE_SOURCE; protocol: typeof PREVIEW_PROTOCOL_VERSION; type: 'select'; instanceId: string }
  | { source: typeof PREVIEW_MESSAGE_SOURCE; protocol: typeof PREVIEW_PROTOCOL_VERSION; type: 'error'; message: string }

export type PreviewRenderPayload = {
  mode: 'page' | 'section'
  page: import('./site').PageDTO
  site: import('./site').ExperienceSite
  locale: string
  selectedInstanceId?: string | null
}
