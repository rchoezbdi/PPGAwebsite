import type { CSSProperties } from 'react'
import Heading, { type HeadingLevel } from '../atoms/Heading'
import Label from '../atoms/Label'
import Text from '../atoms/Text'

export default function SectionHeading({ align = 'left', description, descriptionColor, eyebrow, highlight, highlightColor, title, titleColor, titleLevel = 'h2' }: {
  align?: 'left' | 'center' | 'right'
  description?: string
  descriptionColor?: string
  eyebrow?: string
  /** Trailing portion of the title rendered in the accent color, e.g. heading "What our
   * members" + highlight "are saying" — same `<mark>`-on-`--text-highlight` pattern already
   * used by PlanAudienceCards/GlobalCareStatement, just reusable here instead of hardcoded. */
  highlight?: string
  highlightColor?: string
  title?: string
  titleColor?: string
  titleLevel?: HeadingLevel
}) {
  if (!eyebrow && !title && !description) return null
  return (
    <div className={`section-heading${align !== 'left' ? ` text-${align}` : ''}`}>
      <Label variant="eyebrow">{eyebrow}</Label>
      <Heading level={titleLevel}><span style={titleColor ? { color: titleColor } : undefined}>{title}</span>{highlight ? <> <mark style={highlightColor ? { color: highlightColor } : undefined}>{highlight}</mark></> : null}</Heading>
      <Text className="section-subtitle" size="lg" tone="muted"><span style={descriptionColor ? { color: descriptionColor } : undefined}>{description}</span></Text>
    </div>
  )
}
