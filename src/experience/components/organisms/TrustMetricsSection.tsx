import MetricCard from '../molecules/MetricCard'
import SectionHeading from '../molecules/SectionHeading'
import { designTextColor, text } from '../shared'
import type { ExperienceComponentProps } from '@/experience/registry/componentRegistry'

type Stat = { description?: string; label?: string; prefix?: string; suffix?: string; value?: number }

export default function TrustMetricsSection({ content, settings }: ExperienceComponentProps) {
  const p = { ...settings, ...content }
  const items = (p.stats ?? []) as Stat[]
  const background = text(p.background)
  const animate = p.animateNumbers !== false

  return (
    <section className={`section${background && background !== 'white' ? ` section--${background}` : ''} stats-section`}>
      <div className="section-container">
        <SectionHeading description={text(p.description)} descriptionColor={designTextColor(p.descriptionColor)} eyebrow={text(p.eyebrow)} highlight={text(p.headingHighlight)} highlightColor={designTextColor(p.headingHighlightColor)} title={text(p.heading)} titleColor={designTextColor(p.headingColor)} />
        <div className="stats-grid">
          {items.map((item, index) => (
            <MetricCard animate={animate} description={item.description} key={index} label={item.label} prefix={item.prefix} suffix={item.suffix} value={item.value} />
          ))}
        </div>
      </div>
    </section>
  )
}
