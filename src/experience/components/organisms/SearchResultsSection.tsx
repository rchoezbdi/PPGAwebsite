'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Icon from '../atoms/Icon'
import { text } from '../shared'
import type { ExperienceComponentProps } from '@/experience/registry/componentRegistry'

type SearchResult = { type: 'page' | 'blog-post'; title: string; excerpt?: string; href: string; locale: string }

const COPY: Record<string, { placeholder: string; empty: string; prompt: string; resultsFor: string; searching: string }> = {
  en: { placeholder: 'Search Best Doctors Insurance', empty: 'No results for', prompt: 'Start typing to find what you need. Results will display here.', resultsFor: 'results for', searching: 'Searching…' },
  es: { placeholder: 'Buscar en Best Doctors Insurance', empty: 'Sin resultados para', prompt: 'Empieza a escribir para encontrar lo que necesitas. Los resultados aparecerán aquí.', resultsFor: 'resultados para', searching: 'Buscando…' },
  pt: { placeholder: 'Pesquisar na Best Doctors Insurance', empty: 'Nenhum resultado para', prompt: 'Comece a digitar para encontrar o que você precisa. Os resultados aparecerão aqui.', resultsFor: 'resultados para', searching: 'Pesquisando…' },
}

/** The full /home/search-results page — a real search box plus results, backed by the same
 * /api/site-search endpoint the header's quick SearchModal uses. Kept as its own page (not just
 * the modal) because "View all results" needs somewhere real to land, and a direct/shared link to
 * a specific query should work without JS-only modal state. */
export default function SearchResultsSection({ content, settings, locale, site }: ExperienceComponentProps) {
  const p = { ...settings, ...content }
  const background = text(p.background)
  const searchParams = useSearchParams()
  const initialQuery = searchParams?.get('q') ?? ''
  const [query, setQuery] = useState(initialQuery)
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(Boolean(initialQuery))
  const copy = COPY[locale] ?? COPY.en

  useEffect(() => {
    if (!query.trim() || query.trim().length < 2) { setResults([]); setSearched(false); return }
    setLoading(true)
    setSearched(true)
    const timer = setTimeout(() => {
      fetch(`/api/site-search?q=${encodeURIComponent(query.trim())}&locale=${locale}&app=${encodeURIComponent(site.slug || 'home')}&limit=20`)
        .then((res) => res.json())
        .then((data) => setResults(Array.isArray(data.results) ? data.results : []))
        .catch(() => setResults([]))
        .finally(() => setLoading(false))
    }, 300)
    return () => clearTimeout(timer)
  }, [query, locale, site.slug])

  return (
    <section className={`section search-results-page${background && background !== 'white' ? ` section--${background}` : ''}`}>
      <div className="section-container">
        <div className="search-results-page__box">
          <Icon ariaHidden name="search" size={20} />
          <input
            aria-label={copy.placeholder}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={copy.placeholder}
            type="search"
            value={query}
          />
        </div>
        <div className="search-results-page__body">
          {!searched ? (
            <p className="search-results-page__hint">{copy.prompt}</p>
          ) : loading ? (
            <p className="search-results-page__hint">{copy.searching}</p>
          ) : results.length === 0 ? (
            <p className="search-results-page__hint">{copy.empty} &ldquo;{query.trim()}&rdquo;</p>
          ) : (
            <>
              <p className="search-results-page__count">{results.length} {copy.resultsFor} &ldquo;{query.trim()}&rdquo;</p>
              <ul className="search-results-page__list">
                {results.map((result, index) => (
                  <li key={`${result.href}-${index}`}>
                    <a href={result.href}>
                      <span className="search-results-page__result-title">{result.title}</span>
                      {result.excerpt ? <span className="search-results-page__result-excerpt">{result.excerpt}</span> : null}
                    </a>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </div>
    </section>
  )
}
