import { describe, expect, it } from 'vitest'
import type { PageComponentDTO, PageComposition } from '@/contracts/site'
import { pageComponentsForRendering } from '@/experience/renderer/pageComposition'

const component = (instanceId: string, code: string, position: number): PageComponentDTO => ({
  instanceId,
  componentId: `component-${instanceId}`,
  name: code,
  code,
  type: code,
  atomicLevel: 'organism',
  position,
  content: {},
  settings: {},
  visibility: {},
})

describe('published page composition', () => {
  it('preserves legacy DXP position ordering when no snapshot is provided', () => {
    const components = [component('third', 'faq', 3), component('first', 'hero', 1), component('second', 'cards', 2)]
    expect(pageComponentsForRendering({ components }).map(({ instanceId }) => instanceId)).toEqual(['first', 'second', 'third'])
  })

  it('renders only matched snapshot sections in published order and positions', () => {
    const components = [
      component('a', 'hero', 1),
      component('b', 'cards', 2),
      component('c', 'faq', 3),
      component('changed', 'cards', 4),
    ]
    const composition: PageComposition = {
      manifestId: 'published-manifest',
      version: 3,
      sections: [
        { instanceId: 'c', code: 'faq', position: 1 },
        { instanceId: 'b', code: 'cards', position: 2 },
        { instanceId: 'changed', code: 'hero', position: 3 },
      ],
    }
    const rendered = pageComponentsForRendering({ components, composition })
    expect(rendered.map(({ instanceId }) => instanceId)).toEqual(['c', 'b'])
    expect(rendered.map(({ position }) => position)).toEqual([1, 2])
  })

  it('treats an explicit empty snapshot as empty instead of falling back', () => {
    expect(pageComponentsForRendering({ components: [component('legacy', 'hero', 1)], composition: { manifestId: 'empty', version: 1, sections: [] } })).toEqual([])
  })
})
