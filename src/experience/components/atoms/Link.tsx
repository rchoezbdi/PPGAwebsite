import type { ReactNode } from 'react'

/** Plain link primitive — takes an already-resolved `href` (internal/external resolution happens
 * once, upstream, via `resolveExperienceLink`) so this stays a dumb, reusable atom. */
export default function Link({ ariaLabel, children, className, href, rel, target }: {
  ariaLabel?: string
  children: ReactNode
  className?: string
  href?: string | null
  rel?: string
  target?: string
}) {
  if (!href) return null
  return (
    <a aria-label={ariaLabel} className={className} href={href} rel={rel ?? (target === '_blank' ? 'noreferrer' : undefined)} target={target}>
      {children}
    </a>
  )
}
