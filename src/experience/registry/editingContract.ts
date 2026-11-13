import { componentEditingPolicies, componentEditorialContracts } from '@/experience/components/contracts'
import { EDITABLE_BUTTON_VARIANTS } from '@/experience/components/atoms/buttonVariants'
import { componentCatalog, type ExperienceFieldSchema } from '@/experience/registry/catalog'
import { normalizeComponentCode } from '@/experience/registry/componentRegistry'
import { componentSamples } from '@/experience/registry/componentSamples'
import { EDITING_CONTRACT_VERSION, PREVIEW_PROTOCOL_VERSION, type EditableField, type EditableSection, type SiteEditingContract } from '@/contracts/editing'
import designInventory from './designInventory.json'
import siteTheme from '@/experience/design-system/siteTheme.json'
import { existsSync } from 'node:fs'
import { join } from 'node:path'

function currentDesignInventory(): typeof designInventory {
  if (process.env.NODE_ENV !== 'development') return designInventory
  return designInventory.filter((component) => existsSync(join(process.cwd(), component.sourcePath)))
}

/**
 * The editor exposes text, images and references by default. Layout, colour, spacing, motion and
 * variant choices belong to this site's design system, so they are not published. Exceptions are
 * declared per component in `components/contracts`.
 */
const policyFor = (type: string) => componentEditingPolicies.get(type)

/** Non-content text fields. */
const DESIGN_TEXT_FIELDS = /^cssClass$|color|gradient/i

const CONTENT_TYPES = new Set<ExperienceFieldSchema['type']>(['text', 'textarea', 'richText'])
const isListed = (entries: string[] | undefined, path: string[]) =>
  (entries ?? []).some((entry) => {
    const parts = entry.split('.')
    return parts.length <= path.length && parts.every((part, index) => part === path[path.length - parts.length + index])
  })
const isFunctional = (type: string, path: string[]) => isListed(policyFor(type)?.functional, path)
const isPresentationOption = (name: string) => /^(variant|buttonVariant|buttonIcon|icon|iconPosition|showIcon|showButton|background|alignment|width|height|size|gap|spacing|layout|theme|columns|color|.*Color|.*Gradient|.*BackgroundType|.*HoverBehavior|.*AspectRatio|.*Fit|.*Position)$/.test(name)

function applyEditorialFieldLabels(fields: EditableField[], fieldLabels: Readonly<Record<string, string>>, parents: string[] = []): EditableField[] {
  return fields.map((field) => {
    const path = [...parents, field.name].join('.')
    return {
      ...field,
      ...(fieldLabels[path] !== undefined ? { label: fieldLabels[path] } : {}),
      ...(field.fields ? { fields: applyEditorialFieldLabels(field.fields, fieldLabels, [...parents, field.name]) } : {}),
    }
  })
}

function convert(field: ExperienceFieldSchema, siblings: ExperienceFieldSchema[], parents: string[], sectionType: string, inButton: boolean): EditableField | null {
  const path = [...parents, field.name]
  if (isListed(policyFor(sectionType)?.excluded, path)) return null
  const base: Pick<EditableField, 'name' | 'label' | 'required' | 'localized' | 'maxLength' | 'defaultValue'> = {
    name: field.name,
    ...(field.label ? { label: field.label } : {}),
    ...(field.required ? { required: true } : {}),
    ...(field.localized ? { localized: true } : {}),
    ...(field.maxLength ? { maxLength: field.maxLength } : {}),
    ...(field.defaultValue !== undefined ? { defaultValue: field.defaultValue } : {}),
  }
  if (CONTENT_TYPES.has(field.type)) {
    if (DESIGN_TEXT_FIELDS.test(field.name)) return null
    // `fooUrl` beside an upload `foo` is the pre-DAM duplicate of the same image.
    const duplicated = /Url$/.test(field.name) && siblings.some((sibling) => sibling.type === 'upload' && `${sibling.name}Url` === field.name)
    if (duplicated) return null
    return { ...base, type: field.type as EditableField['type'] }
  }
  if (field.type === 'upload') return { ...base, type: 'image' }
  if (field.type === 'relationship') return { ...base, type: 'relationship', relationTo: field.relationTo, ...(field.hasMany ? { hasMany: true } : {}) }
  if (field.type === 'group' || field.type === 'array') {
    const button = field.role === 'button'
    const children = (field.fields ?? []).map((child) => convert(child, field.fields ?? [], path, sectionType, button || inButton)).filter((child): child is EditableField => Boolean(child))
    if (!children.length) return null
    return { ...base, type: field.type, ...(button ? { role: 'button' as const } : {}), ...(field.minRows !== undefined ? { minRows: field.minRows } : {}), ...(field.maxRows !== undefined ? { maxRows: field.maxRows } : {}), fields: children }
  }
  const isFunctionalButtonVariant = inButton && field.name === 'variant'
  if ((field.type === 'select' || field.type === 'checkbox') && (inButton || isFunctional(sectionType, path)) && (!isPresentationOption(field.name) || isFunctionalButtonVariant)) {
    return field.type === 'select' ? { ...base, type: 'select', options: field.options ?? [] } : { ...base, type: 'checkbox' }
  }
  return null
}

export function buildEditingContract(): SiteEditingContract {
  const sections: EditableSection[] = componentCatalog.map((item) => {
    const generatedFields = item.fields.map((field) => convert(field, item.fields, [], item.type, false)).filter((field): field is EditableField => Boolean(field))
    const fields = policyFor(item.type)?.presentationOnly
      ? []
      : applyEditorialFieldLabels(generatedFields, componentEditorialContracts.get(item.type)?.fieldLabels ?? {})
    return {
      id: item.type,
      code: normalizeComponentCode(item.type),
      version: item.schemaVersion,
      name: item.label,
      description: item.description,
      category: item.category,
      insertable: !policyFor(item.type)?.presentationOnly,
      fields,
      sample: item.defaultProps,
    }
  })
  return {
    contractVersion: EDITING_CONTRACT_VERSION,
    site: process.env.SITE_APP || 'site',
    buttonVariants: [...EDITABLE_BUTTON_VARIANTS],
    sections,
    design: {
      tokens: siteTheme.tokens,
      fonts: siteTheme.fonts,
      buttonStyle: siteTheme.buttonStyle,
      components: currentDesignInventory().map((component) => ({
        ...component,
        // Each inventory entry previews itself through its own explicit sample; a same-named page
        // section is a different component and must not stand in for it.
        previewId: component.name === 'Button' && component.level === 'atom'
          ? 'button'
          : component.id in componentSamples ? `file:${component.id}` : null,
      })),
    },
    preview: {
      protocol: PREVIEW_PROTOCOL_VERSION,
      route: '/editor-preview',
      pageFrame: true,
      sectionFrame: true,
      designReview: true,
      liveUpdates: true,
      selection: true,
      viewports: [{ id: 'desktop', width: 1280 }, { id: 'tablet', width: 820 }, { id: 'mobile', width: 390 }],
    },
  }
}
