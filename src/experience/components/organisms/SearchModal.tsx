'use client'

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import Icon from '../atoms/Icon'
import type { LocalizedRoutes } from '@/experience/navigation/localizedRoutes'
import { resolveExperienceLink } from '@/experience/navigation/resolver'

type SearchResult = { type: 'page' | 'blog-post'; title: string; excerpt?: string; href: string; locale: string }

const COPY: Record<string, { placeholder: string; close: string; viewAll: string; empty: string; prompt: string }> = {
  en: { placeholder: 'Search Best Doctors Insurance', close: 'Close search', viewAll: 'View all results', empty: 'No results for', prompt: 'Start typing to search the site' },
  es: { placeholder: 'Buscar en Best Doctors Insurance', close: 'Cerrar búsqueda', viewAll: 'Ver todos los resultados', empty: 'Sin resultados para', prompt: 'Escribe para buscar en el sitio' },
  pt: { placeholder: 'Pesquisar na Best Doctors Insurance', close: 'Fechar pesquisa', viewAll: 'Ver todos os resultados', empty: 'Nenhum resultado para', prompt: 'Digite para pesquisar no site' },
}

/** Quick-search modal opened from the header's search button — shows the first few real matches
 * inline (debounced fetch to /api/site-search) instead of forcing a full page navigation just to
 * see whether anything matches. "View all results" is the only thing that navigates, to the full
 * search-results page. Portaled to <body> for the same stacking-context reason MobileNavigation
 * already documents (the header's `isolation: isolate` would otherwise trap it). */
export default function SearchModal({ locale, onClose, open, siteSlug, localizedRoutes }: { locale: string; onClose: () => void; open: boolean; siteSlug: string; localizedRoutes?: LocalizedRoutes }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const copy = COPY[locale] ?? COPY.en

  useEffect(() => {
    if (!open) return
    setQuery('')
    setResults([])
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const focusTimer = setTimeout(() => inputRef.current?.focus(), 10)
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', onKeyDown)
      clearTimeout(focusTimer)
    }
  }, [open, onClose])

  useEffect(() => {
    if (!open || query.trim().length < 2) { setResults([]); return }
    setLoading(true)
    const timer = setTimeout(() => {
      fetch(`/api/site-search?q=${encodeURIComponent(query.trim())}&locale=${locale}&app=${encodeURIComponent(siteSlug || 'home')}&limit=5`)
        .then((res) => res.json())
        .then((data) => setResults(Array.isArray(data.results) ? data.results : []))
        .catch(() => setResults([]))
        .finally(() => setLoading(false))
    }, 250)
    return () => clearTimeout(timer)
  }, [query, locale, open, siteSlug])

  if (!open) return null

  const viewAllHref = resolveExperienceLink({ url: '/home/search-results', locale, fallbackSite: siteSlug, localizedRoutes }).href
  const searchHref = viewAllHref ? `${viewAllHref}?q=${encodeURIComponent(query.trim())}` : null

  return createPortal((
    <div className="search-modal" role="dialog" aria-modal="true">
      <div aria-hidden="true" className="search-modal__scrim" onClick={onClose} />
      <div className="search-modal__panel">
        <form
          className="search-modal__form"
          onSubmit={(event) => { event.preventDefault(); if (query.trim() && searchHref) window.location.href = searchHref }}
        >
          <Icon ariaHidden name="search" size={18} />
          <input
            aria-label={copy.placeholder}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={copy.placeholder}
            ref={inputRef}
            type="search"
            value={query}
          />
          <button aria-label={copy.close} className="search-modal__close" onClick={onClose} type="button"><Icon name="close" size={16} /></button>
        </form>
        <div className="search-modal__results">
          {query.trim().length < 2 ? (
            <p className="search-modal__hint">{copy.prompt}</p>
          ) : loading ? (
            <p className="search-modal__hint">…</p>
          ) : results.length === 0 ? (
            <p className="search-modal__hint">{copy.empty} &ldquo;{query.trim()}&rdquo;</p>
          ) : (
            <>
              <ul>
                {results.map((result, index) => (
                  <li key={`${result.href}-${index}`}>
                    <a href={result.href}>
                      <span className="search-modal__result-title">{result.title}</span>
                      {result.excerpt ? <span className="search-modal__result-excerpt">{result.excerpt}</span> : null}
                    </a>
                  </li>
                ))}
              </ul>
              {searchHref ? <a className="search-modal__view-all" href={searchHref}>{copy.viewAll} →</a> : null}
            </>
          )}
        </div>
      </div>
    </div>
  ), document.body)
}
