import { resolveExperienceLink } from '@/experience/navigation/resolver'
import QuickActionCard from '../molecules/QuickActionCard'
import SectionHeading from '../molecules/SectionHeading'
import { designTextColor, text } from '../shared'
import type { ExperienceComponentProps } from '@/experience/registry/componentRegistry'

type Action = { description?: string; icon?: string; label?: string; linkType?: 'internal' | 'external' | 'none'; newWindow?: boolean; page?: unknown; url?: string }

export default function QuickActionsSection({ content, settings, locale, site }: ExperienceComponentProps) {
  const p = { ...settings, ...content }
  const items = (p.actions ?? []) as Action[]
  const columns = text(p.columnsDesktop) || '4'
  const background = text(p.background)

  return (
    <section className={`section${background && background !== 'white' ? ` section--${background}` : ''} quick-actions-section`}>
      <div className="section-container">
        <SectionHeading description={text(p.description)} descriptionColor={designTextColor(p.descriptionColor)} eyebrow={text(p.eyebrow)} highlight={text(p.headingHighlight)} highlightColor={designTextColor(p.headingHighlightColor)} title={text(p.heading)} titleColor={designTextColor(p.headingColor)} />
        <div className="grid" style={{ '--columns': columns } as React.CSSProperties}>
          {items.map((item, index) => {
            const resolved = resolveExperienceLink({ linkType: item.linkType, page: item.page as Parameters<typeof resolveExperienceLink>[0]['page'], url: item.url, locale, fallbackSite: site.slug, localizedRoutes: site.localizedRoutes })
            return <QuickActionCard ctaLabel={resolved.href ? 'Ver más' : undefined} description={item.description} href={resolved.href} icon={item.icon} key={index} title={item.label} />
          })}
        </div>
      </div>
    </section>
  )
}
