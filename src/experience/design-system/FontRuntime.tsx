import React from 'react'

/**
 * Renders @font-face rules for an App's DesignSystem fonts instead of hardcoding a font stack per
 * site. `styles.css` reads `--font-family` (falling back to its existing hardcoded stack — see
 * DesignSystemRuntime), so a Font with no usable file simply doesn't change anything: no crash,
 * no visual regression.
 *
 * Note: `getPageDTO` fetches `design-system-fonts` at depth 2, which populates the
 * joined `font` doc and its `file`. Missing or unresolved files are skipped.
 */

type FontFile = { url?: string | null; mimeType?: string | null } | number | string | null | undefined

export type FontEntry = {
  font?: {
    family?: string | null
    weight?: number | null
    style?: string | null
    file?: FontFile
  } | null
} & Record<string, unknown>

const asFontFile = (value: FontFile): { url: string; mimeType?: string | null } | null =>
  value && typeof value === 'object' && typeof value.url === 'string' ? { url: value.url, mimeType: value.mimeType } : null

const formatFromMime = (mimeType?: string | null): string => {
  if (!mimeType) return 'woff2'
  if (mimeType.includes('woff2')) return 'woff2'
  if (mimeType.includes('woff')) return 'woff'
  if (mimeType.includes('truetype') || mimeType.includes('ttf')) return 'truetype'
  if (mimeType.includes('opentype') || mimeType.includes('otf')) return 'opentype'
  return 'woff2'
}

// Same escaping rule as DesignSystemRuntime: token/font metadata is CMS-editor-controlled, not
// end-user input, but we still keep it out of the raw inline <style> markup.
const safe = (value: string) => value.replace(/[<>]/g, '')

// Font records may have been authored from the Experience host.  Rendering those absolute
// media URLs on a branded public host makes browsers enforce cross-origin font CORS.  Payload
// serves the same media route on the current host, so retain only its pathname and query.
const publicFontURL = (value: string) => {
  try {
    const parsed = new URL(value)
    return parsed.pathname.startsWith('/api/media/') ? `${parsed.pathname}${parsed.search}` : value
  } catch {
    return value
  }
}

export function fontPreloadResources(fonts: FontEntry[] | null | undefined, families: string[]) {
  const wanted = new Set(families.map((family) => family.toLowerCase()))
  const seen = new Set<string>()
  return (fonts ?? []).flatMap((entry) => {
    const font = entry.font
    const file = asFontFile(font?.file)
    if (!font?.family || !wanted.has(font.family.toLowerCase()) || !file) return []
    const href = publicFontURL(file.url)
    if (seen.has(href)) return []
    seen.add(href)
    return [{ href, type: file.mimeType ?? undefined }]
  })
}

export function fontsToCSS(fonts: FontEntry[] | null | undefined): string {
  if (!fonts?.length) return ''
  const rules = fonts
    .map((entry) => {
      const font = entry.font
      const file = asFontFile(font?.file)
      const family = font?.family
      if (!font || !file || !family) return ''
      const weight = typeof font.weight === 'number' ? font.weight : 400
      const style = font.style === 'italic' || font.style === 'oblique' ? font.style : 'normal'
      return `@font-face {\n  font-family: '${safe(family)}';\n  src: url('${safe(publicFontURL(file.url))}') format('${formatFromMime(file.mimeType)}');\n  font-weight: ${weight};\n  font-style: ${style};\n  font-display: swap;\n}`
    })
    .filter(Boolean)
  return rules.join('\n')
}

export function FontStyle({ fonts }: { fonts: FontEntry[] | null | undefined }) {
  const css = fontsToCSS(fonts)
  if (!css) return null
  // eslint-disable-next-line react/no-danger -- static @font-face CSS built entirely from fontsToCSS above
  return <style dangerouslySetInnerHTML={{ __html: css }} />
}
