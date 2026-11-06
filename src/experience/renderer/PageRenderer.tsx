import React from 'react'
import { preload } from 'react-dom'
import { ButtonRecipeStyle, DesignSystemStyle, type DesignTokens } from '@/experience/design-system/DesignSystemRuntime'
import { fontPreloadResources, FontStyle, type FontEntry } from '@/experience/design-system/FontRuntime'
import IntegrationScripts from '@/components/IntegrationScripts'
import { SectionTracker } from '@/experience/analytics/SectionTracker'
import BackToTopRuntime from '@/experience/runtime/BackToTopRuntime'
import { resolveComponent, type ExperienceSite } from '@/experience/registry/componentRegistry'
import { isPageChrome, type PageDTO } from '@/contracts/site'
import { deviceVisibilityCss } from '@/experience/renderer/deviceVisibility'

/**
 * Decides whether a PageComponent instance renders, from its own `visibility` JSON. The schema
 * for `visibility` isn't defined by the backend yet, so this only understands the two keys
 * documented here — anything else is ignored rather than treated as a reason to hide.
 *   - `hidden: true` — always skip.
 *   - `locales: string[]` — skip unless the current locale is in the list.
 */
function isVisible(visibility: Record<string, unknown> | undefined, locale: string): boolean {
  if (!visibility) return true
  if (visibility.hidden === true) return false
  const locales = visibility.locales
  if (Array.isArray(locales) && locales.length > 0 && !locales.includes(locale)) return false
  return true
}

export function PageRenderer({
  page,
  site,
  locale,
  hideGlobalLayout = false,
}: {
  page: PageDTO
  site: ExperienceSite
  locale?: string
  hideGlobalLayout?: boolean
}) {
  const activeLocale = locale ?? page.locale ?? 'es'
  const localizedSite = { ...site, localizedRoutes: page.localizedRoutes }
  const components = [...(page.components ?? [])]
    .filter((component) => isVisible(component.visibility, activeLocale) && !(page.layout && isPageChrome(component.role)))
    .sort((a, b) => a.position - b.position)
  const filteredComponents = hideGlobalLayout
    ? components.filter((component) => {
        const code = String(component.code ?? '').toLowerCase()
        return code !== 'header' && code !== 'footer' && code !== 'alert-banner' && code !== 'announcement-bar'
      })
    : components
  const renderedComponents = hideGlobalLayout || !page.layout
    ? filteredComponents
    : [...page.layout.before, ...filteredComponents, ...page.layout.after]
  const pageClass = String(page.slug || 'page').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
  if (page.slug === 'home') {
    const fonts = page.designSystem?.fonts as FontEntry[] | undefined
    // Home also uses Ms Madi in visible decorative headings; preload it with the primary fonts
    // to avoid discovering the same-origin DAM font only after the page stylesheet is parsed.
    for (const font of fontPreloadResources(fonts, ['HelveticaNeueBold', 'Inter', 'Ms Madi'])) {
      preload(font.href, { as: 'font', crossOrigin: 'anonymous', type: font.type })
    }
  }
  const iubenda = page.integrations?.find((integration) => integration.provider === 'iubenda')
  const iubendaConfig = iubenda?.configuration ?? {}
  const iubendaSiteId = typeof iubendaConfig.siteId === 'string' || typeof iubendaConfig.siteId === 'number'
    ? String(iubendaConfig.siteId).trim()
    : ''
  const iubendaPolicyValue = iubendaConfig.cookiePolicyId ?? iubendaConfig.policyId
  const iubendaPolicyId = typeof iubendaPolicyValue === 'string' || typeof iubendaPolicyValue === 'number'
    ? String(iubendaPolicyValue).trim()
    : ''
  if (iubendaSiteId) {
    // Fetch iubenda's consent/bootstrap resources while the initial HTML is parsing.
    // IntegrationScripts still executes autoblocking first and preserves its script order.
    preload(`https://cs.iubenda.com/autoblocking/${encodeURIComponent(iubendaSiteId)}.js`, { as: 'script' })
    preload('https://cdn.iubenda.com/cs/gpp/stub.js', { as: 'script' })
    preload('https://cdn.iubenda.com/cs/iubenda_cs.js', { as: 'script' })
    if (iubendaPolicyId) preload(`https://www.iubenda.com/cookie-solution/confs/js/${encodeURIComponent(iubendaPolicyId)}.js`, { as: 'script' })
  }

  return (
    <main className={`page-renderer page-renderer--${pageClass}`} data-locale={activeLocale} data-page-slug={page.slug}>
      <DesignSystemStyle tokens={(page.designSystem?.tokens ?? null) as DesignTokens | null} />
      <ButtonRecipeStyle style={page.buttonStyle} />
      <FontStyle fonts={page.designSystem?.fonts as FontEntry[] | undefined} />
      {renderedComponents.map((component) => {
        const Component = resolveComponent(component.code)
        const sourceContent = (component.content || {}) as Record<string, unknown>
        const isFinancialPerformance = ['financial-information', 'resumen-financiero', 'resumo-financeiro'].includes(pageClass)
          && component.position === 2
          && String(component.code ?? '').toLowerCase() === 'rich-content'
        const isFinancialMetrics = ['financial-information', 'resumen-financiero', 'resumo-financeiro'].includes(pageClass)
          && String(component.code ?? '').toLowerCase() === 'company-impact-metrics'
        // The published PPGA reference for this page has no CTA inside the image card.
        // The CTA used to live in its own (hidden) section, so don't reintroduce it from
        // the migrated card content in admin/secure previews.
        const financialHeading = String(sourceContent.heading ?? '').toLowerCase()
        const isFinancialPriorities = ['financial-information', 'resumen-financiero', 'resumo-financeiro'].includes(pageClass)
          && String(component.code ?? '').toLowerCase() === 'feature-grid'
          && Array.isArray(sourceContent.features)
          && sourceContent.features.length === 3
        const financialSectionVariant = ['financial-information', 'resumen-financiero', 'resumo-financeiro'].includes(pageClass)
          && String(component.code ?? '').toLowerCase() === 'rich-content'
          ? /priorit/.test(financialHeading) ? 'financial-priorities-intro'
            : /simplifying|simplificando/.test(financialHeading) ? 'financial-simplifying'
            : /launch|lanzamiento|lan[çc]amento|portf[oó]lio|portfolio/.test(financialHeading) ? 'financial-pro-portfolio'
              : undefined
          : undefined
        const content: Record<string, unknown> = {
          ...sourceContent,
          ...(String(component.code ?? '').toLowerCase() === 'form' ? { turnstileSiteKey: process.env.TURNSTILE_SITE_KEY ?? '' } : {}),
          ...(isFinancialPerformance ? { variant: 'financial-performance' } : {}),
          ...(financialSectionVariant ? { variant: financialSectionVariant } : {}),
          ...(isFinancialMetrics ? { financialPresentation: true } : {}),
          ...(isFinancialPriorities ? { financialPriorities: true } : {}),
          localePaths: page.localePaths ?? {},
        }
        const heading = typeof content.heading === 'string'
          ? content.heading
          : typeof content.title === 'string'
          ? content.title
          : ''

        const deviceCss = deviceVisibilityCss(component.instanceId, 'visibility' in component ? component.visibility : undefined)
        return (
          <React.Fragment key={component.instanceId}>
          {deviceCss ? <style>{deviceCss}</style> : null}
          <div
            className="experience-section-item"
            data-section-code={component.code}
            data-section-heading={heading}
            data-section-id={String(component.instanceId)}
            data-section-position={component.position}
          >
            <Component
              content={content}
              instanceId={component.instanceId}
              locale={activeLocale}
              settings={component.settings}
              site={localizedSite}
            />
          </div>
          </React.Fragment>
        )
      })}
      {!renderedComponents.length ? (
        <section className="section section--empty">
          <div className="section-container empty-state">
            <div className="eyebrow"><span />Preview base</div>
            <h1 className="hero-heading">{page.title || 'Página lista para estructurarse.'}</h1>
            <p className="hero-description">Esta página aún no tiene componentes asignados.</p>
          </div>
        </section>
      ) : null}
      <IntegrationScripts integrations={page.integrations ?? []} locale={activeLocale} />
      <BackToTopRuntime content={{}} settings={{}} />
      <SectionTracker
        appSlug={site?.slug || 'home'}
        locale={activeLocale}
        pageSlug={page.slug || 'home'}
      />
    </main>
  )
}
