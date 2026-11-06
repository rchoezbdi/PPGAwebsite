import type { LocalizedRoutes } from './localizedRoutes'

type PageRelationship = number | string | { id?: number | string | null; slug?: string | Record<string, string | undefined> | null } | null | undefined

export type ResolvedNavigationLink = { label?: string; href: string | null; isExternal: boolean; newWindow: boolean }

const empty = (): ResolvedNavigationLink => ({ href: null, isExternal: false, newWindow: false })
const internal = (href: string | null): ResolvedNavigationLink => ({ href, isExternal: false, newWindow: false })
const localAppPath = (href: string, fallbackSite?: string | null): string => {
  if (process.env.NODE_ENV === 'production' || fallbackSite !== 'ppga' || !href.startsWith('/')) return href
  if (href === '/ppga' || href.startsWith('/ppga/')) return href
  return `/ppga${href === '/' ? '' : href}`
}
const locales = new Set(['en', 'es', 'pt'])
const withoutLegacyLocale = (suffix: string): string => {
  if (!suffix.startsWith('?')) return suffix
  const [query, hash] = suffix.slice(1).split('#', 2)
  const params = new URLSearchParams(query)
  params.delete('locale')
  return `${params.size ? `?${params}` : ''}${hash ? `#${hash}` : ''}`
}

/** Keep links back into the local public sites on localhost so editors can test
 * content without leaving the development server for the production preview. */
const localDevelopmentHref = (url: string, fallbackSite?: string | null): string | null => {
  if (process.env.NODE_ENV === 'production') return null
  try {
    const parsed = new URL(url)
    const hostname = parsed.hostname.toLowerCase()
    const isBDIL = [
      'preview.bestdoctorsinsurance.com',
      'experience.bestdoctorsinsurance.com',
      'bestdoctorsinsurance.com',
      'www.bestdoctorsinsurance.com',
    ].includes(hostname)
    const isPPGA = hostname === 'previewppga.bestdoctors.ec'
    if (!isBDIL && !isPPGA) return null
    if (parsed.pathname.startsWith('/wp-content/uploads/')) return null
    const app = isPPGA ? 'ppga' : (fallbackSite === 'ppga' ? 'ppga' : 'home')
    let path = parsed.pathname.replace(/^\/(?:en|es|pt)(?=\/|$)/, '')
    if (app === 'home' && !path) path = '/'
    const locale = parsed.pathname.match(/^\/(en|es|pt)(?:\/|$)/)?.[1] ?? (app === 'ppga' ? 'es' : 'en')
    const query = new URLSearchParams(parsed.search)
    query.set('locale', locale)
    const suffix = `${query.size ? `?${query}` : ''}${parsed.hash}`
    return app === 'ppga' ? `/ppga${path === '/' ? '' : path}${suffix}` : `/${locale}${path === '/' ? '' : path}${suffix}`
  } catch {
    return null
  }
}

const localizedValue = (value: unknown, locale: string): string | undefined => {
  if (typeof value === 'string') return value
  if (value && typeof value === 'object') {
    const record = value as Record<string, string | undefined>
    return record[locale] ?? record.es ?? record.en ?? record.pt
  }
  return undefined
}

/** Resolve CMS page relationships and older stored URLs against published pages in this App. */
export const resolveExperienceLink = ({ linkType, page, url, locale = 'es', fallbackSite, localizedRoutes }: {
  linkType?: 'internal' | 'external' | 'none' | 'popup' | null
  page?: PageRelationship
  url?: string | null
  locale?: string
  fallbackSite?: string | null
  localizedRoutes?: LocalizedRoutes
}): ResolvedNavigationLink => {
  if (linkType === 'none' || linkType === 'popup') return empty()
  const ppgaAbsolutePath = (value: string): string | null => {
    if (fallbackSite !== 'ppga') return null
    try {
      const parsed = new URL(value)
      if (parsed.hostname.toLowerCase() !== 'previewppga.bestdoctors.ec') return null
      return `${parsed.pathname}${parsed.search}${parsed.hash}`
    } catch { return null }
  }
  if (linkType === 'external' && url && /^(?:[a-z][a-z\d+.-]*:|\/\/)/i.test(url)) {
    const sameAppPath = ppgaAbsolutePath(url)
    if (sameAppPath) return resolveExperienceLink({ url: sameAppPath, locale, fallbackSite, localizedRoutes })
    const localHref = localDevelopmentHref(url, fallbackSite)
    if (localHref) return internal(localHref)
    return { href: url, isExternal: true, newWindow: true }
  }

  if (page != null) {
    const id = typeof page === 'object' ? page.id : page
    const slug = typeof page === 'object' ? localizedValue(page.slug, locale) : undefined
    const routes = (id != null ? localizedRoutes?.[`id:${id}`] : undefined) ?? (slug ? localizedRoutes?.[`slug:${slug}`] : undefined)
    const match = /^([^?#]*)([?#].*)?$/.exec(url ?? '')
    const suffix = withoutLegacyLocale(match?.[2] ?? '')
    if (routes) return internal(routes[locale] ? localAppPath(`${routes[locale]}${suffix}`, fallbackSite) : null)
    if (localizedRoutes) return empty()
    return slug ? internal(`/${locale}${slug === 'home' ? '' : `/${slug}`}`) : empty()
  }

  if (!url) return empty()
  if (/^(?:[a-z][a-z\d+.-]*:|\/\/)/i.test(url)) {
    const sameAppPath = ppgaAbsolutePath(url)
    if (sameAppPath) return resolveExperienceLink({ url: sameAppPath, locale, fallbackSite, localizedRoutes })
    const localHref = localDevelopmentHref(url, fallbackSite)
    if (localHref) return internal(localHref)
    return { href: url, isExternal: true, newWindow: false }
  }
  if (url.startsWith('#') || url.startsWith('?') || url.startsWith('/api/') || url.startsWith('/media/')) return internal(url)

  const match = /^([^?#]*)([?#].*)?$/.exec(url)
  const path = match?.[1] ?? url
  const suffix = withoutLegacyLocale(match?.[2] ?? '')
  const segments = path.split('/').filter(Boolean)
  const isPublicPagePath = segments[0] === fallbackSite || locales.has(segments[0])
  if (isPublicPagePath) segments.shift()
  const slug = segments.join('/') || 'home'
  const routes = localizedRoutes?.[`slug:${slug}`]
  if (routes) return internal(routes[locale] ? localAppPath(`${routes[locale]}${suffix}`, fallbackSite) : null)
  if (!isPublicPagePath) return internal(localAppPath(url, fallbackSite))
  if (localizedRoutes) return empty()
  return internal(`/${locale}${slug === 'home' ? '' : `/${slug}`}${suffix}`)
}
