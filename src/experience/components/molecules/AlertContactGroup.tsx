import ContactAction, { type ContactActionType } from './ContactAction'

export type AlertContact = { icon?: string; id?: string | number; label: string; type: ContactActionType; value: string }

export default function AlertContactGroup({ contacts }: { contacts?: AlertContact[] | null }) {
  const items = contacts ?? []
  if (!items.length) return null
  return (
    <div className="alert-contact-group">
      {items.map((contact, index) => (
        <ContactAction icon={contact.icon} key={contact.id ?? `${contact.type}-${index}`} label={contact.label} type={contact.type} value={contact.value} />
      ))}
    </div>
  )
}
