'use client'

import { useEffect, useState } from 'react'
import type { CSSProperties } from 'react'
import Image from 'next/image'
import { resolveExperienceLink } from '@/experience/navigation/resolver'
import Icon from '../atoms/Icon'
import Link from '../atoms/Link'
import DropdownMenu from '../molecules/DropdownMenu'
import LanguageSelector, { type LanguageOption } from '../molecules/LanguageSelector'
import PortalSelector, { type PortalOption } from '../molecules/PortalSelector'
import { asMediaAlt, asMediaDimension, asMediaOptimizerURL, asMediaURL, designTextColor, openContentModal, text } from '../shared'
import MobileNavigation from './MobileNavigation'
import SearchModal from './SearchModal'
import type { ExperienceComponentProps, NavigationItem } from '@/experience/registry/componentRegistry'

export type ResolvedNavItem = { active?: boolean; children?: ResolvedNavItem[]; href: string | null; id?: string | number | null; label: string; modalKey?: string }

const LANGUAGE_LABELS: Record<string, string> = { en: 'English', es: 'Español', pt: 'Português' }

/** PageRenderer injects localePaths from the current page's translationGroup. Header data may
 * still contain legacy home URLs, so the equivalent localized URL always wins when available. */
export const localizedLanguages = (value: unknown, localePaths: unknown, locale: string): LanguageOption[] => {
  const paths = localePaths && typeof localePaths === 'object' ? localePaths as Record<string, unknown> : {}
  const supplied = Array.isArray(value) ? value.filter((item): item is LanguageOption => Boolean(item && typeof item === 'object' && 'code' in item)) : []
  const byCode = new Map(supplied.map((item) => [String(item.code).toLowerCase(), item]))
  return ['en', 'es', 'pt'].flatMap((code) => {
    const equivalent = typeof paths[code] === 'string' ? paths[code] : ''
    const existing = byCode.get(code)
    // Do not invent a route for a locale without an equivalent published page.
    if (!equivalent) return []
    return [{
      active: code === locale.toLowerCase(),
      code,
      href: equivalent || existing?.href || '',
      label: existing?.label || LANGUAGE_LABELS[code],
    }]
  })
}

const resolveNavItem = (item: NavigationItem, locale: string, site: ExperienceComponentProps['site']): ResolvedNavItem => ({
  id: item.id,
  label: item.label ?? '',
  href: item.linkType === 'popup' ? null : resolveExperienceLink({ linkType: item.linkType, page: item.page as Parameters<typeof resolveExperienceLink>[0]['page'], url: item.url ?? undefined, locale, fallbackSite: site.slug, localizedRoutes: site.localizedRoutes }).href,
  modalKey: item.modalKey ?? undefined,
  children: item.children?.map((child) => resolveNavItem(child, locale, site)),
})

/** SiteHeader = Logo + MainNavigation (NavItem/DropdownMenu) + LanguageSelector + PortalSelector +
 * MobileNavigation, exactly per spec §3. Global-only (rendered as a real page-component instance
 * like every other organism, but excluded from the Page Builder's insertable catalog — see
 * `registry/catalog.ts`). */
export default function SiteHeader({ content, settings, locale, site }: ExperienceComponentProps) {
  const p = { ...settings, ...content }
  const [mobileOpen, setMobileOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [compactHeader, setCompactHeader] = useState(false)
  const [hideCompactHeader, setHideCompactHeader] = useState(false)
  const logoURL = asMediaURL(p.logo)
  const logoAlt = asMediaAlt(p.logo, site.name)
  const navigation = ((p.navigation ?? p.mainNavigation ?? []) as NavigationItem[]).map((item) => resolveNavItem(item, locale, site))
  // PPGA is a Spanish-only public app; showing a selector with no alternate destination is noise.
  const languages = site.slug === 'ppga' ? [] : localizedLanguages(p.languages, p.localePaths, locale)
  const portals = (p.portals ?? undefined) as PortalOption[] | undefined
  const portalButtonVariant = (['primary', 'secondary', 'outline'].includes(text(p.portalButtonVariant)) ? text(p.portalButtonVariant) : 'secondary') as 'primary' | 'secondary' | 'outline'
  const portalButtonIcon = text(p.portalButtonIcon) || 'user'
  const portalButtonHidden = p.portalButtonHidden === true
  const searchLabel = locale === 'es' ? 'Buscar' : locale === 'pt' ? 'Pesquisar' : 'Search'
  // These were hardcoded to Spanish regardless of `locale` — real bug, not just an EN/PT nicety:
  // a screen reader on the EN or PT site announced "Navegación principal"/"Abrir menú" either way.
  const navLabel = locale === 'es' ? 'Navegación principal' : locale === 'pt' ? 'Navegação principal' : 'Main navigation'
  const openMenuLabel = locale === 'es' ? 'Abrir menú' : locale === 'pt' ? 'Abrir menu' : 'Open menu'

  const template = text(p.template)
  useEffect(() => {
    if (template !== 'ellipse' || p.sticky === false || p.sticky === 'none') return
    let lastY = window.scrollY
    let revealTimer = 0
    const onScroll = () => {
      const currentY = Math.max(0, window.scrollY)
      if (currentY <= 96) {
        setCompactHeader(false)
        setHideCompactHeader(false)
      } else {
        setCompactHeader(true)
        if (currentY > lastY + 3) setHideCompactHeader(true)
        else if (currentY < lastY - 3) setHideCompactHeader(false)
        window.clearTimeout(revealTimer)
        revealTimer = window.setTimeout(() => setHideCompactHeader(false), 180)
      }
      lastY = currentY
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.clearTimeout(revealTimer)
    }
  }, [p.sticky, template])

  return (
    <>
      {/* Utility row — 23 sep, explicit UX request: a 3rd, slim row of its own (language + portal
         login only, right-aligned), separate from both the AlertBar above it and the pill nav
         below it. Not sticky on its own — scrolls away with the page, only the pill stays fixed
         (matches the reference layout: 3 distinct bars, not 3 things crammed into one). */}
      {(languages.length || portals?.length) ? (
        <div className="experience-utility-row">
          <div className="section-container experience-utility-row__inner">
            <LanguageSelector languages={languages} />
            <PortalSelector hidden={portalButtonHidden} icon={portalButtonIcon} locale={locale} portals={portals} triggerLabel={text(p.portalButtonText) || undefined} variant={portalButtonVariant} />
          </div>
        </div>
      ) : null}
      <header className={`experience-header experience-header--${text(p.theme) || 'light'}${template ? ` experience-header--template-${template}` : ''}${compactHeader ? ' experience-header--compact' : ''}${hideCompactHeader ? ' experience-header--scroll-hidden' : ''}${p.sticky === false || p.sticky === 'none' ? ' experience-header--not-sticky' : ''}`} style={{
        '--experience-header-height': typeof p.height === 'number' ? `${p.height}px` : undefined,
        '--experience-header-max-width': typeof p.maxWidth === 'number' ? `${p.maxWidth}px` : undefined,
        '--experience-header-radius': p.shape === 'pill' ? '999px' : p.shape === 'rounded' ? '20px' : undefined,
        background: template === 'ellipse' ? undefined : designTextColor(p.background),
        borderWidth: typeof p.borderWidth === 'number' ? p.borderWidth : undefined,
        borderColor: designTextColor(p.borderColor),
      } as CSSProperties}>
        <div className="section-container experience-header__inner">
          <Link className="experience-header__brand" href={site.localizedRoutes?.['slug:home']?.[locale] ?? `/${locale}`}>
            {logoURL ? <Image alt={logoAlt} className="experience-header__logo" height={asMediaDimension(p.logo, 'height') ?? 306} loading="eager" sizes="190px" src={asMediaOptimizerURL(logoURL)} width={asMediaDimension(p.logo, 'width') ?? 1200} /> : <span className="experience-header__logo-fallback">{site.name.slice(0, 1)}</span>}
            {!logoURL ? <span>{site.name}</span> : null}
          </Link>
          <nav aria-label={navLabel} className="experience-header__nav">
            <ul className="experience-nav">
              {navigation.map((item, index) =>
                item.children?.length ? (
                  <li className="experience-nav__item" key={item.id ?? `${item.label}-${index}`}>
                    <DropdownMenu items={item.children.map((child) => ({ href: child.href, id: child.id ?? undefined, label: child.label, onSelect: child.modalKey ? () => openContentModal(child.modalKey as string) : undefined }))} label={item.label} />
                  </li>
                ) : (
                  <li className="experience-nav__item" key={item.id ?? `${item.label}-${index}`}>
                    {item.href ? <Link href={item.href}>{item.label}</Link> : item.modalKey ? <button className="experience-nav__popup" onClick={() => openContentModal(item.modalKey as string)} type="button">{item.label}</button> : <span>{item.label}</span>}
                  </li>
                ),
              )}
            </ul>
          </nav>
          <div className="experience-header__actions">
            {compactHeader && (languages.length || portals?.length) ? <div className="experience-header__sticky-tools">
              <LanguageSelector languages={languages} />
              <PortalSelector hidden={portalButtonHidden} icon={portalButtonIcon} locale={locale} portals={portals} triggerLabel={text(p.portalButtonText) || undefined} variant={portalButtonVariant} />
            </div> : null}
            <button aria-label={searchLabel} className="experience-header__search" onClick={() => setSearchOpen(true)} type="button"><Icon name="search" /></button>
            <button aria-label={openMenuLabel} className="mobile-nav-trigger" onClick={() => setMobileOpen(true)} type="button"><Icon name="menu" /></button>
          </div>
        </div>
        <MobileNavigation items={navigation} languages={languages} locale={locale} logoAlt={logoAlt} logoURL={logoURL} onClose={() => setMobileOpen(false)} open={mobileOpen} portalButtonText={text(p.portalButtonText) || undefined} portalButtonVariant={portalButtonVariant} portalButtonIcon={portalButtonIcon} portalButtonHidden={portalButtonHidden} portals={portals} siteName={site.name} />
        <SearchModal locale={locale} localizedRoutes={site.localizedRoutes} onClose={() => setSearchOpen(false)} open={searchOpen} siteSlug={site.slug} />
      </header>
    </>
  )
}
