import type { Metadata } from 'next'
import { dxpURL } from '@/lib/dxp'
import { EDITABLE_BUTTON_VARIANTS } from '@/experience/components/atoms/buttonVariants'
import { componentCatalog } from '@/experience/registry/catalog'
import { buildEditingContract } from '@/experience/registry/editingContract'
import EditorPreview from './EditorPreview'
import VariantsGallery from './VariantsGallery'
import ComponentSpecimen from './ComponentSpecimen'
import { galleryVariants } from './galleryVariants'

export const metadata: Metadata = { robots: { index: false, follow: false } }
export const dynamic = 'force-dynamic'

export default async function EditorPreviewPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { view, component } = await searchParams
  if (view !== 'variants') return <EditorPreview allowedOrigin={dxpURL('/').origin} />
  if (typeof component === 'string' && component.startsWith('file:')) return <ComponentSpecimen id={component.slice(5)} siteSlug={process.env.SITE_APP || 'ppga'} />
  const insertable = new Set(buildEditingContract().sections.filter((section) => section.insertable).map((section) => section.id))
  const sections = componentCatalog.filter((item) => insertable.has(item.type)).map((item) => ({
    id: item.type,
    code: buildEditingContract().sections.find((section) => section.id === item.type)?.code ?? item.type,
    name: item.label,
    variants: galleryVariants(item),
  }))
  const selected = typeof component === 'string' ? component : null
  return <VariantsGallery buttonVariants={selected === null || selected === 'button' ? [...EDITABLE_BUTTON_VARIANTS] : []} locale="es" sections={selected ? sections.filter((section) => section.id === selected) : sections} />
}
