import { cache } from 'react'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { PageRenderer } from '@/experience/renderer/PageRenderer'
import { loadPage } from '@/lib/dxp'

export const dynamic = 'force-dynamic'
const resolve = cache(loadPage)
type Props = { params: Promise<{ site: string; slug?: string[] }>; searchParams: Promise<{ locale?: string }> }
const text = (value: unknown) => typeof value === 'string' ? value.trim() : ''
function heroDescription(components: Array<{ code: string; content: Record<string, unknown> }>) {
  const hero = components.find(component => component.code === 'hero')
  if (!hero) return ''
  for (const candidate of [...(Array.isArray(hero.content.slides) ? hero.content.slides : []), hero.content]) {
    if (!candidate || typeof candidate !== 'object') continue
    for (const key of ['description', 'subtitle', 'body']) {
      const copy = text((candidate as Record<string, unknown>)[key]).replace(/\s+/g, ' ')
      if (copy) return copy.length > 160 ? `${copy.slice(0, 157).trimEnd()}...` : copy
    }
  }
  return ''
}

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const [{ site, slug }, { locale = 'en' }] = await Promise.all([params, searchParams])
  const data = await resolve(site, slug?.join('/') ?? '', locale)
  if (!data) return {}
  const seo = data.page.seo
  const defaults = data.defaultSeo
  const title = text(seo.metaTitle)
  const description = text(seo.description) || text(seo.metaDescription) || text(seo.ogDescription) || text(defaults.description) || text(defaults.metaDescription) || text(defaults.ogDescription) || heroDescription(data.page.components) || data.page.title
  const canonical = text(seo.canonicalURL)
  const robots = text(seo.robots) || text(defaults.robots)
  return { ...(title ? { title } : {}), ...(description ? { description } : {}), ...(canonical ? { alternates: { canonical } } : {}),
    ...(robots ? { robots: { index: !robots.startsWith('noindex'), follow: !robots.endsWith('nofollow') } } : {}),
    ...(data.favicon ? { icons: { icon: [{ url: data.favicon.url, type: data.favicon.mimeType ?? 'image/png' }] } } : {}),
  }
}
export default async function PublicPage({ params, searchParams }: Props) {
  const [{ site, slug }, { locale = 'en' }] = await Promise.all([params, searchParams])
  const data = await resolve(site, slug?.join('/') ?? '', locale)
  if (!data) notFound()
  return <PageRenderer page={data.page} site={data.site} locale={data.locale} />
}
