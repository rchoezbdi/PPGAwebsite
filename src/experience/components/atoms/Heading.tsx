import type { ReactNode } from 'react'

export type HeadingLevel = 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'

export default function Heading({ align, children, className, level = 'h2', size }: {
  align?: 'left' | 'center' | 'right'
  children: ReactNode
  className?: string
  level?: HeadingLevel
  size?: 'sm' | 'md' | 'lg' | 'xl'
}) {
  if (!children) return null
  const Tag = level
  const classes = ['heading', size ? `heading--${size}` : '', align ? `text-${align}` : '', className].filter(Boolean).join(' ')
  return <Tag className={classes || undefined}>{children}</Tag>
}
