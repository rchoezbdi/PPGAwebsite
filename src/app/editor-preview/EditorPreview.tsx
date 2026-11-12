'use client'

import { Component, useCallback, useEffect, useRef, useState, type ErrorInfo, type MouseEvent, type ReactNode } from 'react'
import { PageRenderer } from '@/experience/renderer/PageRenderer'
import {
  EDITOR_MESSAGE_SOURCE,
  PREVIEW_MESSAGE_SOURCE,
  PREVIEW_PROTOCOL_VERSION,
  type PreviewRenderPayload,
  type SiteToEditorMessage,
} from '@/contracts/editing'

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value)

function isRenderPayload(value: unknown): value is PreviewRenderPayload {
  if (!isRecord(value) || !isRecord(value.page) || !isRecord(value.site)) return false
  return (value.mode === 'page' || value.mode === 'section') && typeof value.locale === 'string' && Array.isArray(value.page.components)
}

class PreviewBoundary extends Component<{ children: ReactNode; onError: (message: string) => void; resetKey: string }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  componentDidCatch(error: Error, _info: ErrorInfo) { this.props.onError(error.message) }
  componentDidUpdate(previous: { resetKey: string }) { if (previous.resetKey !== this.props.resetKey && this.state.failed) this.setState({ failed: false }) }
  render() { return this.state.failed ? <p role="alert" style={{ padding: 24, font: '14px system-ui' }}>No se pudo renderizar esta sección.</p> : this.props.children }
}

/** Renders the site's own PageRenderer from editor messages. Only the DXP origin may drive it. */
export default function EditorPreview({ allowedOrigin }: { allowedOrigin: string }) {
  const [payload, setPayload] = useState<PreviewRenderPayload | null>(null)
  const [selected, setSelected] = useState<string | null>(null)
  const root = useRef<HTMLDivElement>(null)
  const post = useCallback((message: SiteToEditorMessage) => {
    if (window.parent !== window) window.parent.postMessage(message, allowedOrigin)
  }, [allowedOrigin])

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (event.origin !== allowedOrigin || event.source !== window.parent) return
      const data: unknown = event.data
      if (!isRecord(data) || data.source !== EDITOR_MESSAGE_SOURCE || data.protocol !== PREVIEW_PROTOCOL_VERSION) return
      if (data.type === 'render' && isRenderPayload(data.payload)) {
        setPayload(data.payload)
        if (data.payload.selectedInstanceId !== undefined) setSelected(data.payload.selectedInstanceId)
      } else if (data.type === 'select' && (data.instanceId === null || typeof data.instanceId === 'string')) {
        setSelected(data.instanceId)
      }
    }
    window.addEventListener('message', onMessage)
    post({ source: PREVIEW_MESSAGE_SOURCE, protocol: PREVIEW_PROTOCOL_VERSION, type: 'ready' })
    return () => window.removeEventListener('message', onMessage)
  }, [allowedOrigin, post])

  useEffect(() => {
    const nodes = root.current?.querySelectorAll<HTMLElement>('[data-section-id]') ?? []
    let target: HTMLElement | null = null
    nodes.forEach((node) => {
      const active = node.dataset.sectionId === selected
      if (active) { node.dataset.editorSelected = 'true'; target = node } else delete node.dataset.editorSelected
    })
    ;(target as HTMLElement | null)?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }, [selected, payload])

  const onClick = (event: MouseEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement
    if (target.closest('a')) event.preventDefault()
    const section = target.closest<HTMLElement>('[data-section-id]')
    if (!section?.dataset.sectionId) return
    setSelected(section.dataset.sectionId)
    post({ source: PREVIEW_MESSAGE_SOURCE, protocol: PREVIEW_PROTOCOL_VERSION, type: 'select', instanceId: section.dataset.sectionId })
  }

  const isSection = payload?.mode === 'section'
  // Section mode shows one instance in isolation: no shared layout and no page chrome.
  const page = payload ? {
    ...payload.page,
    integrations: [],
    ...(isSection ? {
      layout: null,
      components: payload.page.components.filter((component) => String(component.instanceId) === (selected ?? String(payload.page.components[0]?.instanceId))).slice(0, 1),
    } : {}),
  } : null
  return (
    <div onClickCapture={onClick} ref={root}>
      <style>{'[data-editor-selected="true"]{outline:2px solid #168cff;outline-offset:-2px}'}</style>
      {page && payload ? (
        <PreviewBoundary onError={(message) => post({ source: PREVIEW_MESSAGE_SOURCE, protocol: PREVIEW_PROTOCOL_VERSION, type: 'error', message })} resetKey={JSON.stringify(page.components.map((component) => component.instanceId))}>
          <PageRenderer hideGlobalLayout={isSection} locale={payload.locale} page={page} site={payload.site} />
        </PreviewBoundary>
      ) : <p role="status" style={{ padding: 24, font: '14px system-ui' }}>Esperando el editor…</p>}
    </div>
  )
}
