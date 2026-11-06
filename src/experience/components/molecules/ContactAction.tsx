import Icon from '../atoms/Icon'
import Link from '../atoms/Link'

export type ContactActionType = 'phone' | 'email' | 'whatsapp' | 'portal'

const iconByType: Record<ContactActionType, string> = { phone: 'phone', email: 'mail', whatsapp: 'whatsapp', portal: 'user' }
const hrefFor = (type: ContactActionType, value: string) => {
  if (type === 'phone') return `tel:${value.replace(/[^+\d]/g, '')}`
  if (type === 'email') return `mailto:${value}`
  if (type === 'whatsapp') return `https://wa.me/${value.replace(/[^\d]/g, '')}`
  return value
}

export default function ContactAction({ href, icon, label, type, value }: {
  href?: string
  icon?: string
  label: string
  type: ContactActionType
  value: string
}) {
  if (!value) return null
  return (
    <Link className="contact-action" href={href ?? hrefFor(type, value)} target={type === 'whatsapp' ? '_blank' : undefined}>
      <Icon name={icon ?? iconByType[type]} size={18} />
      <span className="contact-action__label">{label}</span>
    </Link>
  )
}
