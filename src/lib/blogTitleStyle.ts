export type BlogTitleStyle = { align?: 'left' | 'center' | 'right'; size?: 'h1' | 'h2' | 'h3'; color?: string }

/** Presentation of the article title: only governed choices (alignment, size, color token name). */
export const cleanTitleStyle = (value: unknown): BlogTitleStyle | null => {
  if (!value || typeof value !== 'object') return null
  const raw = value as Record<string, unknown>
  const align = (['left', 'center', 'right'] as const).find((item) => item === raw.align)
  const size = (['h1', 'h2', 'h3'] as const).find((item) => item === raw.size)
  const color = typeof raw.color === 'string' && /^[A-Za-z0-9_-]{1,40}$/.test(raw.color) ? raw.color : undefined
  return align || size || color ? { ...(align ? { align } : {}), ...(size ? { size } : {}), ...(color ? { color } : {}) } : null
}
