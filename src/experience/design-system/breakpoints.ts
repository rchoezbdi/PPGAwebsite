import siteTheme from './siteTheme.json'

const pixels = (value: unknown, fallback: number) => {
  const parsed = Number.parseFloat(String(value ?? ''))
  return Number.isFinite(parsed) ? parsed : fallback
}

const tokens = siteTheme.tokens.breakpoints as Record<string, string>

/** Largest mobile viewport and largest tablet viewport, from `tokens.breakpoints` in siteTheme.json. */
export const mobileMax = pixels(tokens.mobileMax, 640)
export const tabletMax = pixels(tokens.tabletMax, 1024)

/** Media queries shared by scripts and markup; styles.css resolves the same tokens at build time. */
export const mediaQueries = {
  mobile: `(max-width: ${mobileMax}px)`,
  tablet: `(min-width: ${mobileMax + 1}px) and (max-width: ${tabletMax}px)`,
  desktop: `(min-width: ${tabletMax + 1}px)`,
  aboveMobile: `(min-width: ${mobileMax + 1}px)`,
  desktopOrMobile: `(min-width: ${tabletMax + 1}px), (max-width: ${mobileMax}px)`,
} as const
