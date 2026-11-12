'use client'

import { Component, type ErrorInfo, type ReactNode } from 'react'
import { PageRenderer } from '@/experience/renderer/PageRenderer'
import Button from '@/experience/components/atoms/Button'

export type GalleryVariant = { id: string; label: string; content: Record<string, unknown> }
export type GallerySection = { id: string; code: string; name: string; variants: GalleryVariant[] }

class Boundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  componentDidCatch(_error: Error, _info: ErrorInfo) {}
  render() { return this.state.failed ? <p role="alert">No se pudo renderizar esta variante.</p> : this.props.children }
}

const site = { name: 'Vista de variantes', slug: 'variants', supportedLocales: ['es'] }

/** Design review: every Button variant and each section's own variants, rendered by the site's real components. */
export default function VariantsGallery({ buttonVariants, sections, locale }: { buttonVariants: string[]; sections: GallerySection[]; locale: string }) {
  return (
    <main style={{ font: '14px system-ui' }}>
      {buttonVariants.length > 0 && <section aria-label="Button" data-gallery="button" style={{ padding: 24 }}>
        <h2>Button</h2>
        {buttonVariants.map((variant) => (
          <div data-variant={variant} key={variant} style={{ display: 'flex', gap: 12, alignItems: 'center', margin: '8px 0' }}>
            <code style={{ width: 96 }}>{variant}</code>
            {(['sm', 'md', 'lg'] as const).map((size) => <Button key={size} label={`${variant} ${size}`} size={size} variant={variant as never} />)}
          </div>
        ))}
      </section>}
      {sections.map((section) => (
        <section aria-label={section.name} data-gallery="section" data-section={section.id} key={section.id} style={{ borderTop: '1px solid #dde3ea', padding: '16px 0' }}>
          <h2 style={{ padding: '0 24px' }}>{section.name}</h2>
          {section.variants.map((variant) => (
            <div data-variant={variant.id} key={variant.id}>
              <p style={{ padding: '0 24px' }}><code>{variant.label}</code></p>
              <Boundary>
                <PageRenderer
                  hideGlobalLayout
                  locale={locale}
                  page={{
                    id: variant.id, title: section.name, slug: 'variants', locale, status: 'draft', seo: {}, metadata: {}, designSystem: null,
                    components: [{ instanceId: variant.id, componentId: section.id, name: section.name, code: section.code, type: section.code, atomicLevel: 'organism', position: 0, content: variant.content, settings: {}, visibility: {} }],
                  }}
                  site={site}
                />
              </Boundary>
            </div>
          ))}
        </section>
      ))}
    </main>
  )
}
