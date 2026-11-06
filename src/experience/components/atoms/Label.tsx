import type { ReactNode } from 'react'

/** Eyebrows, category tags, small badges — anywhere the spec calls for a short uppercase label. */
export default function Label({ children, variant = 'eyebrow' }: { children: ReactNode; variant?: 'eyebrow' | 'tag' | 'category' }) {
  if (!children) return null
  if (variant === 'eyebrow') {
    return <div className="eyebrow"><span aria-hidden="true" />{children}</div>
  }
  return <span className={`label label--${variant}`}>{children}</span>
}
