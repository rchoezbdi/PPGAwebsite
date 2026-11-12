import siteTheme from './siteTheme.json'

/**
 * Resolves content-provided design values to Design System tokens. Content may name a token
 * (`color.brand`, `space.4`, `radius.md`) or carry a legacy raw value from older pages; a raw value
 * is mapped to the nearest token so no arbitrary colour, spacing or radius reaches the markup.
 */
const tokens = siteTheme.tokens as { colors: Record<string, string>; spacing: Record<string, string>; radius: Record<string, string> }

const pixels = (value: unknown): number | null => {
  const parsed = Number.parseFloat(String(value ?? ''))
  return Number.isFinite(parsed) ? parsed : null
}

const nearest = (entries: Array<[string, number]>, target: number) =>
  entries.reduce((best, entry) => (Math.abs(entry[1] - target) < Math.abs(best[1] - target) ? entry : best))[0]

const scale = (group: Record<string, string>, include: (name: string) => boolean) =>
  Object.entries(group).flatMap(([name, value]) => (include(name) && pixels(value) !== null ? [[name, pixels(value) as number] as [string, number]] : []))

const spacingScale = scale(tokens.spacing, (name) => /^\d+$/.test(name))
const radiusScale = scale(tokens.radius, () => true)

const named = (value: unknown, prefix: string) => {
  const match = new RegExp(`^${prefix}[.-]([\\w-]+)$`).exec(String(value ?? '').trim())
  return match?.[1]
}

/** `space.4` / `--space-4` / `4` name a token; any other number is a legacy pixel value. */
export const spacingToken = (value: unknown, fallback = '4'): string => {
  const token = named(value, 'space') ?? named(String(value ?? '').replace(/^--/, ''), 'space')
  if (token && token in tokens.spacing) return `var(--space-${token})`
  const px = pixels(value)
  return `var(--space-${px === null ? fallback : nearest(spacingScale, px)})`
}

/** Radius token name (`radius.md`, `md`) or a legacy pixel value / corner object; undefined when square. */
export const radiusToken = (value: unknown): string | undefined => {
  const text = typeof value === 'string' ? value.trim() : ''
  const token = named(text, 'radius') ?? text
  if (token in tokens.radius) return token === 'none' ? undefined : `var(--radius-${token})`
  const corners = value && typeof value === 'object' ? Object.values(value as Record<string, unknown>).map(pixels) : [pixels(value)]
  if (!corners.some((corner) => corner !== null && corner > 0)) return undefined
  const rounded = corners.map((corner) => corner === null ? 0 : Math.min(Math.max(Math.round(corner), 0), 200))
  const matching = Object.entries(tokens.radius).find(([, tokenValue]) => {
    const px = pixels(tokenValue) ?? 0
    return rounded.every((corner) => corner === px)
  })
  if (matching) return `var(--radius-${matching[0]})`
  const uniform = rounded.every((corner) => corner === rounded[0])
  return uniform && rounded[0] > 0 ? `var(--radius-${nearest(radiusScale, rounded[0])})` : `var(--radius-${nearest(radiusScale, Math.max(...rounded))})`
}

const rgb = (value: string): [number, number, number] | null => {
  const hex = /^#([\da-f]{3}|[\da-f]{6})$/i.exec(value.trim())?.[1]
  if (hex) {
    const full = hex.length === 3 ? [...hex].map((digit) => digit + digit).join('') : hex
    return [0, 2, 4].map((index) => Number.parseInt(full.slice(index, index + 2), 16)) as [number, number, number]
  }
  const functional = /^rgba?\(\s*(\d+)[\s,]+(\d+)[\s,]+(\d+)/i.exec(value.trim())
  return functional ? [Number(functional[1]), Number(functional[2]), Number(functional[3])] : null
}

const colorPalette = Object.entries(tokens.colors).flatMap(([name, value]) => { const channels = rgb(value); return channels ? [[name, channels] as [string, [number, number, number]]] : [] })

/** `color.brand`, a bare token name (`brand`, `var(--brand)`), or a legacy hex/rgb colour mapped to the nearest token. */
export const colorToken = (value: unknown, fallback: string): string => {
  const raw = String(value ?? '').trim()
  const name = named(raw, 'color') ?? /^var\(--([\w-]+)\)$/.exec(raw)?.[1] ?? raw
  if (name in tokens.colors) return `var(--ds-color-${name})`
  const channels = rgb(raw)
  if (!channels) return fallback
  const distance = (candidate: [number, number, number]) => candidate.reduce((sum, channel, index) => sum + (channel - channels[index]) ** 2, 0)
  return `var(--ds-color-${colorPalette.reduce((best, entry) => (distance(entry[1]) < distance(best[1]) ? entry : best))[0]})`
}
