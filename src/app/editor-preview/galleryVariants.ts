import type { ExperienceComponentCatalogItem } from '@/experience/registry/catalog'
import type { GalleryVariant } from './VariantsGallery'

const MAX_VARIANTS = 12

/** The sample as-is, plus one variant per option of each top-level select the sample already carries. */
export function galleryVariants(item: ExperienceComponentCatalogItem): GalleryVariant[] {
  const variants: GalleryVariant[] = [{ id: `${item.type}:default`, label: 'default', content: item.defaultProps }]
  for (const field of item.fields) {
    if (field.type !== 'select' || !field.options || field.options.length < 2 || !(field.name in item.defaultProps)) continue
    for (const option of field.options) {
      if (option === item.defaultProps[field.name]) continue
      if (variants.length >= MAX_VARIANTS) return variants
      variants.push({ id: `${item.type}:${field.name}=${option}`, label: `${field.name} = ${option}`, content: { ...item.defaultProps, [field.name]: option } })
    }
  }
  return variants
}
