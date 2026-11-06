import Icon from '../atoms/Icon'
import type { CSSProperties, ReactNode } from 'react'
import { text } from '../shared'
import { resolveExperienceLink } from '@/experience/navigation/resolver'
import type { LocalizedRoutes } from '@/experience/navigation/localizedRoutes'
import MobileSlideRotator from '../molecules/MobileSlideRotator'

type UtilityAction = { icon?: string; label?: string; value?: string; href?: string; page?: unknown; newWindow?: boolean }
type Language = { code?: string; label?: string; href?: string; active?: boolean }
type PortalLink = { label?: string; href?: string; newWindow?: boolean }

const records = <T,>(value: unknown): T[] => Array.isArray(value) ? value.filter((item) => item && typeof item === 'object') as T[] : []

/** Compatibility renderer for persisted utility-header content. */
const flagForLocale = (locale: string) => ({ en: 'us', es: 'es', pt: 'br' }[locale] ?? 'us')
const localizedHref = (href: string, locale: string) => {
  if (/^\/(?:en|es|pt)(?:\/|$)/.test(href)) return href
  try {
    const parsed = new URL(href, 'https://preview.bestdoctorsinsurance.com')
    const path = parsed.pathname.replace(/^\/(?:en|es|pt)(?=\/|$)/, '')
    return `/${locale}${path === '/' ? '' : path}${parsed.search}${parsed.hash}`
  } catch { return `/${locale}` }
}

export default function LegacyUtilityHeader({ locale, siteSlug, localizedRoutes, value: p }: { locale: string; siteSlug: string; localizedRoutes?: LocalizedRoutes; value: Record<string, unknown> }) {
  const actions = records<UtilityAction>(p.actions)
  // Resolve whatever is persisted — a bare 2-letter ISO code (what the admin picker now writes)
  // or a legacy regional-indicator emoji string (what it used to write, e.g. '🇨🇴') — down to a
  // 2-letter code, then render a real flag image. Regional-indicator emoji have no glyph in
  // Windows' Segoe UI Emoji font, so rendering the emoji itself (as this used to) showed bare
  // letters there instead of a flag — see the same note on CustomPageBuilder.tsx's FlagGlyph.
  const flagValue = text(p.flagEmoji)
  const flagCode = (/^[a-z]{2}$/i.test(flagValue)
    ? flagValue.toUpperCase()
    : [...flagValue]
        .map((char) => char.codePointAt(0) ?? 0)
        .filter((point) => point >= 0x1f1e6 && point <= 0x1f1ff)
        .map((point) => String.fromCharCode(65 + point - 0x1f1e6))
        .join('')) || 'CO'
  const emailAction = actions.find((action) => {
    const icon = text(action.icon).toLowerCase()
    const href = text(action.href).toLowerCase()
    return icon === 'mail' || icon === 'email' || href.startsWith('mailto:')
  })
  const contactActions = actions.filter((action) => action !== emailAction)
  const languages = records<Language>(p.languages)
  const portals = records<PortalLink>(p.portalLinks)
  const currentLocale = locale.toLowerCase()
  const activeLanguage = languages.find((item) => text(item.code).toLowerCase() === currentLocale)
    ?? languages.find((item) => item.active)
    ?? languages[0]
  // A legacy instance can have a single active EN option while the page is rendered in a
  // different locale. It is still the current/only option, not an alternate destination.
  const alternateLanguages = languages.filter((item) => item !== activeLanguage)
  const localePaths = p.localePaths && typeof p.localePaths === 'object'
    ? p.localePaths as Record<string, unknown>
    : {}
  const requestedDuration = Number(p.marqueeDuration)
  const marqueeDuration = Number.isFinite(requestedDuration) && requestedDuration >= 10 && requestedDuration <= 180 ? requestedDuration : 60

  // The part of the bar that actually scrolls in the marquee — see the render-twice note below.
  const scrollContent: ReactNode = (
    <>
      <div className="experience-utility-header__contact-column">
        <div className="experience-utility-header__intro" data-editor-field="message">
          <span aria-label={text(p.flagLabel) || 'Bandera'} className="experience-utility-header__flag" role="img">
            {flagCode === 'CO'
              // token-audit-ignore: national flag colors are not brand colors
              ? <svg aria-hidden="true" width="24" height="16" viewBox="0 0 24 16"><path fill="#fcd116" d="M0 0h24v8H0z"/><path fill="#003893" d="M0 8h24v4H0z"/><path fill="#ce1126" d="M0 12h24v4H0z"/></svg>
              : <img alt="" width={24} height={16} src={`/flags/4x3/${flagCode.toLowerCase()}.svg`} style={{ display: 'block', borderRadius: 2 }} />}
          </span>
          <strong>{text(p.message) || '¿Necesitas ayuda?'}</strong>
        </div>
        {emailAction ? (
          <a className="experience-utility-header__email" data-editor-field="actions" href={resolveExperienceLink({ page: emailAction.page as Parameters<typeof resolveExperienceLink>[0]['page'], url: text(emailAction.href), locale, fallbackSite: siteSlug, localizedRoutes }).href ?? '#'} rel={emailAction.newWindow ? 'noopener noreferrer' : undefined} target={emailAction.newWindow ? '_blank' : undefined}>
            <span className="experience-utility-header__action-icon"><Icon ariaHidden name={text(emailAction.icon) || 'mail'} size={16} /></span>
            <span><small>{text(emailAction.label)}</small><b>{text(emailAction.value)}</b></span>
          </a>
        ) : null}
      </div>
      <nav aria-label="Canales de atención" className="experience-utility-header__actions" data-editor-field="actions">
        {contactActions.map((action, index) => (
          <a href={resolveExperienceLink({ page: action.page as Parameters<typeof resolveExperienceLink>[0]['page'], url: text(action.href), locale, fallbackSite: siteSlug, localizedRoutes }).href ?? '#'} key={`${text(action.label)}-${index}`} rel={action.newWindow ? 'noopener noreferrer' : undefined} target={action.newWindow ? '_blank' : undefined}>
            <span className="experience-utility-header__action-icon"><Icon ariaHidden name={text(action.icon) || 'phone'} size={16} /></span>
            <span><small>{text(action.label)}</small><b>{text(action.value)}</b></span>
          </a>
        ))}
      </nav>
    </>
  )

  // Mobile-only: the flag + message stays fixed while the email and each contact channel rotate
  // beneath it, one full readable slide at a time — see MobileSlideRotator.
  const mobileIntro: ReactNode = (
    <div className="experience-utility-header__intro" data-editor-field="message">
      <span aria-label={text(p.flagLabel) || 'Bandera'} className="experience-utility-header__flag" role="img">
        {flagCode === 'CO'
          // token-audit-ignore: national flag colors are not brand colors
          ? <svg aria-hidden="true" width="24" height="16" viewBox="0 0 24 16"><path fill="#fcd116" d="M0 0h24v8H0z"/><path fill="#003893" d="M0 8h24v4H0z"/><path fill="#ce1126" d="M0 12h24v4H0z"/></svg>
          : <img alt="" width={24} height={16} src={`/flags/4x3/${flagCode.toLowerCase()}.svg`} style={{ display: 'block', borderRadius: 2 }} />}
      </span>
      <strong>{text(p.message) || '¿Necesitas ayuda?'}</strong>
    </div>
  )
  const mobileSlides: ReactNode[] = [
    ...(emailAction ? [
          <a key="email" className="experience-utility-header__email" href={resolveExperienceLink({ page: emailAction.page as Parameters<typeof resolveExperienceLink>[0]['page'], url: text(emailAction.href), locale, fallbackSite: siteSlug, localizedRoutes }).href ?? '#'} rel={emailAction.newWindow ? 'noopener noreferrer' : undefined} target={emailAction.newWindow ? '_blank' : undefined}>
          <span className="experience-utility-header__action-icon"><Icon ariaHidden name={text(emailAction.icon) || 'mail'} size={16} /></span>
          <span><small>{text(emailAction.label)}</small><b>{text(emailAction.value)}</b></span>
        </a>
    ] : []),
    ...contactActions.map((action, index) => (
      <nav aria-label={text(action.label) || 'Canal de atención'} className="experience-utility-header__actions experience-utility-header__actions--single" key={`${text(action.label)}-${index}`}>
        <a href={resolveExperienceLink({ page: action.page as Parameters<typeof resolveExperienceLink>[0]['page'], url: text(action.href), locale, fallbackSite: siteSlug, localizedRoutes }).href ?? '#'} rel={action.newWindow ? 'noopener noreferrer' : undefined} target={action.newWindow ? '_blank' : undefined}>
          <span className="experience-utility-header__action-icon"><Icon ariaHidden name={text(action.icon) || 'phone'} size={16} /></span>
          <span><small>{text(action.label)}</small><b>{text(action.value)}</b></span>
        </a>
      </nav>
    )),
  ]

  return (
    <header className="experience-utility-header" aria-label={text(p.accessibleLabel) || 'Ayuda y acceso rápido'} style={{
      '--utility-marquee-duration': `${marqueeDuration}s`,
    } as CSSProperties}>
      {/* Marquee wrapper — 23 sep, explicit UX request: the message + contact channels scroll
         slowly right-to-left (pure CSS animation, pauses on `:hover`/an open dropdown — no JS
         needed for the motion itself) so they fit one slim line instead of wrapping to several,
         especially on mobile. Rendered twice (`aria-hidden` on the duplicate) for a seamless
         loop — a single copy would jump/snap when it restarts. Language/portal stay OUTSIDE the
         track, un-duplicated: they're real interactive `<details>` controls, and two live copies
         of the same dropdown would be a duplicate-control a11y problem, not just a visual one —
         also moot going forward, since that data now lives on the header pill instead (23 sep
         migration), so these will normally be empty here. The close button lives outside this
         component entirely (AlertBarDismissible), so it never scrolls away either. */}
      <div className="experience-utility-header__row">
        <div className="experience-utility-header__marquee-viewport">
          <div className="experience-utility-header__marquee-track">
            <div className="experience-utility-header__inner">{scrollContent}</div>
            <div aria-hidden="true" className="experience-utility-header__inner" inert>{scrollContent}</div>
          </div>
        </div>
        <div className="experience-utility-header__mobile-stack">
          {mobileIntro}
          <MobileSlideRotator className="experience-utility-header__mobile-rotator" showDots={false} slides={mobileSlides} />
        </div>
        {alternateLanguages.length ? (
          <details className="experience-utility-header__dropdown experience-utility-header__language" data-editor-field="languages">
            <summary aria-label={text(p.languageButtonLabel) || 'Cambiar idioma'}><img alt="" height={16} src={`/flags/4x3/${flagForLocale(text(activeLanguage?.code).toLowerCase() || locale)}.svg`} width={24} /><span>{text(activeLanguage?.code).toUpperCase()}</span><Icon ariaHidden name="chevron-down" size={15} /></summary>
            <div role="menu">{alternateLanguages.map((language, index) => { const code = text(language.code).toLowerCase(); const equivalentPath = text(localePaths[code]); return <a href={equivalentPath || localizedHref(text(language.href), code || locale)} key={`${text(language.code)}-${index}`} role="menuitem"><img alt="" height={16} src={`/flags/4x3/${flagForLocale(code || locale)}.svg`} width={24} />{text(language.label) || text(language.code).toUpperCase()}</a> })}</div>
          </details>
        ) : null}
        {portals.length ? (
          <details className="experience-utility-header__dropdown experience-utility-header__portal" data-editor-field="portalLinks">
            <summary><Icon ariaHidden name={text(p.portalIcon) || 'user'} size={16} /><span>{text(p.portalButtonText) || 'Iniciar sesión portal'}</span><Icon ariaHidden name="chevron-down" size={15} /></summary>
            <div role="menu">{portals.map((portal, index) => <a href={text(portal.href) || '#'} key={`${text(portal.label)}-${index}`} rel={portal.newWindow ? 'noopener noreferrer' : undefined} role="menuitem" target={portal.newWindow ? '_blank' : undefined}>{text(portal.label)}</a>)}</div>
          </details>
        ) : null}
      </div>
    </header>
  )
}
