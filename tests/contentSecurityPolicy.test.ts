import { describe, expect, it } from 'vitest'
import nextConfig from '../next.config.mjs'

describe('integration content security policy', () => {
  it('allows only the GTM and Clarity hosts required by their gated runtime loaders', async () => {
    const headers = await nextConfig.headers()
    const policy = headers.find((entry) => entry.source === '/((?!editor-preview).*)')?.headers.find((header) => header.key === 'Content-Security-Policy')?.value
    expect(policy).toContain('https://www.googletagmanager.com')
    expect(policy).toContain('https://www.clarity.ms')
    expect(policy).toContain('https://*.clarity.ms')
    expect(policy).toContain('https://c.bing.com')
    expect(policy).toContain("default-src 'self'")
    expect(policy).not.toContain('https:;')
  })
})
