'use client'

import { useEffect, useId, useRef, useState } from 'react'
import Icon from '../atoms/Icon'

/** Editorial reference only — never a URL, never a file. Per ADR-004 the DXP stores just the
 * stable identifiers the server-side proxy (`/api/dxp/documents/download`, Codex) needs to fetch
 * a fresh, short-lived signed URL from the Product Documents API at click time. `documentType` is
 * intentionally open (`string`, not a closed union) — production has confirmed COC/TOB so far,
 * but the whitelist itself lives server-side; the editor UI offers COC/TOB today via `catalog.ts`. */
export type ProductDocumentRef = { documentType?: string; planOptionCode?: string }

const HEADING_TEXT: Record<string, string> = { es: 'Documentos del producto', en: 'Product documents', pt: 'Documentos do produto' }
const PENDING_TEXT: Record<string, string> = {
  es: 'Documento en configuración.',
  en: 'Document being configured.',
  pt: 'Documento em configuração.',
}
// Same copy ADR-004 §6 specifies for the runtime 404/error fallback — shown whenever the proxy
// reports the document isn't reachable through either of its two sources.
export const RUNTIME_FALLBACK_TEXT: Record<string, string> = {
  es: 'Documento temporalmente no disponible. Contáctanos para recibir una copia.',
  en: 'Document temporarily unavailable. Contact us to receive a copy.',
  pt: 'Documento temporariamente indisponível. Entre em contato para receber uma cópia.',
}
const LOADING_PDF_TEXT: Record<string, string> = { es: 'Cargando documento...', en: 'Loading document...', pt: 'Carregando documento...' }
const OPEN_NEW_TAB_TEXT: Record<string, string> = { es: 'Abrir en pestaña nueva', en: 'Open in new tab', pt: 'Abrir em nova guia' }
const DOWNLOAD_TEXT: Record<string, string> = { es: 'Descargar PDF', en: 'Download PDF', pt: 'Baixar PDF' }
const EXPAND_TEXT: Record<string, string> = { es: 'Ampliar visor', en: 'Expand viewer', pt: 'Ampliar visualizador' }
const COLLAPSE_TEXT: Record<string, string> = { es: 'Reducir visor', en: 'Collapse viewer', pt: 'Reduzir visualizador' }
const API_DOWN_TEXT: Record<string, string> = {
  es: 'La API no responde. Mostrando la última actualización aprobada: ',
  en: 'The API is unavailable. Showing the last approved update: ',
  pt: 'A API não responde. Mostrando a última atualização aprovada: ',
}
// A DAM fallback copy needs a visible freshness label; live documents do not.
const DAM_FALLBACK_TEXT: Record<string, string> = { es: 'Última copia verificada', en: 'Last verified copy', pt: 'Última cópia verificada' }
const DOCUMENT_LABELS: Record<string, Record<string, string>> = {
  COC: { es: 'Certificado de cobertura', en: 'Certificate of coverage', pt: 'Certificado de cobertura' },
  TOB: { es: 'Tabla de beneficios', en: 'Table of benefits', pt: 'Tabela de benefícios' },
}

// BDIL's document service uses SP for Spanish; PPGA's issuer expects the API locale ES.
// Keep this mapping issuer-specific because the public DXP locale remains `es` for both Apps.
const DETAIL_DOCUMENT_LABELS: Record<string, Record<string, string>> = {
  COC: { es: 'Condiciones generales', en: 'Conditions PDF', pt: 'Condições gerais' },
  TOB: { es: 'Folleto', en: 'Brochure', pt: 'Folheto' },
}

const apiLanguage = (locale: string, appSlug: string): 'EN' | 'ES' | 'SP' | 'PT' =>
  locale === 'es' ? appSlug === 'ppga' ? 'ES' : 'SP' : locale === 'pt' ? 'PT' : 'EN'

type Status = 'checking' | 'available' | 'unavailable'
type StatusPayload = { source?: 'product-api' | 'dam-fallback'; lastUpdatedAt?: string }

function DocumentLoading({ copy }: { copy: string }) {
  return <div aria-live="polite" className="product-document-viewer__loading" role="status">
    <span aria-hidden="true" className="product-document-viewer__loading-icon"><Icon name="file-text" size={38} /></span>
    <span>{LOADING_PDF_TEXT[copy]}</span>
  </div>
}

function DocumentViewer({ copy, downloadUrl, previewUrl, viewerId }: { copy: string; downloadUrl: string; previewUrl: string; viewerId: string }) {
  const viewerRef = useRef<HTMLElement>(null)
  const [status, setStatus] = useState<Status>('checking')
  const [source, setSource] = useState<'product-api' | 'dam-fallback' | null>(null)
  const [expanded, setExpanded] = useState(false)
  const [frameReady, setFrameReady] = useState(false)

  useEffect(() => {
    let cancelled = false
    fetch(`${downloadUrl}&mode=status`, { cache: 'no-store' })
      .then(async (response) => {
        if (cancelled) return
        if (!response.ok) { setStatus('unavailable'); return }
        const data = (await response.json().catch(() => ({}))) as StatusPayload
        setSource(data.source ?? null)
        setStatus('available')
      })
      .catch(() => { if (!cancelled) setStatus('unavailable') })
    return () => { cancelled = true }
  }, [downloadUrl])

  useEffect(() => {
    const syncFullscreen = () => setExpanded(document.fullscreenElement === viewerRef.current)
    document.addEventListener('fullscreenchange', syncFullscreen)
    return () => document.removeEventListener('fullscreenchange', syncFullscreen)
  }, [])

  useEffect(() => {
    if (!expanded || document.fullscreenElement) return
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === 'Escape') setExpanded(false) }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [expanded])

  const toggleFullscreen = async () => {
    const viewer = viewerRef.current
    if (!viewer) return
    if (document.fullscreenElement === viewer) { await document.exitFullscreen(); return }
    if (expanded) { setExpanded(false); return }
    try { await viewer.requestFullscreen() } catch { setExpanded(true) }
  }

  if (status === 'checking') {
    return (
      <section aria-busy="true" aria-live="polite" className="product-document-viewer product-document-viewer--loading" id={viewerId} role="tabpanel">
        <DocumentLoading copy={copy} />
      </section>
    )
  }
  if (status === 'unavailable') {
    return (
      <div className="product-document-viewer__state" id={viewerId} role="tabpanel">
        <Icon name="file-text" size={28} />
        <p>{RUNTIME_FALLBACK_TEXT[copy]}</p>
      </div>
    )
  }
  return (
    <section aria-live="polite" className={`product-document-viewer${expanded ? ' product-document-viewer--expanded' : ''}`} id={viewerId} ref={viewerRef} role="tabpanel">
      <div className="product-document-viewer__toolbar">
        {source === 'dam-fallback' ? <span className="product-document-viewer__badge product-document-viewer__badge--dam-fallback">{DAM_FALLBACK_TEXT[copy]}</span> : null}
        <div className="product-document-viewer__controls">
          <button aria-pressed={expanded} className="product-document-viewer__control" onClick={toggleFullscreen} type="button">
            <Icon name="maximize-2" size={15} />
            {expanded ? COLLAPSE_TEXT[copy] : EXPAND_TEXT[copy]}
          </button>
          <a className="product-document-viewer__control" download href={previewUrl}>
            <Icon name="download" size={15} />
            {DOWNLOAD_TEXT[copy]}
          </a>
          <a className="product-document-viewer__control" href={downloadUrl} rel="noopener" target="_blank">
            <Icon name="external-link" size={15} />
            {OPEN_NEW_TAB_TEXT[copy]}
          </a>
        </div>
      </div>
      <div aria-busy={!frameReady} className="product-document-viewer__frame-shell">
        {!frameReady ? <DocumentLoading copy={copy} /> : null}
        <iframe className={`product-document-viewer__frame${frameReady ? ' is-ready' : ''}`} onError={() => setStatus('unavailable')} onLoad={() => setFrameReady(true)} src={previewUrl} title={downloadUrl} />
      </div>
    </section>
  )
}

function ProductDocumentViewer({ activeType, appSlug, documents, locale, planCode, viewerId }: { activeType: string; appSlug: string; documents: ProductDocumentRef[]; locale: string; planCode: string; viewerId: string }) {
  const copy = locale in HEADING_TEXT ? locale : 'en'
  const language = apiLanguage(locale, appSlug)
  const active = documents.find((doc) => (doc.documentType || 'TOB') === activeType) ?? documents[0]
  const params = new URLSearchParams({ appSlug, planCode, documentType: activeType, language })
  if (active?.planOptionCode) params.set('planOptionCode', active.planOptionCode)
  const downloadUrl = `/api/dxp/documents/download?${params.toString()}`
  const previewUrl = `/api/dxp/documents/preview?${params.toString()}`

  return <DocumentViewer copy={copy} downloadUrl={downloadUrl} key={downloadUrl} previewUrl={previewUrl} viewerId={viewerId} />
}

export default function ProductDocumentsList({ appSlug, documents, locale, planCode, variant = 'card' }: {
  appSlug: string
  documents?: ProductDocumentRef[]
  locale: string
  planCode?: string | null
  variant?: 'card' | 'detail'
}) {
  const list = documents ?? []
  const instanceId = useId()
  const [fallbackUpdate, setFallbackUpdate] = useState<string | null>(null)
  const [activeType, setActiveType] = useState(list[0]?.documentType || 'TOB')

  useEffect(() => {
    if (!planCode || !list.length) return
    const controller = new AbortController()
    const first = list[0]
    const query = new URLSearchParams({ appSlug, planCode, documentType: first.documentType || 'TOB', language: apiLanguage(locale, appSlug), mode: 'status' })
    if (first.planOptionCode) query.set('planOptionCode', first.planOptionCode)
    fetch(`/api/dxp/documents/download?${query}`, { signal: controller.signal, cache: 'no-store' })
      .then(async (response) => (response.ok ? response.json() : null))
      .then((data: StatusPayload | null) => { if (data?.source === 'dam-fallback' && data.lastUpdatedAt) setFallbackUpdate(data.lastUpdatedAt) })
      .catch(() => undefined)
    return () => controller.abort()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appSlug, planCode, locale, list.length])

  if (!list.length) return null
  const copy = locale in HEADING_TEXT ? locale : 'en'

  if (!planCode && variant !== 'detail') {
    return (
      <div className="product-documents product-documents--pending">
        <span className="product-documents__label">{HEADING_TEXT[copy]}</span>
        <span className="product-documents__pending" title={PENDING_TEXT[copy]}>
          <Icon name="file-text" size={14} />
          {PENDING_TEXT[copy]}
        </span>
      </div>
    )
  }

  const viewerId = `product-document-${instanceId}-${activeType}`

  return (
    <div className={`product-documents product-documents--${variant}`}>
      {fallbackUpdate ? (
        <div className="product-documents__api-alert" role="status">
          <Icon name="alert-triangle" size={15} />
          <span>{API_DOWN_TEXT[copy]}{new Intl.DateTimeFormat(copy, { dateStyle: 'medium' }).format(new Date(fallbackUpdate))}</span>
        </div>
      ) : null}
      <span className="product-documents__label">{HEADING_TEXT[copy]}</span>
      <div aria-label={HEADING_TEXT[copy]} className="product-documents__actions" role="tablist">
        {list.map((doc, index) => {
          const type = doc.documentType || 'TOB'
          const label = (variant === 'detail' ? DETAIL_DOCUMENT_LABELS[type] : DOCUMENT_LABELS[type])?.[copy] ?? type
          return (
            <button aria-controls={viewerId} aria-selected={type === activeType} className={`product-documents__action${type === activeType ? ' is-active' : ''}`} key={`${type}-${index}`} onClick={() => setActiveType(type)} role="tab" type="button">
              <Icon name="file-text" size={14} />
              <span>{label}</span>
            </button>
          )
        })}
      </div>
      {planCode ? <ProductDocumentViewer activeType={activeType} appSlug={appSlug} documents={list} locale={locale} planCode={planCode} viewerId={viewerId} /> : (
        <div className="product-document-viewer__state product-document-viewer__state--pending" id={viewerId} role="tabpanel">
          <Icon name="file-text" size={28} />
          <p>{PENDING_TEXT[copy]}</p>
        </div>
      )}
    </div>
  )
}
