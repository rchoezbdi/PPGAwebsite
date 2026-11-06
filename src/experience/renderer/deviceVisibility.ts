// Per-device visibility for page sections and for the individual fields inside them.
//
// Stored in the instance `visibility` JSON next to `hidden` / `locales`:
//   devices: { mobile?: false, tablet?: false, desktop?: false }        // whole section
//   fields:  { description: { mobile: false }, subtitle: { tablet: false } } // one field
// `false` means hidden on that device; an absent key means visible. Rendering is pure CSS
// (media queries), so it works in SSR and in the builder preview iframe, whose width is the
// device width. Field rules target the `data-editor-field` marker components already emit.

export type VisibilityDevice = 'desktop' | 'tablet' | 'mobile'
export const VISIBILITY_DEVICES: VisibilityDevice[] = ['desktop', 'tablet', 'mobile']

type DeviceMap = Partial<Record<VisibilityDevice, boolean>>
export type DeviceVisibility = {
  hidden?: boolean
  locales?: unknown
  devices?: DeviceMap
  fields?: Record<string, DeviceMap>
  [key: string]: unknown
}

// Same breakpoints the Hero background and the preview device frames already use.
const MEDIA: Record<VisibilityDevice, string> = {
  desktop: '(min-width: 1025px)',
  tablet: '(min-width: 641px) and (max-width: 1024px)',
  mobile: '(max-width: 640px)',
}
const SAFE_NAME = /^[A-Za-z0-9_-]+$/

const asVisibility = (value: unknown): DeviceVisibility =>
  value && typeof value === 'object' && !Array.isArray(value) ? (value as DeviceVisibility) : {}

export const isHiddenOnDevice = (visibility: unknown, device: VisibilityDevice, field?: string): boolean => {
  const v = asVisibility(visibility)
  const map = field ? v.fields?.[field] : v.devices
  return map?.[device] === false
}

/** Devices where the whole section is hidden. */
export const hiddenDevices = (visibility: unknown): VisibilityDevice[] =>
  VISIBILITY_DEVICES.filter((device) => isHiddenOnDevice(visibility, device))

/** CSS rules (scoped to one section) that hide the section and/or its fields per device. */
export const deviceVisibilityCss = (sectionId: string | number, visibility: unknown, mode: 'hide' | 'dim' = 'hide'): string => {
  const v = asVisibility(visibility)
  const scope = `[data-section-id="${String(sectionId).replace(/[^A-Za-z0-9_-]/g, '')}"]`
  const rules: string[] = []
  for (const device of VISIBILITY_DEVICES) {
    const selectors: string[] = []
    if (v.devices?.[device] === false) selectors.push(scope)
    for (const [field, map] of Object.entries(v.fields ?? {})) {
      if (SAFE_NAME.test(field) && map?.[device] === false) selectors.push(`${scope} [data-editor-field="${field}"]`)
    }
    if (selectors.length) rules.push(`@media ${MEDIA[device]}{${selectors.join(',')}{${mode === 'hide' ? 'display:none!important' : 'opacity:.3;outline:1px dashed currentColor'}}}`)
  }
  return rules.join('')
}

/** Returns a copy of `visibility` with one device toggled (section-wide, or for one field). */
export const withDeviceHidden = (
  visibility: unknown,
  device: VisibilityDevice,
  hidden: boolean,
  field?: string,
): DeviceVisibility => {
  const v = { ...asVisibility(visibility) }
  const apply = (map: DeviceMap | undefined): DeviceMap | undefined => {
    const next: DeviceMap = { ...(map ?? {}) }
    if (hidden) next[device] = false
    else delete next[device]
    return Object.keys(next).length ? next : undefined
  }
  if (field) {
    const fields = { ...(v.fields ?? {}) }
    const next = apply(fields[field])
    if (next) fields[field] = next
    else delete fields[field]
    if (Object.keys(fields).length) v.fields = fields
    else delete v.fields
  } else {
    const next = apply(v.devices)
    if (next) v.devices = next
    else delete v.devices
  }
  return v
}

const sanitizeDeviceMap = (value: unknown): DeviceMap | undefined => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return undefined
  const map: DeviceMap = {}
  for (const device of VISIBILITY_DEVICES) if ((value as DeviceMap)[device] === false) map[device] = false
  return Object.keys(map).length ? map : undefined
}

/** Keeps only the visibility keys the renderer understands, so editor payloads can't store arbitrary JSON. */
export const sanitizeVisibility = (value: unknown): DeviceVisibility => {
  const v = asVisibility(value)
  const out: DeviceVisibility = {}
  if (v.hidden === true) out.hidden = true
  if (Array.isArray(v.locales)) {
    const locales = v.locales.filter((locale): locale is string => typeof locale === 'string' && /^[a-z]{2}(-[A-Za-z]{2})?$/.test(locale))
    if (locales.length) out.locales = locales
  }
  const devices = sanitizeDeviceMap(v.devices)
  if (devices) out.devices = devices
  const fields: Record<string, DeviceMap> = {}
  for (const [name, map] of Object.entries(v.fields && typeof v.fields === 'object' ? v.fields : {})) {
    const clean = SAFE_NAME.test(name) ? sanitizeDeviceMap(map) : undefined
    if (clean) fields[name] = clean
  }
  if (Object.keys(fields).length) out.fields = fields
  return out
}
