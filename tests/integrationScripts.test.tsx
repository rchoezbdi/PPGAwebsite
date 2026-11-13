// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render } from '@testing-library/react'
import IntegrationScripts from '@/components/IntegrationScripts'
import type { RuntimeIntegration } from '@/contracts/site'

vi.mock('next/script', () => ({
  default: ({ id, src, children }: { id: string; src?: string; children?: string }) => <script id={id} src={src}>{children}</script>,
}))

const makeIntegration = (provider: string, configuration: Record<string, unknown>, consentPurposeId?: string): RuntimeIntegration => ({
  id: provider,
  provider,
  loadingStrategy: 'afterInteractive',
  configuration,
  consentPurposeId,
})

afterEach(() => {
  cleanup()
  document.cookie = '_iub_cs-s123=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/'
  delete (window as Window & { _iub?: unknown })._iub
})

describe('runtime analytics integrations', () => {
  it('loads GTM and Clarity from the public integrations DTO under the configured consent purpose', () => {
    ;(window as Window & { _iub?: unknown })._iub = { csConfiguration: { siteId: '123' } }
    document.cookie = `_iub_cs-s123=${encodeURIComponent(JSON.stringify({ purposes: { analytics: true } }))}; path=/`
    render(
      <IntegrationScripts
        integrations={[
          makeIntegration('iubenda', { siteId: '123', policyId: '456' }),
          makeIntegration('google-tag-manager', { containerId: 'GTM-TEST' }, 'analytics'),
          makeIntegration('microsoft-clarity', { projectId: 'clarity-test' }, 'analytics'),
        ]}
      />,
    )
    expect(document.getElementById('bd-gtm')?.textContent).toContain('GTM-TEST')
    expect(document.getElementById('bd-clarity')?.textContent).toContain('clarity-test')
  })

  it('keeps runtime analytics gated when the configured consent purpose is not granted', () => {
    ;(window as Window & { _iub?: unknown })._iub = { csConfiguration: { siteId: '123' } }
    document.cookie = `_iub_cs-s123=${encodeURIComponent(JSON.stringify({ purposes: { analytics: false } }))}; path=/`
    render(
      <IntegrationScripts
        integrations={[
          makeIntegration('iubenda', { siteId: '123', policyId: '456' }),
          makeIntegration('googleTagManager', { containerId: 'GTM-TEST' }, 'analytics'),
          makeIntegration('microsoftClarity', { projectId: 'clarity-test' }, 'analytics'),
        ]}
      />,
    )
    expect(document.getElementById('bd-gtm')).toBeNull()
    expect(document.getElementById('bd-clarity')).toBeNull()
  })
})
