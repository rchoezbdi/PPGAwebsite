export type CornerRadius = { topLeft: number; topRight: number; bottomRight: number; bottomLeft: number }

const MAX_RADIUS = 200
const clean = (value: unknown) => {
  const number = typeof value === 'string' ? Number(value) : value
  return typeof number === 'number' && Number.isFinite(number) ? Math.min(Math.max(Math.round(number), 0), MAX_RADIUS) : 0
}

/** Four independent corners, all starting at 0. A legacy single number applies to the four corners. */
export const readCornerRadius = (value: unknown): CornerRadius => {
  if (typeof value === 'number' || typeof value === 'string') {
    const all = clean(value)
    return { topLeft: all, topRight: all, bottomRight: all, bottomLeft: all }
  }
  const raw = (value && typeof value === 'object' ? value : {}) as Record<string, unknown>
  return { topLeft: clean(raw.topLeft), topRight: clean(raw.topRight), bottomRight: clean(raw.bottomRight), bottomLeft: clean(raw.bottomLeft) }
}

/** CSS `border-radius` shorthand (top-left, top-right, bottom-right, bottom-left), or undefined when square. */
export const cornerRadiusCSS = (value: unknown): string | undefined => {
  const { topLeft, topRight, bottomRight, bottomLeft } = readCornerRadius(value)
  return topLeft || topRight || bottomRight || bottomLeft ? `${topLeft}px ${topRight}px ${bottomRight}px ${bottomLeft}px` : undefined
}
