import DropdownMenu from './DropdownMenu'

export type PortalOption = { href: string; icon?: string; id?: string | number; label: string; newWindow?: boolean }

const DEFAULT_TRIGGER_LABEL: Record<string, string> = { en: 'Portals', es: 'Portales', pt: 'Portais' }

/** Data-driven by design — the spec calls out Member/Distributor/Provider portals as an example,
 * not a fixed set; any list of {label, href} works. `triggerLabel` should normally come from
 * editorial content (matches the locale it was written in); the default here is a locale-aware
 * fallback for when it isn't set, not a hardcoded Spanish string regardless of `locale`. */
export default function PortalSelector({ locale = 'en', portals, triggerLabel, variant = 'secondary', icon = 'user', hidden = false }: { locale?: string; portals?: PortalOption[] | null; triggerLabel?: string; variant?: 'primary' | 'secondary' | 'outline'; icon?: string; hidden?: boolean }) {
  const items = portals ?? []
  if (!items.length || hidden) return null
  return <DropdownMenu alignment="right" icon={icon} items={items.map((item) => ({ ...item, newWindow: item.newWindow }))} label={triggerLabel ?? DEFAULT_TRIGGER_LABEL[locale] ?? DEFAULT_TRIGGER_LABEL.en} variant={variant} />
}
