import React from 'react'
import siteTheme from './siteTheme.json'
import { mediaQueries, mobileMax, tabletMax } from './breakpoints'

/**
 * Converts the site's own design tokens into the CSS custom properties read by styles.css.
 * siteTheme.json is owned by this frontend; page content from the DXP cannot override it.
 */

type TokenGroup = Record<string, unknown>
export type DesignTokens = {
  colors?: TokenGroup
  typography?: TokenGroup
  spacing?: TokenGroup
  radius?: TokenGroup
  shadows?: TokenGroup
  breakpoints?: TokenGroup
} & Record<string, unknown>

// Strips angle brackets so a token value can't break out of the inline <style> tag it's rendered into.
const str = (value: unknown): string | undefined => {
  if (value && typeof value === 'object' && !Array.isArray(value) && 'value' in value) {
    return str((value as { value: unknown }).value)
  }
  if (typeof value === 'number' && Number.isFinite(value)) return `${value}px`
  if (typeof value !== 'string') return undefined
  const trimmed = value.replace(/[<>]/g, '').trim()
  return trimmed || undefined
}

const lineHeight = (value: unknown): string | undefined => {
  if (value && typeof value === 'object' && !Array.isArray(value) && 'value' in value)
    return lineHeight((value as { value: unknown }).value)
  return typeof value === 'number' && Number.isFinite(value) ? String(value) : str(value)
}

// A token stored as {value, tablet, mobile} carries
// its narrower-width overrides here; a plain string/number token simply has none.
const strAt = (value: unknown, key: 'tablet' | 'mobile'): string | undefined =>
  value && typeof value === 'object' && !Array.isArray(value) && key in value
    ? str((value as Record<string, unknown>)[key])
    : undefined

const cssVar = (name: string, value: string | undefined) => (value ? `  ${name}: ${value};\n` : '')

/** One CSS variable per token of a scale (`--space-4`, `--radius-lg`, ...), so every token is usable. */
const scale = (prefix: string, group: TokenGroup, keys: RegExp = /^[A-Za-z0-9_-]+$/) =>
  Object.entries(group).filter(([name]) => keys.test(name)).map(([name, value]) => cssVar(`${prefix}${name}`, str(value))).join('')

// Same token, same CSS var name, three widths. Desktop is the `:root` baseline; tablet/mobile
// only exist if the site token sets them, so a token without overrides emits
// nothing here and keeps rendering as one fixed size at every width (pre-existing behavior).
const cappedFontSize = (value: unknown): string | undefined => {
  const size = str(value)
  return size ? `min(48px, ${size})` : undefined
}

const responsiveFontVar = (name: string, value: unknown) => ({
  base: cssVar(name, cappedFontSize(value)),
  tablet: cssVar(name, cappedFontSize(strAt(value, 'tablet'))),
  mobile: cssVar(name, cappedFontSize(strAt(value, 'mobile'))),
})

export function designTokensToCSS(tokens: DesignTokens | null | undefined): string {
  if (!tokens) return ''
  const colors = (tokens.colors ?? {}) as TokenGroup
  const typography = (tokens.typography ?? {}) as TokenGroup
  const spacing = (tokens.spacing ?? {}) as TokenGroup
  const radius = (tokens.radius ?? {}) as TokenGroup
  const shadows = (tokens.shadows ?? {}) as TokenGroup
  const customColors = Object.entries(colors).map(([name, value]) => {
    const tokenName = name.replace(/[^a-zA-Z0-9_-]/g, '-')
    return cssVar(`--ds-color-${tokenName}`, str(value))
  }).join('')

  const typeVars = ([
    ['--type-display', typography.display],
    ['--type-heading-1', typography.heading1],
    ['--type-heading-2', typography.heading2],
    ['--type-heading-3', typography.heading3],
    ['--type-heading-4', typography.heading4],
    ['--type-body-large', typography.bodyLarge],
    ['--type-body', typography.body],
    ['--type-body-small', typography.bodySmall],
    ['--type-caption', typography.caption],
  ] as const).map(([name, value]) => responsiveFontVar(name, value))
  const typeBase = typeVars.map((v) => v.base).join('')
  const typeTablet = typeVars.map((v) => v.tablet).join('')
  const typeMobile = typeVars.map((v) => v.mobile).join('')

  const accent = str(colors.accent)
  const brand = str(colors.brand)
  const highlight = str(colors['text-highlight'])
  const surface = str(colors.surface)
  const black = str(colors.black)
  const surfaceAlt = str(colors.surfaceAlt)
  // Semantic colors: status colors and the two neutral greys (one token per physical HEX).
  const danger = str(colors.danger)
  const success = str(colors.success)
  const warning = str(colors.warning)
  const neutral = str(colors.neutral)
  const neutralSoft = str(colors['neutral-soft'] ?? colors.neutralSoft)
  const body = customColors +
    cssVar('--brand', str(colors.brand)) +
    cssVar('--brand-bright', accent) +
    cssVar('--brand-hover', highlight) +
    cssVar('--action-primary', brand) +
    cssVar('--action-primary-hover', highlight) +
    cssVar('--action-secondary', accent) +
    cssVar('--action-danger', brand) +
    cssVar('--action-on-primary', surface) +
    cssVar('--text-highlight', highlight) +
    cssVar('--surface', surface) +
    cssVar('--surface-dark', brand) +
    cssVar('--text-dark', black ?? brand) +
    cssVar('--text-muted', brand) +
    cssVar('--border', surfaceAlt) +
    cssVar('--surface-alt', surfaceAlt) +
    cssVar('--danger', danger) +
    cssVar('--success', success) +
    cssVar('--warning', warning) +
    cssVar('--neutral', neutral) +
    cssVar('--neutral-soft', neutralSoft) +
    cssVar('--button-primary-bg', accent) +
    cssVar('--button-primary-bg-hover', highlight) +
    cssVar('--button-primary-bg-pressed', brand) +
    cssVar('--button-primary-text', brand) +
    cssVar('--button-secondary-bg', brand) +
    cssVar('--button-secondary-bg-hover', highlight) +
    cssVar('--button-secondary-text', surface) +
    cssVar('--text-inverse', surface) +
    cssVar('--font-family', str(typography.fontFamily)) +
    cssVar('--font-display', str(typography.fontDisplay ?? typography.fontFamily)) +
    typeBase +
    cssVar('--line-height-heading', lineHeight(typography.lineHeightHeading)) +
    cssVar('--line-height-tight', lineHeight(typography.lineHeightTight)) +
    cssVar('--line-height-body', lineHeight(typography.lineHeightBody)) +
    cssVar('--content-max', str(spacing.contentMax)) +
    scale('--space-', spacing, /^\d+$/) +
    scale('--radius-', radius) +
    scale('--shadow-', shadows)

  if (!body) return ''
  // Tablet/mobile blocks come after :root and after each other, so the cascade — not
  // specificity — picks the narrowest match; a token with no override at a given width just
  // keeps whatever the wider block (or :root) already set.
  return `:root {\n${body}}`
    + (typeTablet ? `\n@media (max-width: ${tabletMax}px) {\n:root {\n${typeTablet}}\n}` : '')
    + (typeMobile ? `\n@media (max-width: ${mobileMax}px) {\n:root {\n${typeMobile}}\n}` : '')
}

/**
 * Base values cover missing site tokens and routes such as 404 and password screens.
 * The site-owned theme follows this block in the cascade.
 */
export const DEFAULT_DESIGN_TOKENS: DesignTokens = {
  colors: {
    accent: '#00C3FF',
    brand: '#0B2159',
    'text-highlight': '#007BAA',
    surface: '#FFFFFF',
    black: '#000000',
    surfaceAlt: '#F5F9FC',
    danger: '#D5372F',
    success: '#15803D',
    warning: '#D97706',
    neutral: '#626A78',
    'neutral-soft': '#CBD5E1',
  },
  typography: {
    display: '48px',
    heading1: '48px',
    heading2: '40px',
    heading3: '32px',
    heading4: '24px',
    bodyLarge: '18px',
    body: '16px',
    bodySmall: '14px',
    caption: '12px',
    lineHeightHeading: 1.25,
    lineHeightTight: 1.15,
    lineHeightBody: 1.6,
  },
  spacing: { contentMax: '76rem', '0': '0px', '1': '0.25rem', '2': '0.5rem', '3': '0.75rem', '4': '1rem', '5': '1.25rem', '6': '1.5rem', '8': '2rem', '10': '2.5rem', '12': '3rem', '16': '4rem', '20': '5rem', '24': '6rem' },
  radius: { lg: '1.25rem', md: '0.75rem', sm: '0.5rem' },
  shadows: {
    card: '0 10px 30px -10px #0f172a14',
    hover: '0 20px 40px -12px #0e74f42e',
  },
}

/** Rendered once by the public layout so every route (including 404 and auth screens) has the variables. */
export function DesignSystemBaseStyle() {
  return <><DesignSystemStyle tokens={DEFAULT_DESIGN_TOKENS} /><DesignSystemStyle tokens={siteTheme.tokens as DesignTokens} /></>
}

export function DesignSystemStyle({ tokens }: { tokens: DesignTokens | null | undefined }) {
  const css = designTokensToCSS(tokens)
  if (!css) return null
  // eslint-disable-next-line react/no-danger -- static CSS text built entirely from designTokensToCSS above, no raw user HTML
  return <style dangerouslySetInnerHTML={{ __html: css }} />
}

type ButtonRecipe = {
  background?: unknown
  backgroundHover?: unknown
  backgroundPressed?: unknown
  textColor?: unknown
  textColorHover?: unknown
  textColorPressed?: unknown
  borderColor?: unknown
  borderColorHover?: unknown
  borderColorPressed?: unknown
}

/** Emits scoped variables for the one shared Button atom from this site's theme. */
export function ButtonRecipeStyle({ style }: { style: Record<string, unknown> | undefined }) {
  const variants = style?.variants
  if (!variants || typeof variants !== 'object') return null
  const recipe = variants as Record<string, ButtonRecipe>
  const body = (['primary', 'secondary', 'outline', 'white'] as const).map((name) => {
    const value = recipe[name] ?? {}
    return cssVar(`--button-${name}-bg`, str(value.background))
      + cssVar(`--button-${name}-bg-hover`, str(value.backgroundHover))
      + cssVar(`--button-${name}-bg-pressed`, str(value.backgroundPressed))
      + cssVar(`--button-${name}-text`, str(value.textColor))
      + cssVar(`--button-${name}-text-hover`, str(value.textColorHover))
      + cssVar(`--button-${name}-text-pressed`, str(value.textColorPressed))
      + cssVar(`--button-${name}-border`, str(value.borderColor))
      + cssVar(`--button-${name}-border-hover`, str(value.borderColorHover))
      + cssVar(`--button-${name}-border-pressed`, str(value.borderColorPressed))
  }).join('')
    + cssVar('--button-radius', str(style?.borderRadius))
    + cssVar('--button-radius-top-left', str(style?.borderRadiusTopLeft))
    + cssVar('--button-radius-top-right', str(style?.borderRadiusTopRight))
    + cssVar('--button-radius-bottom-right', str(style?.borderRadiusBottomRight))
    + cssVar('--button-radius-bottom-left', str(style?.borderRadiusBottomLeft))
  // Height / font size / weight are governed per device with the same breakpoints the Hero uses.
  const sizing = (device: 'Desktop' | 'Tablet' | 'Mobile') => {
    const size = (key: string, unit: string) => {
      const value = Number(style?.[`${key}${device}`])
      return Number.isFinite(value) && value > 0 ? `${value}${unit}` : undefined
    }
    return cssVar('--button-height', size('height', 'px'))
      + cssVar('--button-font-size', size('fontSize', 'px'))
      + cssVar('--button-font-weight', size('fontWeight', ''))
  }
  const sizingBlocks = ([['Desktop', mediaQueries.desktop], ['Tablet', mediaQueries.tablet], ['Mobile', mediaQueries.mobile]] as const)
    .map(([device, media]) => ({ media, vars: sizing(device) }))
    .filter(({ vars }) => vars)
    .map(({ media, vars }) => `@media ${media} {\n.page-renderer {\n${vars}}\n}\n`)
    .join('')
  if (!body && !sizingBlocks) return null
  // eslint-disable-next-line react/no-danger -- values have passed through str(), which removes HTML delimiters.
  return <style dangerouslySetInnerHTML={{ __html: `.page-renderer {\n${body}}\n${sizingBlocks}` }} />
}
