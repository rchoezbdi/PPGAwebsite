import type { CSSProperties } from 'react'
import { cornerRadiusCSS, readCornerRadius, type CornerRadius } from './cornerRadius'

export type BlogCoverStyle = {
  alt?: string
  borderRadius?: CornerRadius
  fit?: 'cover' | 'contain'
  position?: 'center' | 'top' | 'bottom' | 'left' | 'right'
  aspectRatio?: '16 / 9' | '4 / 3' | '3 / 2' | '1 / 1' | 'auto'
}

const pick = <T extends string>(options: readonly T[], value: unknown): T | undefined => options.find((option) => option === value)

/** Presentation of the article cover: only governed choices, never free-form CSS. */
export const cleanCoverStyle = (value: unknown): BlogCoverStyle | null => {
  if (!value || typeof value !== 'object') return null
  const raw = value as Record<string, unknown>
  const alt = typeof raw.alt === 'string' ? raw.alt.replace(/[<>]/g, '').trim().slice(0, 200) : ''
  const radius = raw.borderRadius && typeof raw.borderRadius === 'object' ? readCornerRadius(raw.borderRadius) : undefined
  const squared = radius && !radius.topLeft && !radius.topRight && !radius.bottomRight && !radius.bottomLeft
  const style: BlogCoverStyle = {
    ...(alt ? { alt } : {}),
    ...(radius && !squared ? { borderRadius: radius } : {}),
    ...(pick(['cover', 'contain'] as const, raw.fit) ? { fit: pick(['cover', 'contain'] as const, raw.fit) } : {}),
    ...(pick(['center', 'top', 'bottom', 'left', 'right'] as const, raw.position) ? { position: pick(['center', 'top', 'bottom', 'left', 'right'] as const, raw.position) } : {}),
    ...(pick(['16 / 9', '4 / 3', '3 / 2', '1 / 1', 'auto'] as const, raw.aspectRatio) ? { aspectRatio: pick(['16 / 9', '4 / 3', '3 / 2', '1 / 1', 'auto'] as const, raw.aspectRatio) } : {}),
  }
  return Object.keys(style).length ? style : null
}

/** CSS variables the cover rules in styles.css read; empty when nothing was customised. */
export const coverStyleVars = (style: BlogCoverStyle | null | undefined): CSSProperties => {
  if (!style) return {}
  const vars: Record<string, string> = {}
  const radius = cornerRadiusCSS(style.borderRadius)
  if (radius) vars['--cover-radius'] = radius
  if (style.aspectRatio) vars['--cover-ratio'] = style.aspectRatio
  if (style.fit) vars['--cover-fit'] = style.fit
  if (style.position) vars['--cover-position'] = style.position
  return vars as CSSProperties
}
