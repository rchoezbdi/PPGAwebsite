import type { MetadataRoute } from 'next'
import { headers } from 'next/headers'
import { runtime } from '@/lib/dxp'
export const dynamic = 'force-dynamic'
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const host = (await headers()).get('host') ?? ''
  return (await runtime<{ entries: MetadataRoute.Sitemap }>({ resource: 'sitemap', host }))?.entries ?? []
}
