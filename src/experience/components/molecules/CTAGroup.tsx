import Button from '../atoms/Button'
import { resolveCTA, type CTAContent } from '../shared'
import type { ExperienceSite } from '@/experience/registry/componentRegistry'

export default function CTAGroup({ alignment = 'left', forceChevronIcon = false, locale, primaryCTA, secondaryCTA, site }: {
  alignment?: 'left' | 'center' | 'right'
  forceChevronIcon?: boolean
  locale: string
  primaryCTA?: CTAContent | null
  secondaryCTA?: CTAContent | null
  site?: ExperienceSite
}) {
  const primary = resolveCTA(primaryCTA, locale, site)
  const secondary = resolveCTA(secondaryCTA, locale, site)
  // A forced chevron is the default for this placement; the editor can still switch the icon off.
  const iconFor = (raw: CTAContent | null | undefined, cta: NonNullable<typeof primary>) =>
    forceChevronIcon ? (raw?.showIcon === false || raw?.icon === 'none' ? undefined : cta.icon || 'chevron-right') : cta.showIcon ? cta.icon || 'chevron-right' : undefined
  if (!primary && !secondary) return null
  return (
    <div className={`actions${alignment !== 'left' ? ` actions--${alignment}` : ''}`}>
      {primary ? <Button href={primary.href} icon={iconFor(primaryCTA, primary)} iconPosition={primary.iconPosition ?? 'right'} label={primary.label} target={primary.target} variant={primary.variant ?? 'primary'} /> : null}
      {secondary ? <Button href={secondary.href} icon={iconFor(secondaryCTA, secondary)} iconPosition={secondary.iconPosition ?? 'right'} label={secondary.label} target={secondary.target} variant={secondary.variant ?? 'outline'} /> : null}
    </div>
  )
}
