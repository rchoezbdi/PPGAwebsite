export type LocalizedRoutes = Record<string, Record<string, string>>

export type LocalizedPage = {
  id: string | number
  slug: string
  locale: string
  translationGroup?: string | null
  isHome?: boolean
}

/** Index every published App page by ID and source slug, with destinations in its own locales. */
export function buildLocalizedRoutes(pages: LocalizedPage[], options: { prefixLocale?: boolean } = {}): LocalizedRoutes {
  const groups = new Map<string, LocalizedPage[]>()
  for (const page of pages) {
    const key = page.translationGroup || `slug:${page.slug}`
    groups.set(key, [...(groups.get(key) ?? []), page])
  }
  const routes: LocalizedRoutes = {}
  for (const pagesInGroup of groups.values()) {
    const destinations = Object.fromEntries(pagesInGroup.map((page) => [
      page.locale,
      `${options.prefixLocale === false ? '' : `/${page.locale}`}${page.isHome ? '' : `/${page.slug}`}` || '/',
    ]))
    for (const page of pagesInGroup) {
      routes[`id:${page.id}`] = destinations
      routes[`slug:${page.slug}`] = destinations
    }
  }
  return routes
}
