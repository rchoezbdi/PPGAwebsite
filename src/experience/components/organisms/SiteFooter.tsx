import { resolveExperienceLink } from '@/experience/navigation/resolver'
import Icon, { type IconName } from '../atoms/Icon'
import Media from '../atoms/Media'
import Text from '../atoms/Text'
import AlertContactGroup, { type AlertContact } from '../molecules/AlertContactGroup'
import FooterLinkGroup, { type FooterLink } from '../molecules/FooterLinkGroup'
import { asMediaAlt, asMediaURL, text } from '../shared'
import type { ExperienceComponentProps, NavigationItem } from '@/experience/registry/componentRegistry'

type FooterColumn = { heading?: string; title?: string; id?: string | number | null; links?: NavigationItem[] | null }
type SocialLink = { href: string; icon?: string; id?: string | number; label: string }

const toFooterLinks = (items: NavigationItem[] | null | undefined, locale: string, site: ExperienceComponentProps['site']): FooterLink[] =>
  (items ?? []).map((item) => ({
    id: item.id,
    label: item.label ?? '',
    href: resolveExperienceLink({ linkType: item.linkType, page: item.page as Parameters<typeof resolveExperienceLink>[0]['page'], url: item.url ?? undefined, locale, fallbackSite: site.slug, localizedRoutes: site.localizedRoutes }).href,
  }))

/** SiteFooter = Logo + description + FooterNavigation (FooterLinkGroup[]) + AlertContactGroup +
 * SocialLinks + LegalLinks + Copyright, per spec §3. Global-only, same as SiteHeader. */
export default function SiteFooter({ content, settings, locale, site }: ExperienceComponentProps) {
  const p = { ...settings, ...content }
  const logoURL = asMediaURL(p.logo)
  const logoAlt = asMediaAlt(p.logo, site.name)
  const rawColumns = (p.columns ?? []) as FooterColumn[]
  let sawLegalColumn = false
  const columns = rawColumns.filter((column) => {
    if (!/^(legal|legales|jur[ií]dico)/i.test(column.heading ?? column.title ?? '')) return true
    if (sawLegalColumn) return false
    sawLegalColumn = true
    return true
  })
  const contacts = (p.contacts ?? []) as AlertContact[]
  const social = (p.social ?? []) as SocialLink[]
  const legalLinks = toFooterLinks((p.legalLinks ?? p.legalNavigation) as NavigationItem[] | undefined, locale, site)

  const brandName = !site.name || site.name.toLowerCase() === 'home' ? 'Best Doctors Insurance' : site.name
  const isBestDoctors = site.slug === 'home' || /best doctors/i.test(brandName)
  // The footer sits on a dark band: when it follows the app's logo it uses the app's dark-background logo.
  const darkLogoURL = asMediaURL(p.logoDark)
  const footerLogoURL = p.logoSource === 'custom' || p.logoSource === 'app-light'
    ? logoURL
    : darkLogoURL || logoURL || (isBestDoctors ? '/brand-logo-white.svg' : null)
  const hasLegalColumn = columns.some((column) => /^(legal|legales|jur[ií]dico)/i.test(column.heading ?? column.title ?? ''))
  const visibleColumns = columns.slice(0, 4)
  if (legalLinks.length && !hasLegalColumn && visibleColumns.length < 4) visibleColumns.push({ title: 'Legal' })

  return (
    <footer className="experience-footer">
      <div className="experience-footer__main">
        <div className="section-container experience-footer__grid">
          <div className="experience-footer__brand">
            {footerLogoURL ? <Media alt={isBestDoctors && !darkLogoURL ? 'Best Doctors Insurance' : logoAlt} className="experience-footer__logo" src={footerLogoURL} /> : null}
            <strong>{brandName}</strong>
            <Text tone="muted">{text(p.description)}</Text>
          </div>
          {visibleColumns.map((column, index) => (
            <FooterLinkGroup
              key={column.id ?? column.heading ?? column.title ?? index}
              links={(() => {
                const isLegal = /^(legal|legales|jur[ií]dico)/i.test(column.heading ?? column.title ?? '')
                const ownLinks = toFooterLinks(column.links, locale, site)
                if (!isLegal || !legalLinks.length) return ownLinks
                const merged = [...ownLinks, ...legalLinks]
                return merged.filter((link, linkIndex) => merged.findIndex((candidate) => `${candidate.label}|${candidate.href}` === `${link.label}|${link.href}`) === linkIndex)
              })()}
              title={column.heading ?? column.title}
            />
          ))}
        </div>
        {contacts.length ? <div className="section-container"><AlertContactGroup contacts={contacts} /></div> : null}
      </div>
      <div className="experience-footer__bottom-band">
        <div className="section-container experience-footer__bottom">
          <span>{text(p.copyright) || `© ${new Date().getFullYear()} ${brandName}`}</span>
          {social.length ? (
            <div className="experience-social-links">
              {social.map((item, index) => (
                <a aria-label={item.label} className="experience-social-links__icon" href={item.href} key={item.id ?? index} rel="noopener noreferrer" target="_blank">
                  <Icon ariaHidden name={(item.icon as IconName) || 'globe'} size={18} />
                </a>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </footer>
  )
}
