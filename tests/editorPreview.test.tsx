// @vitest-environment jsdom
import React from 'react'
import { act, cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import EditorPreview from '@/app/editor-preview/EditorPreview'

vi.mock('@/experience/renderer/PageRenderer', () => ({
  PageRenderer: ({ page, hideGlobalLayout }: { page: { components: Array<{ instanceId: string; name: string }> }; hideGlobalLayout?: boolean }) => (
    <div data-hide-layout={String(Boolean(hideGlobalLayout))}>{page.components.map((component) => <section data-section-id={component.instanceId} key={component.instanceId}>{component.name}</section>)}</div>
  ),
}))

const ORIGIN = 'https://dxp.test'
const part = (id: string) => ({ instanceId: id, componentId: id, name: `Section ${id}`, code: 'hero', type: 'Hero', atomicLevel: 'organism', position: Number(id), content: {}, settings: {}, visibility: {} })
const send = (data: Record<string, unknown>, origin = ORIGIN) => act(() => { window.dispatchEvent(new MessageEvent('message', { origin, source: window.parent, data: { source: 'experience-editor', protocol: 1, ...data } })) })
const payload = (mode: 'page' | 'section', selectedInstanceId?: string) => ({ mode, locale: 'es', selectedInstanceId, site: { name: 's', slug: 's', supportedLocales: ['es'] }, page: { id: 1, title: 't', slug: 'p', locale: 'es', status: 'draft', seo: {}, metadata: {}, designSystem: null, layout: { templateId: 1, templateName: 'x', before: [], after: [] }, components: [part('1'), part('2')] } })

afterEach(cleanup)

// jsdom does not implement scrollIntoView.
Element.prototype.scrollIntoView = vi.fn()

describe('editor preview protocol', () => {
  it('renders every section in page mode', () => {
    render(<EditorPreview allowedOrigin={ORIGIN} />)
    send({ type: 'render', payload: payload('page') })
    expect(screen.getAllByText(/Section/)).toHaveLength(2)
  })

  it('renders only the selected section, without shared layout, in section mode', () => {
    const { container } = render(<EditorPreview allowedOrigin={ORIGIN} />)
    send({ type: 'render', payload: payload('section', '2') })
    expect(screen.getAllByText(/Section/)).toHaveLength(1)
    expect(screen.getByText('Section 2')).toBeTruthy()
    expect(container.querySelector('[data-hide-layout="true"]')).not.toBeNull()
  })

  it('follows selection messages and ignores foreign origins', () => {
    const { container } = render(<EditorPreview allowedOrigin={ORIGIN} />)
    send({ type: 'render', payload: payload('page') })
    send({ type: 'select', instanceId: '2' }, 'https://evil.test')
    expect(container.querySelector('[data-editor-selected="true"]')).toBeNull()
    send({ type: 'select', instanceId: '2' })
    expect(container.querySelector('[data-editor-selected="true"]')?.getAttribute('data-section-id')).toBe('2')
  })

  it('ignores malformed payloads and wrong protocol versions', () => {
    render(<EditorPreview allowedOrigin={ORIGIN} />)
    send({ type: 'render', payload: { mode: 'page' } })
    send({ type: 'render', protocol: 9, payload: payload('page') })
    expect(screen.queryAllByText(/Section/)).toHaveLength(0)
  })
})
