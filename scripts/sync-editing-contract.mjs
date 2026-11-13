import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

const isValidSlug = (slug) => /^[a-z0-9][a-z0-9-]{0,79}$/i.test(slug)

/** @param {{ env?: Record<string, string | undefined>, fetchImpl?: typeof fetch }} [options] */
export async function syncEditingContract({ env = process.env, fetchImpl = fetch } = {}) {
  const configuredUrl = env.DXP_URL?.trim()
  const apiKey = env.DXP_SITE_API_KEY
  const appSlug = env.DXP_APP_SLUG?.trim() || 'ppga'
  if (!configuredUrl) throw new Error('Configure DXP_URL before syncing the editing contract.')
  if (!apiKey || apiKey.length < 40) throw new Error('Configure DXP_SITE_API_KEY before syncing the editing contract.')
  if (!isValidSlug(appSlug)) throw new Error('DXP_APP_SLUG must be a valid application slug.')

  let origin
  try {
    const configured = new URL(configuredUrl)
    if (!['http:', 'https:'].includes(configured.protocol) || configured.username || configured.password) throw new Error()
    if (configured.protocol !== 'https:' && !['localhost', '127.0.0.1', '[::1]'].includes(configured.hostname)) throw new Error()
    origin = configured.origin
  } catch {
    throw new Error('DXP_URL must be an HTTPS URL without embedded credentials (HTTP is allowed only on loopback).')
  }

  const url = new URL('/api/dxp/site-contract/sync', origin)
  url.searchParams.set('app', appSlug)
  const response = await fetchImpl(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'x-dxp-app': appSlug,
    },
    redirect: 'error',
    signal: AbortSignal.timeout(15000),
  })
  if (!response.ok) throw new Error(`DXP editing-contract sync failed with HTTP ${response.status}.`)
  return response.status
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try {
    const status = await syncEditingContract()
    console.log(`DXP editing-contract sync succeeded with HTTP ${status}.`)
  } catch (error) {
    console.error(error instanceof Error ? error.message : 'DXP editing-contract sync failed.')
    process.exitCode = 1
  }
}
