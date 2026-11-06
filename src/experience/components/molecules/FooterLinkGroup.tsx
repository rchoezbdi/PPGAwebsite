import Heading from '../atoms/Heading'
import Link from '../atoms/Link'
import Icon from '../atoms/Icon'

export type FooterLink = { href?: string | null; id?: string | number | null; label: string }

export default function FooterLinkGroup({ links, title }: { links?: FooterLink[] | null; title?: string }) {
  const items = (links ?? []).filter((item) => item.href)
  if (!title && !items.length) return null
  const linkList = () => <ul className="experience-footer__links">
    {items.map((item, index) => (
      <li key={item.id ?? `${item.label}-${index}`}><Link href={item.href}>{item.label}</Link></li>
    ))}
  </ul>
  return (
    <>
      <div className="footer-link-group footer-link-group--desktop">
        <Heading level="h3" size="sm">{title}</Heading>
        {linkList()}
      </div>
      <details className="footer-link-group footer-link-group--mobile">
        <summary>{title}<Icon ariaHidden name="chevron-down" size={16} /></summary>
        {linkList()}
      </details>
    </>
  )
}
