import { afterEach, describe, expect, it, vi } from 'vitest'
vi.mock('server-only', () => ({}))
import { allowedPublicPath } from '../src/lib/publicGateway'
import { GET, POST } from '../src/app/api/[...path]/route'

const FAKE_API_KEY = 'test-only-fake-dxp-site-api-key-not-a-real-secret-0000'

afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs() })
describe('Public DXP gateway boundary', () => {
  it.each(['users', 'apps', 'blog-posts', 'dxp/users/1/access-email', 'visual/pages/1', 'graphql', 'site-runtime'])('blocks administrative route %s', path => {
    expect(allowedPublicPath(path, 'GET')).toBe(false)
    expect(allowedPublicPath(path, 'POST')).toBe(false)
  })
  it.each(['site-blog', 'site-blog/article', 'site-search', 'media/file/image.webp', 'dxp/documents/download'])('allows public GET %s only for reading', path => {
    expect(allowedPublicPath(path, 'GET')).toBe(true)
    expect(allowedPublicPath(path, 'DELETE')).toBe(false)
  })
  it('forwards neither the user session nor upstream Set-Cookie', async () => {
    vi.stubEnv('DXP_URL', 'http://localhost:3000')
    vi.stubEnv('DXP_SITE_API_KEY', FAKE_API_KEY)
    const fetch = vi.fn().mockResolvedValue(new Response('{}', { headers: { 'content-type': 'application/json', 'set-cookie': 'private=1' } }))
    vi.stubGlobal('fetch', fetch)
    const result = await GET(new Request('http://localhost:3001/api/site-blog?app=home', { headers: { cookie: 'payload-token=private', authorization: 'Bearer private' } }), { params: Promise.resolve({ path: ['site-blog'] }) })
    const headers = fetch.mock.calls[0][1].headers as Headers
    expect(headers.has('cookie')).toBe(false)
    expect(headers.get('authorization')).toBe(`Bearer ${FAKE_API_KEY}`)
    expect(headers.get('authorization')).not.toBe('Bearer private')
    expect(result.headers.has('set-cookie')).toBe(false)
  })
  it('rejects path traversal before calling the DXP', async () => {
    const fetch = vi.fn()
    vi.stubGlobal('fetch', fetch)
    expect((await GET(new Request('http://localhost:3001/api/test'), { params: Promise.resolve({ path: ['media', 'file', '../users'] }) })).status).toBe(400)
    expect(fetch).not.toHaveBeenCalled()
  })
  it('rejects admin writes before calling the DXP', async () => {
    const fetch = vi.fn()
    vi.stubGlobal('fetch', fetch)
    expect((await POST(new Request('http://localhost:3001/api/users', { method: 'POST' }), { params: Promise.resolve({ path: ['users'] }) })).status).toBe(404)
    expect(fetch).not.toHaveBeenCalled()
  })
})
