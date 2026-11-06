'use client'

import { useEffect, useMemo, useState } from 'react'
import Icon from '@/experience/components/atoms/Icon'
import { designTextColor } from '@/experience/components/shared'

type BackToTopProps = {
  content: Record<string, unknown>
  settings: Record<string, unknown>
}

const asNumber = (value: unknown, fallback: number) => {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string') {
    const parsed = Number(value)
    if (Number.isFinite(parsed)) return parsed
  }
  return fallback
}

const asText = (value: unknown, fallback = '') => (typeof value === 'string' ? value : fallback)

export default function BackToTopRuntime({ content, settings }: BackToTopProps) {
  const props = { ...settings, ...content }
  const enabled = props.enabled !== false
  const [visible, setVisible] = useState(false)

  const showAfter = Math.max(0, asNumber(props.showAfter, 320))
  const size = Math.max(40, Math.min(88, asNumber(props.size, 44)))
  const offsetX = Math.max(8, asNumber(props.offsetX, 12))
  const offsetY = Math.max(8, asNumber(props.offsetY, 24))
  const position = asText(props.position, 'left') === 'right' ? 'right' : 'left'
  const configuredIcon = asText(props.icon, 'chevron-up').trim() || 'chevron-up'
  const icon = configuredIcon === '↑' || configuredIcon === 'arrow-up' ? 'chevron-up' : configuredIcon
  const backgroundColor = designTextColor(props.backgroundColor) ?? asText(props.backgroundColor, 'var(--brand)')
  const iconColor = designTextColor(props.iconColor) ?? asText(props.iconColor, 'var(--surface)')

  useEffect(() => {
    if (!enabled) return
    const onScroll = () => setVisible(window.scrollY > showAfter)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [enabled, showAfter])

  const style = useMemo(() => ({
    width: `${size}px`,
    height: `${size}px`,
    bottom: `${offsetY}px`,
    left: position === 'left' ? `${offsetX}px` : 'auto',
    right: position === 'right' ? `${offsetX}px` : 'auto',
    background: backgroundColor,
    color: iconColor,
  }), [backgroundColor, iconColor, offsetX, offsetY, position, size])

  if (!enabled || !visible) return null

  return (
    <button
      aria-label="Volver arriba"
      className="experience-back-to-top"
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      style={style}
      type="button"
    >
      <Icon name={icon} size={20} />
    </button>
  )
}
