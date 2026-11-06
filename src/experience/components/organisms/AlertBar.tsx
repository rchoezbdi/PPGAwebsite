import Icon from '../atoms/Icon'
import type { CSSProperties, ReactNode } from 'react'
import ContactAction, { type ContactActionType } from '../molecules/ContactAction'
import AlertBarDismissible from '../molecules/AlertBarDismissible'
import MobileSlideRotator from '../molecules/MobileSlideRotator'
import LegacyUtilityHeader from './LegacyUtilityHeader'
import { text } from '../shared'
import type { ExperienceComponentProps } from '@/experience/registry/componentRegistry'
import { resolveExperienceLink } from '@/experience/navigation/resolver'

/** Fixed Home organism: CMS authors edit declared slots, never its DOM or layout. Both real
 * render paths below (Legacy and the plain announcement) are wrapped in `AlertBarDismissible` —
 * 23 sep, explicit UX request: a close button that remembers the dismissal for 6h (not forever,
 * not just this page load — see that component for why), plus a slow marquee scroll on the
 * content itself (paused on hover) so a longer message/contact list fits one slim line instead
 * of wrapping across several. */
export default function AlertBar({ content, locale, settings, site }: ExperienceComponentProps) {
  const p = { ...settings, ...content }
  const now = Date.now()
  const start = text(p.startsAt)
  const end = text(p.endsAt)
  const startsAt = start ? new Date(start).getTime() : undefined
  const endsAt = end ? new Date(end).getTime() : undefined
  const isActive = p.enabled !== false
    && (startsAt === undefined || (Number.isFinite(startsAt) && startsAt <= now))
    && (endsAt === undefined || (Number.isFinite(endsAt) && endsAt >= now))
  if (!isActive) return null
  if ([p.actions, p.languages, p.portalLinks].some((value) => Array.isArray(value) && value.some((item) => item && typeof item === 'object'))) {
    return <AlertBarDismissible locale={locale}><LegacyUtilityHeader locale={locale} localizedRoutes={site.localizedRoutes} siteSlug={site.slug} value={p} /></AlertBarDismissible>
  }
  if (!text(p.message)) return null
  const requestedKind = text(p.kind)
  const kind = requestedKind === 'emergency' || requestedKind === 'shipping' ? requestedKind : 'announcement'
  const requestedContactType = text(p.contactType)
  const contactType = ['phone', 'email', 'whatsapp', 'portal'].includes(requestedContactType)
    ? requestedContactType as ContactActionType
    : undefined
  const requestedDuration = Number(p.marqueeDuration)
  const marqueeDuration = Number.isFinite(requestedDuration) && requestedDuration >= 10 && requestedDuration <= 180 ? requestedDuration : 60
  const announcementHref = resolveExperienceLink({ url: text(p.href), locale, fallbackSite: site.slug, localizedRoutes: site.localizedRoutes }).href

  // Rendered twice (`aria-hidden` on the duplicate) for a seamless marquee loop — same reasoning
  // as LegacyUtilityHeader's own scrollContent: a single copy would visibly jump when it restarts.
  const messageContent = (
    <>
      {kind === 'emergency' ? <Icon ariaHidden name="shield" size={16} /> : null}
      {kind === 'shipping' ? <Icon ariaHidden name="truck" size={20} /> : null}
      <span>{text(p.message)}</span>
      {contactType && text(p.contactValue) ? <ContactAction label={text(p.contactLabel) || text(p.contactValue)} type={contactType} value={text(p.contactValue)} /> : null}
      {announcementHref ? <a href={announcementHref}>{text(p.linkLabel) || text(p.href)}</a> : null}
    </>
  )

  // Mobile-only: the same content, but as full, readable slides instead of a scrolling line that
  // shows permanently mid-word-cut text at a narrow viewport's edges (the reported mobile bug).
  const mobileSlides: ReactNode[] = [
    <>
      {kind === 'emergency' ? <Icon ariaHidden name="shield" size={16} /> : null}
      {kind === 'shipping' ? <Icon ariaHidden name="truck" size={20} /> : null}
      <span>{text(p.message)}</span>
    </>,
    ...(contactType && text(p.contactValue) ? [<ContactAction key="contact" label={text(p.contactLabel) || text(p.contactValue)} type={contactType} value={text(p.contactValue)} />] : []),
    ...(announcementHref ? [<a href={announcementHref} key="link">{text(p.linkLabel) || text(p.href)}</a>] : []),
  ]

  return (
    <AlertBarDismissible locale={locale}>
      <div className={`experience-announcement experience-announcement--${kind}`} style={{ '--utility-marquee-duration': `${marqueeDuration}s` } as CSSProperties}>
        <div className="section-container experience-announcement__marquee-viewport">
          <div className="experience-announcement__marquee-track">
            <div className="experience-announcement__marquee-content">{messageContent}</div>
            <div aria-hidden="true" className="experience-announcement__marquee-content" inert>{messageContent}</div>
          </div>
        </div>
        <div className="section-container">
          <MobileSlideRotator showDots={false} slides={mobileSlides} />
        </div>
      </div>
    </AlertBarDismissible>
  )
}
