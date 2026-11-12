'use client'

import { Component, useEffect, type ComponentType, type ErrorInfo, type ReactNode } from 'react'
import { componentSamples, type SpecimenSample } from '@/experience/registry/componentSamples'
import { componentSpecimens } from '@/experience/registry/componentSpecimens'

export const PREVIEW_ERROR_ATTRIBUTE = 'data-preview-error'

class PreviewBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  componentDidCatch(_error: Error, _info: ErrorInfo) {}
  render() { return this.state.failed ? <p role="alert" {...{ [PREVIEW_ERROR_ATTRIBUTE]: 'true' }}>La muestra de este componente falló al renderizarse.</p> : this.props.children }
}

/** Runs the sample's page setup (scroll, open modal) once the real component has mounted. */
function SamplePreparation({ prepare }: { prepare?: SpecimenSample['prepare'] }) {
  useEffect(() => prepare?.(), [prepare])
  return null
}

/** Mounts the imported frontend component itself with its explicit sample, never a DXP recreation. */
export default function ComponentSpecimen({ id, siteSlug }: { id: string; siteSlug: string }) {
  const Rendered = (componentSpecimens as unknown as Record<string, ComponentType<Record<string, unknown>>>)[id]
  const sample = (componentSamples as Record<string, SpecimenSample | undefined>)[id]
  if (!Rendered) return <p>Este componente ya no existe en el frontend.</p>
  if (!sample) return <p role="status">Este componente todavía no tiene una muestra de vista previa.</p>
  const props = { ...(sample.props as Record<string, unknown>) }
  const sampleSite = props.site as Record<string, unknown> | undefined
  if (sampleSite) props.site = { ...sampleSite, slug: siteSlug }
  const name = id.split('/').at(-1) ?? id
  return <main style={{ padding: 24, font: '14px system-ui' }}>
    <h1 style={{ fontSize: 18 }}>{name}</h1>
    <PreviewBoundary><Rendered {...props} /><SamplePreparation prepare={sample.prepare} /></PreviewBoundary>
  </main>
}
