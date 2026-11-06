'use client'

import { useEffect, useRef, useState } from 'react'
import Icon from '../atoms/Icon'
import Link from '../atoms/Link'

export type DropdownMenuItem = { active?: boolean; href?: string | null; icon?: string; id?: string | number; label: string; newWindow?: boolean; onSelect?: () => void }

export default function DropdownMenu({ alignment = 'left', icon, items, label, variant = 'default' }: {
  alignment?: 'left' | 'right'
  icon?: string
  items: DropdownMenuItem[]
  label: string
  variant?: 'default' | 'compact' | 'secondary' | 'primary' | 'outline'
}) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDocumentClick = (event: MouseEvent) => { if (!rootRef.current?.contains(event.target as Node)) setOpen(false) }
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', onDocumentClick)
    document.addEventListener('keydown', onKeyDown)
    return () => { document.removeEventListener('mousedown', onDocumentClick); document.removeEventListener('keydown', onKeyDown) }
  }, [open])

  if (!items.length) return null
  // Action variants are the shared Button atom, so height, type, radius and colors stay governed.
  const isActionVariant = variant === 'primary' || variant === 'secondary' || variant === 'outline'

  return (
    <div className={`dropdown-menu dropdown-menu--${variant}`} ref={rootRef}>
      <button aria-expanded={open} aria-haspopup="menu" className={`dropdown-menu__trigger${isActionVariant ? ` button button--${variant} button--md` : ''}`} onClick={() => setOpen((current) => !current)} type="button">
        {icon ? <Icon name={icon} size={16} /> : null}
        <span>{label}</span>
        <Icon name="chevron-down" size={14} />
      </button>
      {open ? (
        <ul className={`dropdown-menu__panel dropdown-menu__panel--${alignment}`}>
          {items.map((item, index) => (
            <li key={item.id ?? `${item.label}-${index}`}>
              {item.href ? (
                <Link className={item.active ? 'is-active' : undefined} href={item.href} target={item.newWindow ? '_blank' : undefined}>
                  {item.icon ? <Icon name={item.icon} size={16} /> : null}
                  {item.label}
                </Link>
              ) : (
                <button className={item.active ? 'is-active' : undefined} onClick={() => { item.onSelect?.(); setOpen(false) }} type="button">
                  {item.icon ? <Icon name={item.icon} size={16} /> : null}
                  {item.label}
                </button>
              )}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}
