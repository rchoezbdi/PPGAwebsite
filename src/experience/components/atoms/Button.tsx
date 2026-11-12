'use client'

import Icon from './Icon'
import type { EditableButtonVariant } from './buttonVariants'

/**
 * The public site has three visual button treatments: cyan CTA, navy solid and
 * outlined. `ghost`/`danger` are reserved for utility and destructive actions.
 * Legacy aliases are accepted only while old page data is migrated; they render
 * through one of these semantic treatments instead of creating more styles.
 */
export type ButtonVariant = EditableButtonVariant | 'ghost' | 'danger' | 'tertiary' | 'light' | 'dark' | 'bright'
export type ButtonSize = 'sm' | 'md' | 'lg' | 'small' | 'medium' | 'large'

export type ButtonProps = {
  ariaLabel?: string
  className?: string
  disabled?: boolean
  href?: string | null
  icon?: string
  iconPosition?: 'left' | 'right'
  /** Icon-only buttons need an accessible name. */
  iconOnly?: boolean
  label?: string
  loading?: boolean
  onClick?: () => void
  rel?: string
  size?: ButtonSize
  target?: string
  variant?: ButtonVariant
  width?: 'auto' | 'full'
  fullWidth?: boolean
}

const normalizeVariant = (variant: ButtonVariant): Exclude<ButtonVariant, 'tertiary' | 'light' | 'dark' | 'bright'> => {
  if (variant === 'bright') return 'primary'
  if (variant === 'tertiary' || variant === 'light') return 'outline'
  if (variant === 'dark') return 'secondary'
  return variant
}

/** One reusable button primitive. An icon-only control is the same Button with `iconOnly`,
 * never a separate component or visual system. */
export default function Button({ ariaLabel, className: customClass, disabled, href, icon, iconOnly = false, iconPosition = 'right', label = '', loading = false, onClick, rel, size = 'md', target, variant = 'primary', width = 'auto', fullWidth = false }: ButtonProps) {
  const modalKey = href?.startsWith('modal:') ? href.slice('modal:'.length) : ''
  const isIconOnly = iconOnly || (!label && Boolean(icon))
  if (!label && !isIconOnly) return null
  if (isIconOnly && !icon) return null
  const normalizedSize = size === 'small' ? 'sm' : size === 'large' ? 'lg' : size === 'medium' ? 'md' : size
  const className = `button button--${normalizeVariant(variant)} button--${normalizedSize}${isIconOnly ? ' button--icon-only' : ''}${width === 'full' || fullWidth ? ' button--full' : ''}${customClass ? ` ${customClass}` : ''}`
  const content = (
    <>
      {icon && (isIconOnly || iconPosition === 'left') ? <Icon name={icon} size={isIconOnly ? 20 : 16} /> : null}
      {!isIconOnly ? <span>{loading ? '…' : label}</span> : null}
      {icon && !isIconOnly && iconPosition === 'right' ? <Icon name={icon} size={16} /> : null}
    </>
  )
  const isDisabled = disabled || loading
  if (href && !modalKey && !isDisabled) {
    return (
      <a aria-label={ariaLabel ?? (isIconOnly ? label || undefined : undefined)} aria-busy={loading || undefined} className={className} href={href} rel={rel ?? (target === '_blank' ? 'noreferrer' : undefined)} target={target}>
        {content}
      </a>
    )
  }
  return (
      <button aria-busy={loading || undefined} aria-label={ariaLabel ?? (isIconOnly ? label || undefined : undefined)} className={className} disabled={isDisabled} onClick={() => { if (modalKey && typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('bd:open-content-modal', { detail: { modalKey } })); else onClick?.() }} type="button">
      {content}
    </button>
  )
}
