import 'server-only'
import type { SitePageResponse } from '@/contracts/site'
import { SITE_API_VERSION } from '@/contracts/site'

export function dxpURL(path: string): URL {
  const configured = process.env.DXP_URL
  if (!configured) throw new Error('Configure DXP_URL with the DXP server URL.')
  const origin = new URL(configured)
  if (!['http:', 'https:'].includes(origin.protocol) || origin.username || origin.password) throw new Error('DXP_URL must be an HTTP(S) origin without credentials.')
  if (process.env.NODE_ENV === 'production' && origin.protocol !== 'https:') throw new Error('DXP_URL must use HTTPS in production.')
  return new URL(path, origin.origin)
}

export function dxpHeaders(requestedAppSlug?: string): Headers {
  const key = process.env.DXP_SITE_API_KEY
  if (!key || key.length < 40) throw new Error('Configure DXP_SITE_API_KEY as a server-only site credential.')
  const appSlug = requestedAppSlug?.trim() || process.env.SITE_APP?.trim()
  if (appSlug && !/^[a-z0-9][a-z0-9-]{0,79}$/i.test(appSlug)) throw new Error('SITE_APP must be a valid application slug.')
  const headers = new Headers({ authorization: `Bearer ${key}` })
  if (appSlug) headers.set('x-dxp-app', appSlug)
  return headers
}

export async function runtime<T>(params: Record<string, string>): Promise<T | null> {
  const url = dxpURL('/api/site-runtime')
  url.search = new URLSearchParams(params).toString()
  const response = await fetch(url, { headers: dxpHeaders(params.app), cache: 'no-store', signal: AbortSignal.timeout(15000) })
  if (response.status === 404) return null
  if (!response.ok) throw new Error(`DXP Site API responded ${response.status}.`)
  return response.json() as Promise<T>
}

export async function loadPage(app: string, slug: string, locale: string) {
  const page = await runtime<SitePageResponse>({ resource: 'page', app, slug, locale })
  if (page && (page.apiVersion !== SITE_API_VERSION || page.page.status !== 'published')) throw new Error('Unsupported or non-public DXP response.')
  return page
}

export type SiteRoute = { appSlug: string; basePath: string; defaultLocale: string; hasLocalePrefix: boolean }
export async function siteRoute(host: string, path: string) {
  return process.env.SITE_APP
    ? runtime<SiteRoute>({ resource: 'app', app: process.env.SITE_APP })
    : runtime<SiteRoute>({ resource: 'host', host, path })
}
