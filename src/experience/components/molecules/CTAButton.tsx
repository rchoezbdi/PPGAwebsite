import Button, { type ButtonSize, type ButtonVariant } from '../atoms/Button'
import { resolveCTA, type CTAContent } from '../shared'
import type { ExperienceSite } from '@/experience/registry/componentRegistry'

/**
 * The single bridge between an editorial button (`CTAContent`, the shape produced by the
 * Page Builder's button group) and the `Button` atom. Every organism that shows a button from
 * content must render through this molecule so that text, "Mostrar botón", variant, icon
 * (show/hide, name, position) and Type Link (internal, external, mail, tel, popup, none)
 * behave identically in the Page Builder, the preview and production.
 */
export default function CTAButton({ ariaLabel, className, cta, defaultIcon = 'chevron-right', defaultVariant = 'primary', disabled, fallbackHref, forceIcon, locale, site, size, target, hrefOverride }: {
  ariaLabel?: string
  className?: string
  cta?: CTAContent | null
  /** Icon used when the editor enabled the icon but did not pick one. */
  defaultIcon?: string
  /** Variant used when the content has not chosen one. */
  defaultVariant?: ButtonVariant
  disabled?: boolean
  /** Destination used only when the content has none (e.g. a site-level default). */
  fallbackHref?: string | null
  /** Placement-specific icon that replaces the editor's choice while the icon is still enabled. */
  forceIcon?: string
  locale: string
  site?: ExperienceSite
  size?: ButtonSize
  target?: string
  /** Placement-specific destination (e.g. a document URL) that replaces the resolved link. */
  hrefOverride?: string | null
}) {
  const resolved = resolveCTA(cta, locale, site)
    ?? (fallbackHref && cta ? resolveCTA({ ...cta, linkType: 'external', page: undefined, url: fallbackHref }, locale, site) : null)
  if (!resolved) return null
  const icon = resolved.showIcon ? forceIcon || resolved.icon || defaultIcon : undefined
  const isExternalMailOrTel = /^(?:mailto|tel):/i.test(resolved.href ?? '')
  return (
    <Button
      ariaLabel={ariaLabel}
      className={className}
      disabled={disabled}
      href={hrefOverride || resolved.href}
      icon={icon}
      iconPosition={resolved.iconPosition ?? 'right'}
      label={resolved.label}
      size={size}
      target={isExternalMailOrTel ? undefined : target ?? resolved.target}
      variant={resolved.variant ?? defaultVariant}
    />
  )
}
