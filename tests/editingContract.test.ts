import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { buildEditingContract } from '@/experience/registry/editingContract'
import { componentRegistry } from '@/experience/registry/componentRegistry'
import { EDITABLE_BUTTON_VARIANTS } from '@/experience/components/atoms/buttonVariants'
import type { EditableField } from '@/contracts/editing'
import { componentEditingPolicies } from '@/experience/components/contracts'
import { componentCatalog, type ExperienceFieldSchema } from '@/experience/registry/catalog'
import { galleryVariants } from '@/app/editor-preview/galleryVariants'

type Leaf = { path: string[]; field: EditableField; inButton: boolean }
const contract = buildEditingContract()
const leaves = (fields: EditableField[], parents: string[] = [], inButton = false): Leaf[] =>
  fields.flatMap((field) => field.fields ? leaves(field.fields, [...parents, field.name], inButton || field.role === 'button') : [{ path: [...parents, field.name], field, inButton }])

function sourceFiles(directory: string): string[] {
  return readdirSync(directory).flatMap((entry) => {
    const path = join(directory, entry)
    return statSync(path).isDirectory() ? sourceFiles(path) : /\.tsx?$/.test(entry) ? [path] : []
  })
}

describe('editing contract', () => {
  it('declares a versioned contract with sections and preview capabilities', () => {
    expect(contract.contractVersion).toBe(1)
    expect(contract.preview.route).toBe('/editor-preview')
    expect(contract.sections.length).toBeGreaterThan(0)
    expect(new Set(contract.sections.map((section) => section.id)).size).toBe(contract.sections.length)
  })

  it('declares section and design-review views the site actually serves', () => {
    expect(contract.preview.sectionFrame).toBe(true)
    expect(contract.preview.designReview).toBe(true)
  })

  it('keeps component policies pointed at real catalog sections and fields', () => {
    for (const policy of componentEditingPolicies.values()) {
      const item = componentCatalog.find((entry) => entry.type === policy.type)
      expect(item, policy.type).toBeDefined()
      const names = new Set<string>()
      const walk = (fields: ExperienceFieldSchema[]) => fields.forEach((field) => { names.add(field.name); if (field.fields) walk(field.fields) })
      walk(item!.fields)
      for (const entry of [...(policy.functional ?? []), ...(policy.excluded ?? [])]) expect(names.has(entry.split('.').at(-1)!), `${policy.type}.${entry}`).toBe(true)
    }
  })

  it('derives gallery variants from the real select options of each section', () => {
    for (const item of componentCatalog) {
      const variants = galleryVariants(item)
      expect(variants[0].id).toBe(`${item.type}:default`)
      expect(new Set(variants.map((variant) => variant.id)).size).toBe(variants.length)
      expect(variants.length).toBeLessThanOrEqual(12)
    }
  })

  it('registers a renderer for every section it publishes', () => {
    for (const section of contract.sections.filter((entry) => entry.insertable)) expect(componentRegistry[section.code], section.id).toBeDefined()
  })

  it('takes button variants from the Button module, never from a second list', () => {
    expect(contract.buttonVariants).toEqual([...EDITABLE_BUTTON_VARIANTS])
    const variants = contract.sections.flatMap((section) => leaves(section.fields).filter(({ path, inButton }) => inButton && path.at(-1) === 'variant'))
    expect(variants.length).toBeGreaterThan(0)
    for (const { field } of variants) expect(field.options).toEqual([...EDITABLE_BUTTON_VARIANTS])
  })

  it('publishes content, images, references and button fields only', () => {
    const allowedTypes = ['text', 'textarea', 'richText', 'image', 'relationship']
    const offenders = contract.sections.flatMap((section) => leaves(section.fields)
      .filter(({ field, inButton }) => !inButton && !allowedTypes.includes(field.type))
      .map(({ path }) => `${section.id}.${path.join('.')}`))
    // Selects and checkboxes outside buttons are the explicitly declared functional fields.
    expect(offenders.every((entry) => /(source|documentType|buttonVariant|platform|\.type|provider)$/.test(entry))).toBe(true)
  })

  it('does not publish colour or layout text fields, and hides presentation-only sections', () => {
    for (const { field } of contract.sections.flatMap((section) => leaves(section.fields))) expect(field.name).not.toMatch(/color|gradient|cssClass/i)
    for (const id of ['SectionLayout', 'BackToTopWidget']) expect(contract.sections.find((section) => section.id === id)?.insertable).toBe(false)
  })

  it('publishes only fields a component reads', () => {
    const source = [...sourceFiles(join(process.cwd(), 'src/experience')), ...sourceFiles(join(process.cwd(), 'src/lib'))]
      .filter((file) => !/registry[\\/](catalog|editingContract)\.ts$|components[\\/]contracts[\\/]|editor-preview[\\/]galleryVariants/.test(file))
      .map((file) => readFileSync(file, 'utf8')).join('\n')
    const unused = contract.sections.flatMap((section) => leaves(section.fields)
      // The DXP resolves relationships before it builds the page DTO.
      .filter(({ field }) => field.type !== 'relationship')
      .filter(({ field }) => !new RegExp(`\\b${field.name}\\b`).test(source))
      .map(({ path }) => `${section.id}.${path.join('.')}`))
    expect(unused).toEqual([])
  })
})
