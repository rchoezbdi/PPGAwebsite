import { resolveComponent } from '@/experience/registry/componentRegistry'
import { text } from '@/experience/components/shared'
import { radiusToken, spacingToken } from '@/experience/design-system/scale'
import type { ExperienceComponentProps } from '@/experience/components/types'
import { mergeProps } from '@/experience/components/mergeProps'

export default function ContainerComponent({ content, locale, settings, site }: ExperienceComponentProps) {
  const p = mergeProps(content, settings)
  const columns = Array.isArray(p.columns) && p.columns.length
    ? p.columns as Array<Record<string, unknown>>
    : [{ id: 'column-1', width: 100, children: [] }]
  return (
    <section className="section page-container-runtime" style={radiusToken(p.borderRadius) ? { borderRadius: radiusToken(p.borderRadius), overflow: 'hidden' } : undefined}>
      <div className="section-container page-container-runtime__columns" style={{ display: 'flex', gap: spacingToken(p.gap) }}>
        {columns.map((column, columnIndex) => {
          const children = Array.isArray(column.children) ? column.children as Array<Record<string, unknown>> : []
          return (
            <div className="page-container-runtime__column" key={String(column.id ?? columnIndex)} style={{ minWidth: 0, flex: `${Math.max(Number(column.width ?? 100), 1)} 1 0%` }}>
              {children.map((child, childIndex) => {
                const props = child.props && typeof child.props === 'object' ? child.props as Record<string, unknown> : {}
                if ((props.visibility as { hidden?: boolean } | undefined)?.hidden === true) return null
                const code = text(child.componentCode) || text(props.componentCode) || text(child.type).replace(/^DXP_/, '')
                const Child = resolveComponent(code)
                return <Child content={props} key={String(props.id ?? childIndex)} locale={locale} settings={{}} site={site} />
              })}
            </div>
          )
        })}
      </div>
    </section>
  )
}
