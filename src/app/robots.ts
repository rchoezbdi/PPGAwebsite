import type { MetadataRoute } from 'next'
import { headers } from 'next/headers'
import { runtime } from '@/lib/dxp'
export const dynamic = 'force-dynamic'
export default async function robots(): Promise<MetadataRoute.Robots> {
  const host = (await headers()).get('host') ?? ''
  const sitemap = await runtime<{ origin: string }>({ resource: 'sitemap', host })
  return sitemap ? { rules: { userAgent: '*', allow: '/', disallow: ['/api/', '/share/', '/site-render/'] }, sitemap: `${sitemap.origin}/sitemap.xml` } : { rules: { userAgent: '*', disallow: '/' } }
}
