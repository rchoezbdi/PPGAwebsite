// @vitest-environment jsdom
import React from 'react'
import { act, cleanup, render } from '@testing-library/react'
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import ComponentSpecimen, { PREVIEW_ERROR_ATTRIBUTE } from '@/app/editor-preview/ComponentSpecimen'
import { componentSamples } from '@/experience/registry/componentSamples'
import { buildEditingContract } from '@/experience/registry/editingContract'
import designInventory from '@/experience/registry/designInventory.json'

vi.mock('next/navigation', () => ({
  usePathname: () => '/',
  useRouter: () => ({ push: () => {}, replace: () => {}, prefetch: () => {} }),
  useSearchParams: () => new URLSearchParams(),
}))

beforeAll(() => {
  vi.stubGlobal('IntersectionObserver', class { observe() {} unobserve() {} disconnect() {} takeRecords() { return [] } })
  Element.prototype.scrollIntoView = vi.fn()
  window.matchMedia = window.matchMedia ?? ((query: string) => ({ matches: false, media: query, addEventListener: () => {}, removeEventListener: () => {}, addListener: () => {}, removeListener: () => {}, dispatchEvent: () => false, onchange: null }) as MediaQueryList)
  // jsdom has no layout: scrolling just moves scrollY and notifies listeners, like a browser would.
  window.scrollTo = ((_x: number, y: number) => { Object.defineProperty(window, 'scrollY', { configurable: true, value: y }); window.dispatchEvent(new Event('scroll')) }) as typeof window.scrollTo
  vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ docs: [], results: [] }), { status: 200 })))
})

afterEach(cleanup)

const inventory = designInventory

describe('design component samples', () => {
  it('has a sample for every inventory entry and none for removed files', () => {
    expect(Object.keys(componentSamples).sort()).toEqual((inventory as Array<{ id: string }>).map((component) => component.id).sort())
  })

  it('publishes a preview only for components with a sample', () => {
    for (const component of buildEditingContract().design.components) expect(component.previewId, component.id).toBeTruthy()
  })

  for (const [id, sample] of Object.entries(componentSamples)) {
    it(`renders ${id} with its own sample`, async () => {
      const { container } = render(<ComponentSpecimen id={id} siteSlug="home" />)
      await act(async () => { await Promise.resolve() })
      expect(container.querySelector(`[${PREVIEW_ERROR_ATTRIBUTE}]`), 'preview boundary fallback').toBeNull()
      const html = document.body.innerHTML
      // Portals (modals, drawers) render outside the preview container, so the whole document counts.
      const rendered = Array.from(document.body.querySelectorAll('*')).filter((node) => !['MAIN', 'H1'].includes(node.tagName) && node.parentElement !== document.body)
      expect(rendered.length, 'empty render').toBeGreaterThan(0)
      expect(html, 'expected sample content').toContain(sample.expect)
    })
  }
})
