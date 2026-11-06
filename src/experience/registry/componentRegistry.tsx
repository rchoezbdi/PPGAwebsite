import React from 'react'
import dynamic from 'next/dynamic'
import ClientExperienceComponent from '@/experience/renderer/ClientExperienceComponent'
import type { LocalizedRoutes } from '@/experience/navigation/localizedRoutes'
import BackToTopRuntime from '@/experience/runtime/BackToTopRuntime'
import AlertBar from '@/experience/components/organisms/AlertBar'
import AudienceSelectorSection from '@/experience/components/organisms/AudienceSelectorSection'
import FloatingChat from '@/experience/components/organisms/FloatingChat'
import GlobalCareStatement from '@/experience/components/organisms/GlobalCareStatement'
import PlanAudienceCards from '@/experience/components/organisms/PlanAudienceCards'
import Button, { type ButtonSize, type ButtonVariant } from '@/experience/components/atoms/Button'
import ProvidersCarousel from '@/experience/components/organisms/ProvidersCarousel'
import QuickActionsSection from '@/experience/components/organisms/QuickActionsSection'
import ServiceActionGrid from '@/experience/components/organisms/ServiceActionGrid'
import InsuranceBenefitsGrid from '@/experience/components/organisms/InsuranceBenefitsGrid'
import SectionCTA from '@/experience/components/organisms/SectionCTA'
import SiteFooter from '@/experience/components/organisms/SiteFooter'
import TrustMetricsSection from '@/experience/components/organisms/TrustMetricsSection'
import TrustStoryCollage from '@/experience/components/organisms/TrustStoryCollage'
import CompanyImpactMetrics from '@/experience/components/organisms/CompanyImpactMetrics'
import ExperienceCardSection from '@/experience/components/organisms/ExperienceCardSection'
import FirstAidScheduledAppointments from '@/experience/components/organisms/FirstAidScheduledAppointments'
import RelatedPlansCarousel from '@/experience/components/organisms/RelatedPlansCarousel'
import { asMediaAlt, asMediaURL, designTextColor, resolveCTA, type CTAContent } from '@/experience/components/shared'
import { cornerRadiusCSS } from '@/lib/cornerRadius'
import { AlignWrap, BadgeAtom, DividerAtom, EmbedAtom, HeadingAtom, ImageAtom, LinkAtom, MediaAtom, RichTextAtom, SpacerAtom, VideoAtom } from '@/experience/components/atoms/BlogVisualAtoms'

const FeaturesSection = dynamic(() => import('@/experience/components/organisms/FeaturesSection'))

const richContentInlineFlags = [
  ['🇺🇸', 'us'],
  ['🇪🇨', 'ec'],
  ['🇻🇪', 've'],
  ['🇪🇸', 'es'],
  ['🇨🇱', 'cl'],
  ['🇲🇽', 'mx'],
  ['🇵🇪', 'pe'],
  ['🇧🇷', 'br'],
  ['🇹🇹', 'tt'],
] as const

function renderRichContentLine(line: string, key: string) {
  const flag = richContentInlineFlags.find(([emoji]) => line.startsWith(emoji))
  if (!flag) return <React.Fragment key={key}>{line}</React.Fragment>
  const [emoji, countryCode] = flag
  return (
    <React.Fragment key={key}>
      <img
        alt=""
        aria-hidden="true"
        className="rich-content__inline-flag"
        height={16}
        src={`/flags/4x3/${countryCode}.svg`}
        width={24}
      />
      {line.slice(emoji.length).trimStart()}
    </React.Fragment>
  )
}

/**
 * Maps a backend `Component.code` (e.g. "hero", "card-grid") to the React component that
 * renders it. This is the single place new component codes get wired up — PageRenderer never
 * branches on a type string itself, it only looks codes up here.
 *
 * Real organisms (Hero, the *Section components, SiteHeader/SiteFooter, AlertBar,
 * FloatingChat) live under `src/experience/components/{atoms,molecules,organisms}` and are built
 * by composing the shared atom/molecule library — see that directory for the Atomic Design layer.
 * The handful of components still defined inline below (Grid/Rich/FAQ) are outside the current
 * Home rebuild's scope and unchanged from before. Form lives in its own file (organisms/Form.tsx)
 * because it needs real client-side submit handling — see dispatchFormSubmission.ts for where a
 * submission goes after it's saved.
 */

export type ExperienceSite = {
  name: string
  slug: string
  supportedLocales: string[]
  localizedRoutes?: LocalizedRoutes
}

export type ExperienceComponentProps = {
  /** Editorial data for this instance (headings, cards, CTAs, ...). */
  content: Record<string, unknown>
  /** Presentation/config for this instance (variant, background, columns, ...). */
  settings: Record<string, unknown>
  locale: string
  site: ExperienceSite
  /** This `page-components` row's own id — needed by components that write back to their own
   * instance (e.g. Form submissions posting to /api/dxp/forms/submit). */
  instanceId?: string | number
}

export type NavigationItem = {
  id?: string | number | null
  label?: string
  linkType?: 'internal' | 'external' | 'none' | 'popup'
  page?: unknown
  url?: string | null
  modalKey?: string | null
  newWindow?: boolean | null
  children?: NavigationItem[] | null
}

const text = (value: unknown): string => (typeof value === 'string' ? value : '')

/** Merges settings under content so editorial data (content) always wins on overlapping keys. */
const mergeProps = (content: Record<string, unknown>, settings: Record<string, unknown>) => ({ ...settings, ...content })

function GridComponent({ content, locale, settings, site }: ExperienceComponentProps) {
  const p = mergeProps(content, settings)
  if (text(p.variant) === 'providers-carousel') return <ProvidersCarousel content={p} locale={locale} />
  if (text(p.variant) === 'related-plans-carousel') return <RelatedPlansCarousel content={p} locale={locale} />
  const background = text(p.background)
  const className = `section${background && background !== 'white' ? ` section--${background}` : ''}`
  const items = (p.cards ?? p.features ?? p.actions ?? p.items ?? []) as Array<Record<string, unknown>>
  const columnsCount = text(p.columns) || (items.length === 4 ? '4' : '')
  const headingLower = text(p.heading).toLowerCase()
  const headingHighlight = text(p.headingHighlight)
  const heading = text(p.heading)
  const headingPrefix = headingHighlight && heading.endsWith(headingHighlight) ? heading.slice(0, -headingHighlight.length).trimEnd() : heading
  const isProviders = headingLower.includes('provider') || headingLower.includes('proveedor') || headingLower.includes('provedor')
  const showBadge = p.showBadge !== false && p.variant !== 'providers' && p.variant !== 'logos' && !isProviders
  const grid = (
    <div className="grid">
      {items.map((item, i) => (
        <article className="card" data-editor-field="cards" data-editor-index={i} key={text(item.id) || i}>
          {(asMediaURL(item.image) || asMediaURL(item.media) || text(item.imageUrl)) ? <img className="card__media" src={asMediaURL(item.image) || asMediaURL(item.media) || text(item.imageUrl)} alt={text(item.imageAlt) || text(item.alt) || asMediaAlt(item.image) || asMediaAlt(item.media) || text(item.heading ?? item.label ?? item.title)} /> : null}
          {showBadge ? <div className="card-badge">0{i + 1}</div> : null}
          {(() => {
            const cardTitle = text(item.heading ?? item.label ?? item.title)
            const titleKey = cardTitle.toLowerCase()
            const cardIcon = text(item.icon) || (/message|mensaje|mensagem/.test(titleKey) ? 'mail' : /talk|contact|cont[aá]ct|fale/.test(titleKey) ? 'phone' : /feedback|coment/.test(titleKey) ? 'message-square' : '')
            return <div className="card__heading">{cardIcon ? <span aria-hidden="true" className="card__title-icon"><ClientExperienceComponent code="icon" content={{ name: cardIcon, size: 28 }} locale={locale} settings={{}} site={site} /></span> : null}<h3>{cardTitle}</h3></div>
          })()}
          {(item.description ?? item.subtitle) ? <p>{text(item.description ?? item.subtitle)}</p> : null}
          {text(item.meta) ? <p className="card-meta">{text(item.meta)}</p> : null}
          {text(item.modalKey) ? (
            <ClientExperienceComponent code="modal-trigger" content={{ className: 'card__link', icon: item.showIcon === false || text(item.buttonIcon) === 'none' ? undefined : text(item.buttonIcon) || 'arrow-right', label: text(item.linkLabel) || 'Learn more', modalKey: text(item.modalKey), variant: text(item.buttonVariant) || 'primary' }} locale={locale} settings={{}} site={site} />
          ) : text(item.url) ? (
            (() => {
              const href = text(item.url)
              const ppgaDocumentDownload = site.slug === 'ppga' && href.startsWith('/api/dxp/documents/download?')
              return (
                <a
                  className={`card__link${ppgaDocumentDownload ? ' card__link--ppga-document' : ''}`}
                  href={href}
                  rel={ppgaDocumentDownload ? 'noopener noreferrer' : undefined}
                  target={ppgaDocumentDownload ? '_blank' : undefined}
                >
                  {text(item.linkLabel) || 'Learn more'}
                  {item.showIcon !== false && text(item.buttonIcon) !== 'none' ? <ClientExperienceComponent code="icon" content={{ name: text(item.buttonIcon) || 'arrow-right', size: 16 }} locale={locale} settings={{}} site={site} /> : null}
                  {ppgaDocumentDownload ? <span aria-hidden="true" className="card__link-arrow">→</span> : null}
                </a>
              )
            })()
          ) : null}
        </article>
      ))}
    </div>
  )
  return (
    <section className={`${className} grid-section grid-section--${text(p.variant) || 'default'}${columnsCount ? ` grid-section--cols-${columnsCount}` : ''}${isProviders ? ' grid-section--providers' : ''}`} data-columns={columnsCount || undefined}>
      <div className="section-container">
        {text(p.eyebrow) && <div className="eyebrow"><span />{text(p.eyebrow)}</div>}
        {heading && <h2 style={designTextColor(p.headingColor) ? { color: designTextColor(p.headingColor) } : undefined}>{headingHighlight && headingPrefix !== heading ? <>{headingPrefix} <mark style={designTextColor(p.headingHighlightColor) ? { color: designTextColor(p.headingHighlightColor) } : undefined}>{headingHighlight}</mark></> : heading}</h2>}
        {text(p.description) && <p className="section-subtitle" style={designTextColor(p.descriptionColor) ? { color: designTextColor(p.descriptionColor) } : undefined}>{text(p.description)}</p>}
        {p.collapsible ? (
          // Native <details>/<summary> disclosure — no client component needed, same
          // no-JS-required pattern the FAQ accordion already uses. Matches production's real
          // "View/Hide Standard Products" toggle on Our Plans (a plain show/hide, nothing else).
          <details className="grid-section__disclosure">
            {/* The visible label text swaps via CSS `content: attr()` (data-closed/data-open), so
                it never reaches the accessibility tree on its own — <details>/<summary> already
                announces expanded/collapsed state natively, but still needs a real accessible
                name for what's being toggled, hence the explicit aria-label here. */}
            <summary aria-label={text(p.collapsedLabel) || 'View more'} className="grid-section__disclosure-summary">
              <span aria-hidden="true" className="grid-section__disclosure-label" data-closed={text(p.collapsedLabel) || 'View more'} data-open={text(p.expandedLabel) || 'Hide'} />
              <ClientExperienceComponent code="icon" content={{ name: 'chevron-down', size: 16 }} locale={locale} settings={{}} site={site} />
            </summary>
            {grid}
          </details>
        ) : grid}
      </div>
    </section>
  )
}

function ButtonAtom({ content, settings }: ExperienceComponentProps) {
  const props = mergeProps(content, settings)
  const variant = text(props.variant)
  const size = text(props.size)
  return <Button
    ariaLabel={text(props.accessibleLabel) || undefined}
    className={text(props.className) || undefined}
    disabled={props.disabled === true}
    href={text(props.href) || undefined}
    icon={text(props.icon) || undefined}
    iconOnly={props.iconOnly === true}
    iconPosition={props.iconPosition === 'left' ? 'left' : 'right'}
    label={text(props.text ?? props.label)}
    loading={props.loading === true}
    size={(['small', 'medium', 'large', 'sm', 'md', 'lg'].includes(size) ? size : 'medium') as ButtonSize}
    variant={(['primary', 'secondary', 'outline', 'ghost', 'danger', 'white', 'tertiary', 'light', 'dark', 'bright'].includes(variant) ? variant : 'primary') as ButtonVariant}
    width={props.fullWidth === true ? 'full' : 'auto'}
  />
}

function TextAtom({ content, settings }: ExperienceComponentProps) {
  const props = mergeProps(content, settings)
  const tag = ['p', 'span', 'div'].includes(text(props.semanticTag)) ? text(props.semanticTag) : 'p'
  const color = designTextColor(props.colorToken)
  const style: React.CSSProperties = {
    ...(color ? { color } : {}),
    ...(text(props.align) ? { textAlign: text(props.align) as React.CSSProperties['textAlign'] } : {}),
    ...(Number(props.maxLines) > 0 ? { display: '-webkit-box', WebkitBoxOrient: 'vertical', WebkitLineClamp: Number(props.maxLines), overflow: 'hidden' } : {}),
  }
  return React.createElement(tag, { className: 'experience-text-atom', style }, text(props.text))
}

type RichEmbed = { provider: 'youtube' | 'paycom'; src: string; title: string; videoId?: string; posterUrl?: string }

function resolveRichEmbed(value: unknown): RichEmbed | undefined {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return undefined
  const embed = value as Record<string, unknown>
  const provider = text(embed.provider)
  const title = text(embed.title)
  try {
    const url = new URL(text(embed.url))
    if (provider === 'youtube' && ['youtube.com', 'www.youtube.com', 'youtube-nocookie.com', 'www.youtube-nocookie.com'].includes(url.hostname)) {
      const videoId = /^\/embed\/([\w-]{11})\/?$/.exec(url.pathname)?.[1]
      if (videoId) return { provider, src: url.toString(), title: title || 'YouTube video', videoId, posterUrl: text(embed.posterUrl) }
    }
    if (provider === 'paycom' && url.hostname === 'www.paycomonline.net' && /^\/v4\/ats\/web\.php\/portal\/[A-Z0-9]+\/career-page\/?$/.test(url.pathname)) {
      return { provider, src: url.toString(), title: title || 'Career opportunities' }
    }
  } catch {
    return undefined
  }
  return undefined
}

function RichEmbedLayout({ embed, children, locale, site }: { readonly embed: RichEmbed; readonly children: React.ReactNode; locale: string; site: ExperienceSite }) {
  return (
    <div className={`rich-content__embed-layout rich-content__embed-layout--${embed.provider}`}>
      {children}
      {embed.provider === 'youtube' && embed.videoId ? (
        <ClientExperienceComponent code="youtube-video" content={{ posterUrl: embed.posterUrl || '', title: embed.title, videoId: embed.videoId }} locale={locale} settings={{}} site={site} />
      ) : (
        <iframe className="rich-content__external-embed" loading="lazy" referrerPolicy="strict-origin-when-cross-origin" src={embed.src} title={embed.title} />
      )}
    </div>
  )
}

function RichComponent({ content, locale, settings, site }: ExperienceComponentProps) {
  const p = mergeProps(content, settings)
  if (text(p.variant) === 'experience-card') return <ExperienceCardSection content={p} locale={locale} settings={{}} site={site} />
  if (text(p.variant) === 'first-aid-guide-tabs') return <ClientExperienceComponent code="first-aid-guide-tabs" content={{ tabs: Array.isArray(p.tabs) ? p.tabs : [] }} locale={locale} settings={{}} site={site} />
  if (text(p.variant) === 'first-aid-scheduled-appointments') return (
    <section className="section rich-section rich-section--first-aid-scheduled-appointments">
      <div className="section-container">
        <ClientExperienceComponent code="first-aid-scheduled-appointments" content={{ tabs: Array.isArray(p.tabs) ? p.tabs : [] }} locale={locale} settings={{}} site={site} />
      </div>
    </section>
  )
  if (text(p.variant) === 'first-aid-guide-heading') {
    const parent = locale === 'pt' ? 'Kit de primeiros socorros' : locale === 'es' ? 'Kit de primeros auxilios' : 'First Aid Kit'
    const parentHref = site.slug === 'ppga' ? (process.env.NODE_ENV === 'production' ? '/first-aid-kit' : '/ppga/first-aid-kit?locale=es') : `/${locale}/first-aid-kit`
    const highlight = text(p.headingHighlight)
    const prefix = highlight && text(p.heading).endsWith(highlight) ? text(p.heading).slice(0, -highlight.length).trimEnd() : text(p.heading)
    return (
      <section className="section rich-section rich-section--first-aid-guide-heading">
        <div className="section-container">
          <nav aria-label={locale === 'es' ? 'Ruta de navegación' : locale === 'pt' ? 'Navegação' : 'Breadcrumb'} className="first-aid-guide-heading__breadcrumb">
            <a href={parentHref}>{parent}</a><span aria-hidden="true">/</span><span aria-current="page">{text(p.heading)}</span>
          </nav>
          <h2>{highlight && prefix !== text(p.heading) ? <>{prefix}<mark>{highlight}</mark></> : text(p.heading)}</h2>
        </div>
      </section>
    )
  }
  const embed = resolveRichEmbed(p.embed)
  const background = text(p.background)
  const className = `section${background && background !== 'white' ? ` section--${background}` : ''}`
  const storedCTA = (p.cta && typeof p.cta === 'object') ? p.cta as CTAContent : undefined
  const legacyLabel = text(p.linkLabel)
  const legacyURL = text(p.url)
  const cta = resolveCTA(storedCTA
    ? { ...storedCTA, ...(legacyLabel ? { label: legacyLabel } : {}), ...(legacyURL ? { url: legacyURL } : {}) }
    : legacyLabel && legacyURL ? { label: legacyLabel, url: legacyURL, variant: 'secondary' } : undefined, locale, site)
  const requestedVariant = text(cta?.variant)
  const ctaVariant: ButtonVariant = ['primary', 'secondary', 'outline', 'white'].includes(requestedVariant)
    ? requestedVariant as ButtonVariant : 'secondary'
  const isCareersIntro = text(p.eyebrow).trim().toLowerCase() === 'our story'
    && /^(people are at the core|en best doctors insurance,|as pessoas são a essência)/i.test(text(p.heading).trim())
  const isCareersGptw = /^(a workplace built on trust and respect|un entorno laboral donde priman la confianza y el respeto|um ambiente de trabalho baseado em confiança e respeito)$/i.test(text(p.heading).trim())
  const isCareersSupport = /^(supporting you beyond the workplace|apoyo que transciende el entorno laboral|apoio que transcende o ambiente de trabalho)$/i.test(text(p.heading).trim())
  const embedContent = p.embed && typeof p.embed === 'object' ? p.embed as Record<string, unknown> : undefined
  const careersPeopleCopy = {
    en: { title: ['Our People', 'make the difference'], eyebrow: 'OUR STORY' },
    es: { title: ['Nuestro equipo', 'marca la diferencia'], eyebrow: 'NUESTRA HISTORIA' },
    pt: { title: ['Nossa equipe', 'faz a diferença'], eyebrow: 'NOSSA HISTÓRIA' },
  } as const
  const careersPeopleLocale = careersPeopleCopy[locale as keyof typeof careersPeopleCopy] ?? careersPeopleCopy.en
  const isCareersPeopleStory = /^(our people make the difference|nuestro equipo marca la diferencia|nossa equipe faz a diferença)$/i.test(text(p.heading).trim()) && text(embedContent?.provider) === 'youtube'
  const isCareersOpenRoles = text(p.heading).trim().toLowerCase() === 'explore open roles' && text(embedContent?.provider) === 'paycom'
  const heading = text(p.heading)
  const isWhyBestDoctorsCareResults = text(p.variant) === 'why-bdi-care-results'
    || /^(?:cuidado de salud|cuidados de saúde)\s/i.test(heading)
  const isWhyBestDoctorsResultsClose = text(p.variant) === 'why-bdi-results-close'
  const isFinancialPerformance = text(p.variant) === 'financial-performance'
  const isFinancialSimplifying = text(p.variant) === 'financial-simplifying'
  const isFinancialProPortfolio = text(p.variant) === 'financial-pro-portfolio'
  const isFinancialDifference = text(p.variant) === 'financial-difference'
  const isFinancialPrioritiesIntro = text(p.variant) === 'financial-priorities-intro'
  const isFinancialAccessMatters = ['Access matters', 'El acceso es fundamental', 'O acesso é fundamental'].includes(heading.trim())
  const providerImages = Array.isArray(p.providerImages)
    ? (p.providerImages as Array<Record<string, unknown>>).filter((image) => text(image.src)).slice(0, 3)
    : []
  const isFinancialCopy = isFinancialPerformance || isFinancialProPortfolio
  const financialDifferenceStatement = locale === 'es'
    ? { before: 'Son ', highlight: 'las personas.' }
    : locale === 'pt'
      ? { before: 'S?o ', highlight: 'as pessoas.' }
      : { before: 'It is ', highlight: 'our people.' }
  const isFirstAidNotificationBanner = text(p.variant) === 'first-aid-notification-banner'
  const localizedWhyHeadingPrefix = /^(?:cuidado de salud|cuidados de saúde)\s/i.exec(heading)?.[0] ?? ''
  const headingHighlight = text(p.headingHighlight) || (localizedWhyHeadingPrefix ? heading.slice(localizedWhyHeadingPrefix.length) : '') || (isFinancialAccessMatters ? heading.split(/\s+/).slice(-1)[0] ?? '' : '') || (heading === 'Financial stability you can rely on' ? 'you can rely on' : '')
  const hasHeadingHighlight = Boolean(headingHighlight && heading.endsWith(headingHighlight))
  const headingPrefix = hasHeadingHighlight ? heading.slice(0, -headingHighlight.length) : heading
  const notificationCopy = (text(p.description) || text(p.content)).split(/\n{2,}/).map((part) => part.trim()).filter(Boolean)
  const notificationSteps = notificationCopy.slice(2).map((step) => /^\d+[.)]\s*(.+)$/.exec(step)?.[1] ?? '')
  const isFirstAidNotificationProcess = locale === 'en'
    && heading === 'It is the process by which the insured'
    && headingHighlight === 'by which the insured'
    && notificationCopy.length === 5
    && notificationSteps.length === 3
    && notificationSteps.every(Boolean)
  if (isFirstAidNotificationProcess) {
    return (
      <section className={`${className} rich-section rich-section--first-aid-notification-process`}>
        <div className="section-container">
          <div className="rich-content-box">
            <h2>{headingPrefix}<mark>{headingHighlight}</mark></h2>
            <h3>{notificationCopy[0]}</h3>
            <p>{notificationCopy[1]}</p>
            <ol aria-label="Reasons to notify" className="first-aid-notification-process__steps">
              {notificationSteps.map((step, index) => <li key={index}>{step}</li>)}
            </ol>
          </div>
        </div>
      </section>
    )
  }
  if (text(p.variant) === 'distributor-offer') {
    const gallery = Array.isArray(p.gallery) ? p.gallery as Array<Record<string, unknown>> : []
    const offerings = Array.isArray(p.offerings) ? p.offerings as Array<Record<string, unknown>> : []
    return (
      <section className={`${className} rich-section rich-section--distributor-offer`}>
        <div className="section-container distributor-offer">
          <div aria-hidden="true" className="distributor-offer__visual">
            {gallery.slice(0, 3).map((item, index) => {
              const src = asMediaURL(item.image) || text(item.imageUrl)
              return src ? <ClientExperienceComponent code="media" content={{ alt: text(item.alt), className: `distributor-offer__image distributor-offer__image--${index + 1}`, objectFit: 'cover', src }} key={index} locale={locale} settings={{}} site={site} /> : null
            })}
          </div>
          <div className="distributor-offer__content">
            <h2>{headingPrefix}{headingPrefix.endsWith(' ') ? '' : ' '}<mark>{headingHighlight}</mark></h2>
            {text(p.subheading) ? <h3>{text(p.subheading)}</h3> : null}
            {offerings.length ? <ul>{offerings.map((item, index) => <li key={index}>{text(item.text)}</li>)}</ul> : null}
            {text(p.description) ? <p>{text(p.description)}</p> : null}
          </div>
        </div>
      </section>
    )
  }
  const careersHeadings = {
    en: ['People are at the core', 'of Best Doctors Insurance'],
    es: ['En Best Doctors Insurance,', 'las personas están en el centro de todo lo que hacemos'],
    pt: ['As pessoas são a essência', 'da Best Doctors Insurance'],
  } as const
  const careersHeading = careersHeadings[locale as keyof typeof careersHeadings] ?? careersHeadings.en
  const body = (
    <div className="rich-content-box">
      {(!isCareersIntro && text(p.eyebrow)) || isCareersPeopleStory ? <div className="eyebrow"><span />{text(p.eyebrow) || (isCareersPeopleStory ? careersPeopleLocale.eyebrow : '')}</div> : null}
      {heading ? <h2 className={isFinancialPrioritiesIntro ? 'financial-priorities__title' : undefined} style={designTextColor(p.headingColor) ? { color: designTextColor(p.headingColor) } : undefined}>{isFinancialPrioritiesIntro ? (() => { const words = heading.split(/\s+/); return <>{words.slice(0, -2).join(' ')} <strong>{words.slice(-2).join(' ')}</strong></> })() : isCareersIntro ? <><span>{careersHeading[0]}</span><br /><mark>{careersHeading[1]}</mark></> : isCareersPeopleStory ? <>{careersPeopleLocale.title[0]} <mark>{careersPeopleLocale.title[1]}</mark></> : isCareersOpenRoles ? <>Explore <mark>open roles</mark></> : isFinancialSimplifying || isFinancialProPortfolio ? (() => { const words = heading.split(/\s+/); const highlightCount = isFinancialProPortfolio ? 3 : 2; return <>{words.slice(0, -highlightCount).join(' ')}{isFinancialProPortfolio ? <><br /><strong>{words.slice(-highlightCount).join(' ')}</strong></> : <> <mark>{words.slice(-highlightCount).join(' ')}</mark></>}</> })() : isFinancialPerformance ? <>{heading.slice(0, heading.lastIndexOf(' ') + 1)}<mark>{heading.slice(heading.lastIndexOf(' ') + 1)}</mark></> : isWhyBestDoctorsCareResults && hasHeadingHighlight ? <><span>{headingPrefix.trim()}</span><br /><mark style={designTextColor(p.headingHighlightColor) ? { color: designTextColor(p.headingHighlightColor) } : undefined}>{headingHighlight}</mark></> : hasHeadingHighlight ? <>{headingPrefix}<mark style={designTextColor(p.headingHighlightColor) ? { color: designTextColor(p.headingHighlightColor) } : undefined}>{headingHighlight}</mark></> : heading}</h2> : null}
      {(() => {
        const copy = text(p.description) || text(p.content)
        if (!copy) return isFirstAidNotificationBanner ? null : <p>Contenido administrado desde Payload CMS.</p>
        return copy.split(/\n{2,}/).flatMap((paragraph, index) => {
          const paragraphClass = isFinancialDifference ? `financial-difference__paragraph financial-difference__paragraph--${index + 1}` : isFinancialPrioritiesIntro ? 'financial-priorities__subtitle' : isFinancialPerformance ? `financial-performance__paragraph financial-performance__paragraph--${index + 1}` : isFinancialProPortfolio ? `financial-pro-portfolio__paragraph${index === 0 ? ' financial-pro-portfolio__subheading' : ''}` : isWhyBestDoctorsResultsClose && index === 0 ? 'why-bdi-results-tagline' : undefined
          const paragraphNode = <p className={paragraphClass} key={`paragraph-${index}`}>{isFinancialCopy ? paragraph.split(/(The Best Doctors Insurance Group|Best Doctors Insurance Group|Grupo Best Doctors Insurance|90% adoption of digital claims reimbursement,?|300,000 sessions|40% of submissions,?|una utilización del reembolso en línea del 90%|más de 300\.000 sesiones registradas|el 40% de las solicitudes recibidas|90% dos reembolsos são realizados por meio digital|mais de 300\.000 sessões foram registradas|40% das submissões|\bUS\$\s?[\d,.]+(?:\s?million)?|\b\d+(?:[.,]\d+)?%|\b\d{1,3}(?:,\d{3})+\b)/gi).map((part, partIndex) => {
            const isFinancialPortfolioEmphasis = isFinancialProPortfolio && /^(?:90% adoption of digital claims reimbursement,?|300,000 sessions|40% of submissions,?|una utilización del reembolso en línea del 90%|más de 300\.000 sesiones registradas|el 40% de las solicitudes recibidas|90% dos reembolsos são realizados por meio digital|mais de 300\.000 sessões foram registradas|40% das submissões)$/i.test(part)
            const isAmount = /^(?:US\$\s?[\d,.]+(?:\s?million)?|\d+(?:[.,]\d+)?%|\d{1,3}(?:,\d{3})+)$/i.test(part)
            const isCompany = /^(?:The )?Best Doctors Insurance Group$|^Grupo Best Doctors Insurance$/i.test(part)
            return isFinancialPortfolioEmphasis ? <strong className="financial-pro-portfolio__emphasis" key={partIndex}>{part}</strong> : isAmount ? <strong className="financial-performance__amount" key={partIndex}>{part}</strong> : isCompany ? <strong className="financial-performance__brand" key={partIndex}>{part}</strong> : <React.Fragment key={partIndex}>{part}</React.Fragment>
          }) : isWhyBestDoctorsResultsClose && index === 0 ? paragraph.split('•').map((item) => <span key={item.trim()}>{item.trim()}</span>) : isCareersPeopleStory && paragraph.includes('Best Doctors Insurance')
            ? <>{paragraph.split('Best Doctors Insurance')[0]}<br />Best Doctors Insurance{paragraph.split('Best Doctors Insurance').slice(1).join('Best Doctors Insurance')}</>
            : paragraph.split('\n').flatMap((line, lineIndex) => (lineIndex === 0
              ? [renderRichContentLine(line, `line-${lineIndex}`)]
              : [<br key={`line-break-${lineIndex}`} />, renderRichContentLine(line, `line-${lineIndex}`)]))}</p>
          return isFinancialDifference && index === 0
            ? [paragraphNode, <h2 className="financial-difference__statement" key="difference-statement">{financialDifferenceStatement.before}<mark>{financialDifferenceStatement.highlight}</mark></h2>]
            : [paragraphNode]
        })
      })()}
      {cta?.href ? (
        <div className="rich-content__actions">
          <Button href={cta.href} icon={cta.showIcon ? cta.icon || 'chevron-right' : undefined} iconPosition={cta.iconPosition ?? 'right'} label={cta.label} target={cta.target} variant={ctaVariant} />
        </div>
      ) : null}
    </div>
  )
  const embeddedBody = embed ? <RichEmbedLayout embed={embed} locale={locale} site={site}>{body}</RichEmbedLayout> : body
  // `displayMode:'modal'` keeps this instance out of the normal page flow and instead opens it
  // through ContentModal whenever a ModalTrigger elsewhere on the page dispatches
  // CONTENT_MODAL_EVENT with a matching `content.modalKey` — same opt-in Form.tsx uses, for the
  // cases (e.g. Support's "Talk to us" phone list) where production shows this as a popup, not an
  // always-visible section.
  const modalKey = text(p.modalKey)
  if (text(p.displayMode) === 'modal' && modalKey) {
    return <ClientExperienceComponent code="content-modal" content={{ modalKey }} locale={locale} settings={{}} site={site}>{body}</ClientExperienceComponent>
  }
  if (isFinancialAccessMatters && providerImages.length) {
    return (
      <section className={`${className} rich-section rich-section--financial-access-matters`}>
        <div className="section-container financial-access-matters__layout">
          <div className="financial-access-matters__copy">{body}</div>
          <ul aria-label={locale === 'es' ? 'Instituciones médicas' : locale === 'pt' ? 'Instituições médicas' : 'Medical institutions'} className="financial-access-matters__gallery">
            {providerImages.map((image) => (
              <li key={String(image.src)}>
                <img alt={text(image.alt)} decoding="async" height="215" loading="lazy" src={text(image.src)} width="550" />
              </li>
            ))}
          </ul>
        </div>
      </section>
    )
  }
  return (
    <section className={[className, 'rich-section', `rich-section--${text(p.variant) || 'default'}`, hasHeadingHighlight ? 'rich-section--heading-highlight' : '', isCareersIntro ? 'rich-section--careers-intro' : '', isCareersGptw ? 'rich-section--careers-gptw' : '', isCareersSupport ? 'rich-section--careers-support' : '', isCareersPeopleStory ? 'rich-section--careers-people-story' : '', isCareersOpenRoles ? 'rich-section--careers-open-roles' : '', embed ? `rich-section--embed-${embed.provider}` : ''].filter(Boolean).join(' ')}>
      <div className="section-container" data-rich-content>
        {isCareersSupport ? (
          <div className="careers-support__visual">
            {text(p.imageUrl) ? <img className="careers-support__image" src={text(p.imageUrl)} alt={text(p.imageAlt)} /> : null}
            <div className="careers-support__card">{body}</div>
          </div>
        ) : (asMediaURL(p.image) || asMediaURL(p.media) || text(p.imageUrl) || text(p.mediaUrl)) ? (isCareersGptw ? (
          <div className="careers-gptw-mark">
            <img className="careers-gptw-mark__badge" src={text(p.imageUrl)} alt={text(p.imageAlt)} />
            <div aria-hidden="true" className="careers-gptw-mark__wordmark"><span>Great</span><strong>Place to<br />work</strong></div>
          </div>
        ) : <img className="rich-content__media" src={asMediaURL(p.image) || asMediaURL(p.media) || text(p.imageUrl) || text(p.mediaUrl)} alt={text(p.imageAlt) || text(p.mediaAlt) || asMediaAlt(p.image) || asMediaAlt(p.media)} />) : null}
        {isCareersSupport ? null : embeddedBody}
      </div>
    </section>
  )
}

function BackToTopWidgetComponent({ content, settings }: ExperienceComponentProps) {
  return <BackToTopRuntime content={content} settings={settings} />
}

function ContainerComponent({ content, locale, settings, site }: ExperienceComponentProps) {
  const p = mergeProps(content, settings)
  const columns = Array.isArray(p.columns) && p.columns.length
    ? p.columns as Array<Record<string, unknown>>
    : [{ id: 'column-1', width: 100, children: [] }]
  return (
    <section className="section page-container-runtime" style={cornerRadiusCSS(p.borderRadius) ? { borderRadius: cornerRadiusCSS(p.borderRadius), overflow: 'hidden' } : undefined}>
      <div className="section-container page-container-runtime__columns" style={{ display: 'flex', gap: Number(p.gap ?? 16) }}>
        {columns.map((column, columnIndex) => {
          const children = Array.isArray(column.children) ? column.children as Array<Record<string, unknown>> : []
          return (
            <div className="page-container-runtime__column" key={String(column.id ?? columnIndex)} style={{ minWidth: 0, flex: `${Math.max(Number(column.width ?? 100), 1)} 1 0%` }}>
              {children.map((child, childIndex) => {
                const props = child.props && typeof child.props === 'object' ? child.props as Record<string, unknown> : {}
                if ((props.visibility as { hidden?: boolean } | undefined)?.hidden === true) return null
                const code = text(child.componentCode) || text(props.componentCode) || text(child.type).replace(/^DXP_/, '')
                const Child = resolveComponent(code)
                return <Child content={props} key={String(props.id ?? childIndex)} locale={locale} settings={{}} site={site} />
              })}
            </div>
          )
        })}
      </div>
    </section>
  )
}

function FallbackComponent() {
  return (
    <section className="section fallback-section" role="status">
      <div className="section-container">
        <p>Este componente no es compatible con la versión actual.</p>
      </div>
    </section>
  )
}

/** Normalizes a backend `code` (or a legacy PascalCase `type`) to a lookup key: lowercase,
 * non-alphanumerics collapsed to single hyphens. "CardGrid", "card-grid" and "card_grid" all
 * resolve to the same entry. */
export const normalizeComponentCode = (code: string): string =>
  code
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

const registryEntries: Record<string, React.ComponentType<ExperienceComponentProps>> = {
  image: ImageAtom,
  video: VideoAtom,
  media: MediaAtom,
  heading: HeadingAtom,
  divider: DividerAtom,
  spacer: SpacerAtom,
  embed: EmbedAtom,
  link: LinkAtom,
  badge: BadgeAtom,
  'rich-text': RichTextAtom,
  text: TextAtom,
  button: (props) => <AlignWrap align={props.content.align}><ButtonAtom {...props} /></AlignWrap>,
  'section-layout': RichComponent,
  container: ContainerComponent,
  'media-carousel': GridComponent,
  'rich-content': RichComponent,
  'media-content': RichComponent,
  'quick-actions': QuickActionsSection,
  'first-aid-scheduled-appointments': FirstAidScheduledAppointments,
  'service-action-grid': ServiceActionGrid,
  'insurance-benefits-grid': InsuranceBenefitsGrid,
  'plan-audience-cards': PlanAudienceCards,
  'global-care-statement': GlobalCareStatement,
  'trust-story-collage': TrustStoryCollage,
  'company-impact-metrics': CompanyImpactMetrics,
  'audience-selector': AudienceSelectorSection,
  'card-grid': GridComponent,
  card: GridComponent,
  'feature-grid': FeaturesSection,
  cta: SectionCTA,
  stats: TrustMetricsSection,
  footer: SiteFooter,
  'bdil-footer': SiteFooter,
  'announcement-bar': AlertBar,
  'floating-chat': FloatingChat,
  'back-to-top-widget': BackToTopWidgetComponent,
}

const clientComponentCodes = [
  'hero', 'hero-carousel', 'plan-showcase', 'plan-comparison', 'faq', 'testimonial-showcase',
  'blog-listing', 'blog-detail', 'search-results', 'form', 'header', 'bdil-header',
]
for (const code of clientComponentCodes) {
  registryEntries[code] = (props) => <ClientExperienceComponent {...props} code={code} />
}

export const componentRegistry: Readonly<Record<string, React.ComponentType<ExperienceComponentProps>>> = registryEntries

export function resolveComponent(code: string): React.ComponentType<ExperienceComponentProps> {
  return componentRegistry[normalizeComponentCode(code)] ?? FallbackComponent
}
