import type { ReactNode } from 'react'

export default function Text({ align, children, className, size = 'md', tone = 'default', weight = 'normal' }: {
  align?: 'left' | 'center' | 'right'
  children: ReactNode
  className?: string
  size?: 'sm' | 'md' | 'lg'
  tone?: 'default' | 'muted' | 'brand' | 'inverse'
  weight?: 'normal' | 'medium' | 'bold'
}) {
  if (!children) return null
  const classes = ['text', `text--${size}`, `text--${tone}`, weight !== 'normal' ? `text--${weight}` : '', align ? `text-${align}` : '', className].filter(Boolean).join(' ')
  return <p className={classes}>{children}</p>
}
