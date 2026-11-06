import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
const mocks = vi.hoisted(() => ({ siteRoute: vi.fn() }))
vi.mock('@/lib/dxp', () => ({ siteRoute: mocks.siteRoute, dxpURL: (path: string) => new URL(path, 'http://localhost:3000') }))
import { proxy } from '../src/proxy'
beforeEach(() => mocks.siteRoute.mockResolvedValue({ appSlug: 'home', basePath: '', defaultLocale: 'en', hasLocalePrefix: true }))
describe('Standalone site routing', () => {
  it('renders Home for a bare locale prefix', async () => {
    const result = await proxy(new NextRequest('http://localhost:3001/en'))
    const destination = new URL(result.headers.get('x-middleware-rewrite')!)
    expect(destination.pathname).toBe('/site-render/home')
    expect(destination.searchParams.get('locale')).toBe('en')
  })
  it('redirects root to the configured default locale', async () => {
    const result = await proxy(new NextRequest('http://localhost:3001/'))
    expect(new URL(result.headers.get('location')!).pathname).toBe('/en')
  })
  it('keeps localized aliases compatible with the original site', async () => {
    const result = await proxy(new NextRequest('http://localhost:3001/es/support'))
    expect(new URL(result.headers.get('location')!).pathname).toBe('/es/soporte')
  })
  it('renders single-language Apps without adding a locale prefix', async () => {
    mocks.siteRoute.mockResolvedValue({ appSlug: 'ppga', basePath: '', defaultLocale: 'es', hasLocalePrefix: false })
    const result = await proxy(new NextRequest('http://localhost:3001/'))
    const destination = new URL(result.headers.get('x-middleware-rewrite')!)
    expect(destination.pathname).toBe('/site-render/ppga')
    expect(destination.searchParams.get('locale')).toBe('es')
  })
  it('keeps secure previews on the DXP', async () => {
    const result = await proxy(new NextRequest('http://localhost:3001/share/public-preview-token'))
    expect(result.headers.get('location')).toBe('http://localhost:3000/share/public-preview-token')
  })
})
