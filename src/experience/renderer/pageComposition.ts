import type { PageDTO, PageComponentDTO } from '@/contracts/site'

/** Use the explicit published composition as an allowlist and order; older pages retain DXP order. */
export function pageComponentsForRendering(page: Pick<PageDTO, 'components' | 'composition'>): PageComponentDTO[] {
  if (!page.composition) return [...(page.components ?? [])].sort((a, b) => a.position - b.position)

  const byInstanceId = new Map((page.components ?? []).map((component) => [String(component.instanceId), component]))
  const seen = new Set<string>()
  return [...page.composition.sections]
    .sort((a, b) => a.position - b.position)
    .flatMap((section) => {
      const instanceId = String(section.instanceId)
      const component = byInstanceId.get(instanceId)
      if (!component || component.code !== section.code || seen.has(instanceId)) return []
      seen.add(instanceId)
      return [{ ...component, position: section.position }]
    })
}
