import { afterEach, describe, expect, it, vi } from 'vitest'
import { syncEditingContract } from '../scripts/sync-editing-contract.mjs'

const FAKE_API_KEY = 'test-only-fake-dxp-site-api-key-not-a-real-secret-0000'

afterEach(() => vi.restoreAllMocks())

describe('manual DXP editing-contract sync', () => {
  it('posts an empty request with server authentication and the default app slug', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(new Response(null, { status: 204 }))
    const status = await syncEditingContract({
      env: { DXP_URL: 'https://dxp.example/base', DXP_SITE_API_KEY: FAKE_API_KEY },
      fetchImpl,
    })
    const [requestUrl, options] = fetchImpl.mock.calls[0]
    expect(new URL(requestUrl).pathname).toBe('/api/dxp/site-contract/sync')
    expect(new URL(requestUrl).searchParams.get('app')).toBe('ppga')
    expect(options.method).toBe('POST')
    expect(options.headers).toEqual({ Authorization: `Bearer ${FAKE_API_KEY}`, 'x-dxp-app': 'ppga' })
    expect(options).not.toHaveProperty('body')
    expect(status).toBe(204)
  })

  it('uses the requested app slug and does not expose upstream failure bodies', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(new Response('private response content', { status: 401 }))
    await expect(syncEditingContract({
      env: { DXP_URL: 'https://dxp.example', DXP_SITE_API_KEY: FAKE_API_KEY, DXP_APP_SLUG: 'ppga-preview' },
      fetchImpl,
    })).rejects.toThrow('HTTP 401')
    expect(new URL(fetchImpl.mock.calls[0][0]).searchParams.get('app')).toBe('ppga-preview')
  })

  it('requires a valid server credential without making a request', async () => {
    const fetchImpl = vi.fn()
    await expect(syncEditingContract({ env: { DXP_URL: 'https://dxp.example' }, fetchImpl })).rejects.toThrow('DXP_SITE_API_KEY')
    expect(fetchImpl).not.toHaveBeenCalled()
  })
})
