import Heading from '../atoms/Heading'
import Icon from '../atoms/Icon'
import Link from '../atoms/Link'
import Text from '../atoms/Text'

export default function QuickActionCard({ ctaLabel, description, href, icon, title }: {
  ctaLabel?: string
  description?: string
  href?: string | null
  icon?: string
  title?: string
}) {
  if (!title) return null
  const card = (
    <>
      {icon ? <span className="quick-action-card__icon"><Icon name={icon} size={22} /></span> : null}
      <Heading level="h3" size="sm">{title}</Heading>
      <Text size="sm" tone="muted">{description}</Text>
      {ctaLabel ? <span className="quick-action-card__cta">{ctaLabel} <Icon name="arrow-right" size={14} /></span> : null}
    </>
  )
  return href ? <Link className="quick-action-card" href={href}>{card}</Link> : <div className="quick-action-card">{card}</div>
}
