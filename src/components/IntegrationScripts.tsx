'use client'

import Script from 'next/script'
import { useEffect, useRef } from 'react'
import type { LegacyIntegrationEntry as IntegrationEntry, RuntimeIntegration } from '@/contracts/site'
import { IUBENDA_CONSENT_EVENT, useIubendaConsent } from '@/experience/consent/iubenda'

type CustomScript = NonNullable<IntegrationEntry['customScripts']>[number]
export type { RuntimeIntegration } from '@/contracts/site'

const gatedPurpose = (iubendaEnabled: boolean, purposeId?: string | null) => (iubendaEnabled ? purposeId : null)

function GatedInlineScript({ id, purposeId, iubendaEnabled, code }: { id: string; purposeId?: string | null; iubendaEnabled: boolean; code: string }) {
  const granted = useIubendaConsent(gatedPurpose(iubendaEnabled, purposeId))
  if (!granted) return null
  return <Script id={id} strategy="afterInteractive">{code}</Script>
}

function GatedExternalScript({ id, src, purposeId, iubendaEnabled }: { id: string; src: string; purposeId?: string | null; iubendaEnabled: boolean }) {
  const granted = useIubendaConsent(gatedPurpose(iubendaEnabled, purposeId))
  if (!granted || !src) return null
  return <Script id={id} src={src} strategy="afterInteractive" />
}

function CustomScripts({ entries, iubendaEnabled }: { entries: CustomScript[]; iubendaEnabled: boolean }) {
  return (
    <>
      {entries.filter((entry) => entry.enabled).map((entry, index) => {
        const id = `bd-custom-${entry.id ?? index}`
        if (entry.scriptType === 'external') {
          return entry.src ? <GatedExternalScript key={id} id={id} iubendaEnabled={iubendaEnabled} purposeId={entry.iubendaPurposeId} src={entry.src} /> : null
        }
        return entry.code ? <GatedInlineScript key={id} id={id} iubendaEnabled={iubendaEnabled} purposeId={entry.iubendaPurposeId} code={entry.code} /> : null
      })}
    </>
  )
}

function useDialpadLoader({
  enabled,
  gateOnConsent = false,
  loadStrategy,
  server,
  iubendaEnabled,
  iubendaPurposeId,
}: {
  enabled?: boolean | null
  gateOnConsent?: boolean
  loadStrategy?: string | null
  server?: string | null
  iubendaEnabled: boolean
  iubendaPurposeId?: string | null
}) {
  const shouldGate = gateOnConsent || loadStrategy === 'consent'
  const consentGranted = useIubendaConsent(shouldGate ? gatedPurpose(iubendaEnabled, iubendaPurposeId) : null)

  useEffect(() => {
    if (!enabled || loadStrategy === 'immediate') return
    if (shouldGate && iubendaEnabled && !consentGranted) return

    let loaded = false
    const load = () => {
      if (loaded || document.querySelector('script[data-bd-dialpad]')) return
      loaded = true
      const resolvedServer = server?.replace(/\/$/, '') || 'https://us-central.dx.dialpad.com'
      ;(window as Window & { dxe?: { server: string } }).dxe = { server: resolvedServer }
      const script = document.createElement('script')
      script.type = 'module'
      script.async = true
      script.dataset.bdDialpad = 'true'
      script.src = `${resolvedServer}/dxclient/dist/dialpad-chatbot.es.js`
      document.head.appendChild(script)
    }

    const events = ['pointerdown', 'keydown', 'touchstart'] as const
    events.forEach((event) => window.addEventListener(event, load, { once: true, passive: true }))
    const timeout = window.setTimeout(load, 6000)
    return () => {
      events.forEach((event) => window.removeEventListener(event, load))
      window.clearTimeout(timeout)
    }
  }, [enabled, loadStrategy, server, consentGranted, shouldGate, iubendaEnabled])
}

/** iubenda's own script (cdn.iubenda.com/cs/iubenda_cs.js) rewrites this button's inline
 * style once it binds to it, dropping the z-index we set — the button then falls behind
 * Dialpad's fixed launcher (z-index:123, same bottom-right corner) and becomes unreachable.
 * Re-applying with setProperty(...,'important') after every mutation wins regardless of
 * when iubenda's script runs, since an inline !important beats any external stylesheet's
 * !important rule (the CSS-only fallback in styles.css does not: iubenda's stylesheet loads
 * after ours and ties on specificity, so source order decides and theirs wins). */
function useIubendaFloatingButtonStacking(enabled: boolean) {
  const ref = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    if (!enabled) return
    const el = ref.current
    if (!el) return
    const apply = () => {
      el.style.setProperty('position', 'fixed', 'important')
      el.style.setProperty('bottom', '96px', 'important')
      el.style.setProperty('right', '16px', 'important')
      el.style.setProperty('z-index', '2147483647', 'important')
    }
    apply()
    const observer = new MutationObserver(apply)
    observer.observe(el, { attributes: true, attributeFilter: ['style'] })
    return () => observer.disconnect()
  }, [enabled])
  return ref
}

/**
 * Iubenda needs its global configuration to exist before its SDK evaluates. `next/script` with
 * `beforeInteractive` cannot be rendered from this client component in a shared Page Builder
 * preview: React treats that as a raw script tag and refuses to execute it. Configure and load
 * the SDK from one client effect instead, preserving the required order in every renderer.
 */
function useIubendaLoader({ enabled, languagePolicies, locale, policyId, siteId }: {
  enabled: boolean
  languagePolicies: Record<string, number>
  locale: string
  policyId: number
  siteId: string
}) {
  useEffect(() => {
    if (!enabled || !siteId) return
    const windowWithIubenda = window as Window & { _iub?: unknown[] & { csConfiguration?: Record<string, unknown>; csLangConfiguration?: Record<string, number> } }
    const iubenda = windowWithIubenda._iub ?? []
    windowWithIubenda._iub = iubenda
    iubenda.csConfiguration = {
      siteId: Number.isFinite(Number(siteId)) ? Number(siteId) : siteId,
      ...(policyId ? { cookiePolicyId: policyId } : {}),
      lang: locale,
      noticeAtCollectionButton: false,
      callback: {
        onConsentGiven: () => window.dispatchEvent(new Event(IUBENDA_CONSENT_EVENT)),
        onPreferenceExpressed: () => window.dispatchEvent(new Event(IUBENDA_CONSENT_EVENT)),
      },
    }
    if (Object.keys(languagePolicies).length) iubenda.csLangConfiguration = languagePolicies

    // Unit tests verify the configuration contract but do not provide a real browser network
    // stack for Iubenda's three remote SDK files.
    if (process.env.NODE_ENV === 'test') return

    const load = (id: string, src: string) => new Promise<void>((resolve) => {
      const existing = document.getElementById(id) as HTMLScriptElement | null
      if (existing) {
        if (existing.dataset.loaded === 'true') resolve()
        else existing.addEventListener('load', () => resolve(), { once: true })
        return
      }
      const script = document.createElement('script')
      script.id = id
      script.async = true
      script.src = src
      script.addEventListener('load', () => { script.dataset.loaded = 'true'; resolve() }, { once: true })
      script.addEventListener('error', () => resolve(), { once: true })
      document.head.appendChild(script)
    })

    void (async () => {
      await load('bd-iubenda-autoblocking', `https://cs.iubenda.com/autoblocking/${encodeURIComponent(siteId)}.js`)
      await load('bd-iubenda-gpp', 'https://cdn.iubenda.com/cs/gpp/stub.js')
      await load('bd-iubenda-sdk', 'https://cdn.iubenda.com/cs/iubenda_cs.js')
    })()
  }, [enabled, languagePolicies, locale, policyId, siteId])
}

const languagePolicies = (value: unknown): Record<string, number> => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {}
  return Object.fromEntries(Object.entries(value).flatMap(([locale, policyId]) => {
    const parsed = Number(policyId)
    return Number.isSafeInteger(parsed) && parsed > 0 ? [[locale, parsed]] : []
  }))
}

export default function IntegrationScripts({ integrations = [], locale = 'en', value }: { integrations?: RuntimeIntegration[]; locale?: string; value?: IntegrationEntry | null }) {
  const runtimeIubenda = integrations.find((integration) => integration.provider === 'iubenda')
  const runtimeIubendaConfig = runtimeIubenda?.configuration ?? {}
  const runtimeIubendaSiteId = typeof runtimeIubendaConfig.siteId === 'string' || typeof runtimeIubendaConfig.siteId === 'number'
    ? String(runtimeIubendaConfig.siteId).trim()
    : ''
  const runtimeIubendaPolicyValue = runtimeIubendaConfig.cookiePolicyId ?? runtimeIubendaConfig.policyId
  const runtimeIubendaPolicyId = typeof runtimeIubendaPolicyValue === 'string' || typeof runtimeIubendaPolicyValue === 'number'
    ? String(runtimeIubendaPolicyValue).trim()
    : ''
  const runtimeLanguagePolicies = languagePolicies(runtimeIubendaConfig.languagePolicies)
  const iubenda = runtimeIubenda
    ? { enabled: Boolean(runtimeIubendaSiteId), siteId: runtimeIubendaSiteId, policyId: runtimeIubendaPolicyId, autoBlocking: true }
    : value?.iubenda
  const iubendaEnabled = Boolean(iubenda?.enabled && iubenda.siteId)
  const selectedPolicyId = runtimeLanguagePolicies[locale] ?? Number(runtimeIubendaPolicyId || iubenda?.policyId || 0)
  const gtm = value?.googleTagManager
  const clarity = value?.microsoftClarity
  const metaPixel = value?.metaPixel
  const linkedinInsight = value?.linkedinInsight
  const hubspot = value?.hubspot
  const runtimeDialpad = integrations.find((integration) => integration.provider === 'dialpad')
  const runtimeDialpadConfig = runtimeDialpad?.configuration ?? {}
  const runtimeChannelID = typeof runtimeDialpadConfig.channelId === 'string' ? runtimeDialpadConfig.channelId.trim() : ''
  const runtimeProviderEmail = typeof runtimeDialpadConfig.providerEmail === 'string' ? runtimeDialpadConfig.providerEmail.trim() : ''
  const dialpad = runtimeDialpad ? {
    enabled: Boolean(runtimeChannelID && runtimeProviderEmail),
    loadStrategy: 'interaction',
    server: typeof runtimeDialpadConfig.server === 'string' ? runtimeDialpadConfig.server : undefined,
    iubendaPurposeId: runtimeDialpad.consentPurposeId,
  } : value?.dialpad
  const dialpadServer = dialpad?.server?.replace(/\/$/, '') || 'https://us-central.dx.dialpad.com'

  useIubendaLoader({
    enabled: iubendaEnabled,
    languagePolicies: runtimeLanguagePolicies,
    locale,
    policyId: selectedPolicyId,
    siteId: String(iubenda?.siteId ?? ''),
  })

  useDialpadLoader({
    enabled: dialpad?.enabled,
    gateOnConsent: Boolean(runtimeDialpad),
    loadStrategy: dialpad?.loadStrategy,
    server: dialpad?.server,
    iubendaEnabled: Boolean(runtimeDialpad?.consentPurposeId) || iubendaEnabled,
    iubendaPurposeId: dialpad?.iubendaPurposeId,
  })

  const iubendaButtonRef = useIubendaFloatingButtonStacking(Boolean(iubenda?.enabled))

  return (
    <>
      {iubenda?.enabled ? (
        <>
          <button
            aria-label="Your consent preferences for tracking technologies"
            className="iubenda-tp-btn iubenda-cs-preferences-link"
            data-iub-enabled="1"
            data-tp-float="bottom-right"
            data-tp-icon="data-tp-icon"
            ref={iubendaButtonRef}
            onClick={(event) => {
              const api = (window as Window & { _iub?: { cs?: { api?: { openPreferences?: () => void } } } })._iub?.cs?.api
              if (typeof api?.openPreferences !== 'function') return
              event.preventDefault()
              event.stopPropagation()
              api.openPreferences()
            }}
            style={{ display: 'inline-block', zIndex: 2147483647 }}
            title="Your consent preferences for tracking technologies"
            type="button"
          >
            <span className="iub-sr-only">Your consent preferences for tracking technologies</span>
          </button>
        </>
      ) : null}

      {gtm?.enabled && gtm.containerId ? (
        <GatedInlineScript
          id="bd-gtm"
          iubendaEnabled={iubendaEnabled}
          purposeId={gtm.iubendaPurposeId}
          code={`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer',${JSON.stringify(gtm.containerId)});`}
        />
      ) : null}
      {clarity?.enabled && clarity.projectId ? (
        <GatedInlineScript
          id="bd-clarity"
          iubendaEnabled={iubendaEnabled}
          purposeId={clarity.iubendaPurposeId}
          code={`(function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src='https://www.clarity.ms/tag/'+i;y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);})(window,document,'clarity','script',${JSON.stringify(clarity.projectId)});`}
        />
      ) : null}
      {metaPixel?.enabled && metaPixel.pixelId ? (
        <GatedInlineScript
          id="bd-meta-pixel"
          iubendaEnabled={iubendaEnabled}
          purposeId={metaPixel.iubendaPurposeId}
          code={`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init',${JSON.stringify(metaPixel.pixelId)});fbq('track','PageView');`}
        />
      ) : null}
      {linkedinInsight?.enabled && linkedinInsight.partnerId ? (
        <GatedInlineScript
          id="bd-linkedin-insight"
          iubendaEnabled={iubendaEnabled}
          purposeId={linkedinInsight.iubendaPurposeId}
          code={`_linkedin_partner_id="${linkedinInsight.partnerId}";window._linkedin_data_partner_ids=window._linkedin_data_partner_ids||[];window._linkedin_data_partner_ids.push(_linkedin_partner_id);(function(l){if(!l){window.lintrk=function(a,b){window.lintrk.q.push([a,b])};window.lintrk.q=[]}var s=document.getElementsByTagName("script")[0];var b=document.createElement("script");b.type="text/javascript";b.async=!0;b.src="https://snap.licdn.com/li.lms-analytics/insight.min.js";s.parentNode.insertBefore(b,s)})(window.lintrk);`}
        />
      ) : null}
      {hubspot?.enabled && hubspot.portalId ? (
        <GatedExternalScript
          id="bd-hubspot"
          iubendaEnabled={iubendaEnabled}
          purposeId={hubspot.iubendaPurposeId}
          src={`https://js.hs-scripts.com/${encodeURIComponent(hubspot.portalId)}.js`}
        />
      ) : null}
      {value?.customScripts?.length ? <CustomScripts entries={value.customScripts} iubendaEnabled={iubendaEnabled} /> : null}

      {runtimeDialpad && runtimeChannelID && runtimeProviderEmail ? (
        <div id="dx_chatbot_fab_wrapper_id" style={{ backgroundColor: 'transparent', bottom: 16, boxSizing: 'border-box', cursor: 'pointer', display: 'flex', height: 56, overflow: 'hidden', position: 'fixed', [runtimeDialpadConfig.position === 'bottom-left' ? 'left' : 'right']: 16, width: 56, zIndex: 123 }}>
          {/* Matches the production Dialpad launcher markup. The SDK binds to these public attributes. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img alt="Open chat with Best Doctors Insurance support" aria-label="Open chat with Best Doctors Insurance support" data-dxchannelid={runtimeChannelID} data-dxprovemail={runtimeProviderEmail} id="dx_chatbot_fab_id" role="button" src="/dialpad-contact.svg" style={{ height: '100%', objectFit: 'contain', width: '100%' }} />
        </div>
      ) : null}

      {dialpad?.enabled && dialpad.loadStrategy === 'immediate' ? (
        <>
          <Script id="bd-dialpad-config" strategy="afterInteractive">{`window.dxe={server:${JSON.stringify(dialpadServer)}};`}</Script>
          <Script data-bd-dialpad="true" src={`${dialpadServer}/dxclient/dist/dialpad-chatbot.es.js`} strategy="afterInteractive" type="module" />
        </>
      ) : null}
    </>
  )
}
