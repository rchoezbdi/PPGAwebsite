'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import BlogPostCard from '../molecules/BlogPostCard'
import Button from '../atoms/Button'
import SectionHeading from '../molecules/SectionHeading'
import Icon from '../atoms/Icon'
import { DayPicker, type DateRange } from 'react-day-picker'
import { enUS, es, pt } from 'react-day-picker/locale'
import { asMediaAlt, asMediaURL, designTextColor, resolveCTA, text, type CTAContent } from '../shared'
import type { ExperienceComponentProps } from '@/experience/registry/componentRegistry'
import BlogPostDetail from './BlogPostDetail'
import { resolveExperienceLink } from '@/experience/navigation/resolver'

type Post = { title: string; slug: string; excerpt: string; coverImageUrl?: string; publishedAt?: string; categories: Array<{ name: string; slug: string }> }
type ApiResponse = { posts: Post[]; page: number; totalPages: number; totalDocs: number; categories: Array<{ name: string; slug: string }>; years: string[] }
const dateInputValue = (value: string | null | undefined) => {
  if (!value) return ''
  const date = new Date(value)
  return Number.isFinite(date.getTime()) ? new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 16) : ''
}

const parseDateOnly = (value: string) => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  if (!match) return undefined
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
  return date.getFullYear() === Number(match[1]) && date.getMonth() === Number(match[2]) - 1 && date.getDate() === Number(match[3]) ? date : undefined
}
const dateOnlyValue = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
const formatRangeDate = (value: string, locale: string) => {
  const date = parseDateOnly(value)
  return date ? new Intl.DateTimeFormat(locale, { day: '2-digit', month: '2-digit', year: 'numeric' }).format(date) : ''
}

function BlogDateRangePicker({ locale, from, to, onChange, labels }: {
  locale: string
  from: string
  to: string
  onChange: (from: string, to: string) => void
  labels: { date: string; clear: string; startHint: string; endHint: string; weekdays: string[] }
}) {
  const initial = parseDateOnly(from) ?? new Date()
  const [month, setMonth] = useState(new Date(initial.getFullYear(), initial.getMonth(), 1))
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState<string | null>(null)
  const fromLabel = formatRangeDate(from, locale)
  const toLabel = formatRangeDate(to, locale)
  const inputValue = draft !== null ? draft : (fromLabel && toLabel ? `${fromLabel} - ${toLabel}` : fromLabel || '')
  const selected: DateRange | undefined = from || to ? { from: parseDateOnly(from), to: parseDateOnly(to) } : undefined

  const commitDraft = () => {
    if (draft === null) return
    const parts = draft.trim().split(/\s+-\s+/)
    if (parts.length !== 2) return
    const parseManual = (value: string) => {
      const match = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(value.trim())
      return match ? parseDateOnly(`${match[3]}-${match[2].padStart(2, '0')}-${match[1].padStart(2, '0')}`) : parseDateOnly(value.trim())
    }
    const start = parseManual(parts[0])
    const end = parseManual(parts[1])
    if (start && end && start <= end) {
      onChange(dateOnlyValue(start), dateOnlyValue(end))
      setMonth(new Date(start.getFullYear(), start.getMonth(), 1))
      setDraft(null)
      setOpen(false)
    }
  }

  return <div className="blog-date-picker">
    <div className="blog-date-picker__field">
      <input aria-label={labels.date} onBlur={commitDraft} onChange={(event) => setDraft(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') { commitDraft(); setOpen(false) } }} placeholder="DD/MM/YYYY - DD/MM/YYYY" type="text" value={inputValue} />
      <button aria-expanded={open} aria-label={labels.date} className="blog-date-picker__trigger" onClick={() => setOpen((value) => !value)} type="button"><Icon ariaHidden name="calendar" size={18} /></button>
    </div>
    {open ? <div className="blog-date-picker__popover">
      <DayPicker
        className="blog-date-picker__daypicker"
        locale={locale === 'es' ? es : locale === 'pt' ? pt : enUS}
        mode="range"
        month={month}
        onMonthChange={setMonth}
        onSelect={(range) => {
          const start = range?.from ? dateOnlyValue(range.from) : ''
          const end = range?.to ? dateOnlyValue(range.to) : ''
          onChange(start, end)
          setDraft(null)
          if (start && end) setOpen(false)
        }}
        selected={selected}
        showOutsideDays
        weekStartsOn={1}
      />
      <p aria-live="polite" className="blog-date-picker__hint">{selected?.from && !selected.to ? labels.endHint : labels.startHint}</p>
      {from || to ? <button className="blog-date-picker__clear" onClick={() => { onChange('', ''); setDraft(null) }} type="button">{labels.clear}</button> : null}
    </div> : null}
  </div>
}
const COPY: Record<string, { search: string; filters: string; category: string; date: string; allYears: string; contactHeading: string; contactCta: string; empty: string; loading: string; pagination: string; previous: string; next: string }> = {
  en: { search: 'Search', filters: 'Filters', category: 'Category', date: 'By date', allYears: 'Select', contactHeading: 'Get in touch with Best Doctors Insurance', contactCta: 'Send a message', empty: 'No articles found.', loading: 'Loading articles...', pagination: 'Pagination', previous: '<<', next: '>>' },
  es: { search: 'Buscar', filters: 'Filtros', category: 'Categoría', date: 'Por fecha', allYears: 'Seleccionar', contactHeading: 'Ponte en contacto con Best Doctors Insurance', contactCta: 'Enviar un mensaje', empty: 'No se encontraron artículos.', loading: 'Cargando artículos...', pagination: 'Paginación', previous: '<<', next: '>>' },
  pt: { search: 'Pesquisar', filters: 'Filtros', category: 'Categoria', date: 'Por data', allYears: 'Selecionar', contactHeading: 'Entre em contato com a Best Doctors Insurance', contactCta: 'Enviar mensagem', empty: 'Nenhum artigo encontrado.', loading: 'Carregando artigos...', pagination: 'Paginação', previous: '<<', next: '>>' },
}

/** Real listing — Hero (separate page-component) + sidebar (search, category filters, contact
 * box) + card grid + pagination, all backed by /api/site-blog (real published posts, no more
 * hand-curated `content.posts` array). Clicking a card doesn't navigate away — it sets `?post=` on
 * this same page and swaps to <BlogPostDetail automatic /> in place, same query-param-driven
 * pattern already used for /home/search-results, so no new page route was needed. */
export default function BlogListingSection({ content, settings, locale, site }: ExperienceComponentProps) {
  const p = { ...settings, ...content }
  const background = text(p.background)
  const searchParams = useSearchParams()
  const activePost = searchParams?.get('post') ?? ''
  const copy = COPY[locale] ?? COPY.en
  const pickerLabels = {
    date: locale === 'es' ? 'Rango de fechas' : locale === 'pt' ? 'Intervalo de datas' : 'Date range',
    clear: locale === 'es' ? 'Limpiar filtros' : locale === 'pt' ? 'Limpar filtros' : 'Clear filters',
    startHint: locale === 'es' ? 'Selecciona la fecha de inicio' : locale === 'pt' ? 'Selecione a data inicial' : 'Select a start date',
    endHint: locale === 'es' ? 'Ahora selecciona la fecha final' : locale === 'pt' ? 'Agora selecione a data final' : 'Now select an end date',
    weekdays: Array.from({ length: 7 }, (_, index) => new Intl.DateTimeFormat(locale, { weekday: 'short' }).format(new Date(2021, 7, 2 + index))),
  }
  const dateLabels = locale === 'es' ? { date: 'Fecha y hora', from: 'Desde', to: 'Hasta', clear: 'Limpiar filtros' }
    : locale === 'pt' ? { date: 'Data e hora', from: 'De', to: 'Até', clear: 'Limpar filtros' }
      : { date: 'Date and time', from: 'From', to: 'To', clear: 'Clear filters' }
  const sidebarToggleLabels = locale === 'es' ? { hide: 'Ocultar panel de filtros', show: 'Mostrar panel de filtros' }
    : locale === 'pt' ? { hide: 'Ocultar painel de filtros', show: 'Mostrar painel de filtros' }
      : { hide: 'Hide filter sidebar', show: 'Show filter sidebar' }
  const contactHref = resolveExperienceLink({ url: `/${site.slug || 'home'}/support`, locale, fallbackSite: site.slug, localizedRoutes: site.localizedRoutes }).href
  const contactCTA = resolveCTA(p.contactCTA === undefined ? { label: copy.contactCta, href: contactHref, variant: 'primary' } : p.contactCTA as CTAContent | null, locale, site)
  const showContact = p.showContact !== false
  const showFilters = p.showFilters !== false

  const [query, setQuery] = useState(searchParams?.get('q') ?? '')
  const [category, setCategory] = useState(searchParams?.get('category') ?? '')
  const [dateFrom, setDateFrom] = useState(dateInputValue(searchParams?.get('from')))
  const [dateTo, setDateTo] = useState(dateInputValue(searchParams?.get('to')))
  const [sidebarVisible, setSidebarVisible] = useState(true)
  const [page, setPage] = useState(Number(searchParams?.get('page')) || 1)
  const [data, setData] = useState<ApiResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const filtersVisible = showFilters && sidebarVisible
  const hasSidebar = filtersVisible || showContact

  useEffect(() => {
    if (activePost) return
    setLoading(true)
    const timer = setTimeout(() => {
      const params = new URLSearchParams({ app: site.slug || 'home', locale, page: String(page) })
      if (query.trim()) params.set('q', query.trim())
      if (category) params.set('category', category)
      if (dateFrom && Number.isFinite(new Date(dateFrom).getTime())) params.set('from', new Date(dateFrom).toISOString())
      if (dateTo && Number.isFinite(new Date(dateTo).getTime())) params.set('to', new Date(dateTo).toISOString())
      fetch(`/api/site-blog?${params.toString()}`)
        .then((res) => res.json())
        .then((json) => setData(json))
        .catch(() => setData({ posts: [], page: 1, totalPages: 1, totalDocs: 0, categories: [], years: [] }))
        .finally(() => setLoading(false))
    }, 250)
    return () => clearTimeout(timer)
  }, [query, category, dateFrom, dateTo, page, locale, activePost, site.slug])

  if (activePost) {
    return <BlogPostDetail content={{ automatic: true, slug: activePost }} key={activePost} settings={{}} locale={locale} site={site} />
  }

  return (
    <section className={`section${background && background !== 'white' ? ` section--${background}` : ''} blog-listing`}>
      <div className={`section-container blog-listing__layout${hasSidebar ? ' has-sidebar' : ' sidebar-hidden'}`}>
        {showFilters ? <button aria-controls="blog-listing-filters" aria-expanded={filtersVisible} aria-label={filtersVisible ? sidebarToggleLabels.hide : sidebarToggleLabels.show} className="blog-listing__sidebar-toggle" onClick={() => setSidebarVisible((visible) => !visible)} type="button">
          <span className="blog-listing__toggle-label">{sidebarToggleLabels.show}</span>
          <span aria-hidden="true" className="blog-listing__toggle-switch"><i /></span>
        </button> : null}
        <div className="blog-listing__content">
        {hasSidebar ? <aside className="blog-listing__sidebar" id="blog-listing-sidebar">
          {filtersVisible ? <>
          <label className="blog-listing__search">
            <Icon ariaHidden name="search" size={16} />
            <input aria-label={copy.search} onChange={(e) => { setQuery(e.target.value); setPage(1) }} placeholder={copy.search} type="search" value={query} />
          </label>
          <div className="blog-listing__filters" id="blog-listing-filters">
            <h3><Icon ariaHidden name="sliders-horizontal" size={18} /> {copy.filters}</h3>
            <p className="blog-listing__filters-label">{copy.category}</p>
            <div className="blog-listing__categories">
              {(data?.categories ?? []).map((c) => (
                <button
                  aria-pressed={c.slug === category}
                  className={c.slug === category ? 'is-active' : ''}
                  key={c.slug}
                  onClick={() => { setCategory(c.slug === category ? '' : c.slug); setPage(1) }}
                  type="button"
                >
                  {c.name}
                </button>
              ))}
            </div>
            <div className="blog-listing__date-filter">
              <span>{pickerLabels.date}</span>
              <BlogDateRangePicker
                from={dateFrom.slice(0, 10)}
                labels={pickerLabels}
                locale={locale}
                onChange={(from, to) => { setDateFrom(from ? `${from}T00:00` : ''); setDateTo(to ? `${to}T23:59` : ''); setPage(1) }}
                to={dateTo.slice(0, 10)}
              />
            </div>
            {(query || category || dateFrom || dateTo) ? <button className="blog-listing__clear-filters" onClick={() => { setQuery(''); setCategory(''); setDateFrom(''); setDateTo(''); setPage(1) }} type="button">{dateLabels.clear}</button> : null}
          </div>
          </> : null}
          {showContact ? <div className="blog-listing__contact">
            <p data-editor-field="contactHeading">{p.contactHeading === undefined ? copy.contactHeading : text(p.contactHeading)}</p>
            {contactCTA ? <span data-editor-field="contactCTA"><Button href={contactCTA.href} icon={contactCTA.showIcon ? contactCTA.icon || 'chevron-right' : undefined} iconPosition={contactCTA.iconPosition ?? 'right'} label={contactCTA.label} target={contactCTA.target} variant={contactCTA.variant ?? 'primary'} /></span> : null}
            {asMediaURL(p.contactImage) ? <img alt={asMediaAlt(p.contactImage)} data-editor-field="contactImage" loading="lazy" src={asMediaURL(p.contactImage)} /> : null}
          </div> : null}
        </aside> : null}

        <div className="blog-listing__main">
          {p.showHeading !== false && text(p.heading) ? <SectionHeading description={text(p.description)} descriptionColor={designTextColor(p.descriptionColor)} eyebrow={text(p.eyebrow)} highlight={text(p.headingHighlight)} highlightColor={designTextColor(p.headingHighlightColor)} title={text(p.heading)} titleColor={designTextColor(p.headingColor)} /> : null}
          {loading ? <p aria-live="polite" className="blog-listing__empty" role="status">{copy.loading}</p> : !data || data.posts.length === 0 ? (
            <p className="blog-listing__empty">{copy.empty}</p>
          ) : (
            <>
              <div className={`blog-listing__grid ${hasSidebar ? 'blog-listing__grid--sidebar' : 'blog-listing__grid--wide'}`}>
                {data.posts.map((post) => (
                  <BlogPostCard
                    category={post.categories[0]?.name}
                    description={post.excerpt}
                    href={`?post=${encodeURIComponent(post.slug)}${locale === 'en' ? '' : `&locale=${locale}`}`}
                    imageAlt={post.title}
                    imageUrl={post.coverImageUrl}
                    key={post.slug}
                    publishedAt={post.publishedAt ? new Date(post.publishedAt).toLocaleDateString(locale, { year: 'numeric', month: 'long', day: 'numeric' }) : undefined}
                    title={post.title}
                  />
                ))}
              </div>
              {data.totalPages > 1 ? (
                <nav aria-label={copy.pagination} className="blog-listing__pagination">
                  {page > 1 ? <button aria-label="Previous page" onClick={() => setPage((current) => current - 1)} type="button">{copy.previous}</button> : null}
                  {Array.from({ length: data.totalPages }, (_, i) => i + 1).map((n) => (
                    <button aria-current={n === page ? 'page' : undefined} className={n === page ? 'is-active' : ''} key={n} onClick={() => setPage(n)} type="button">{n}</button>
                  ))}
                  {page < data.totalPages ? <button aria-label="Next page" onClick={() => setPage((current) => current + 1)} type="button">{copy.next}</button> : null}
                </nav>
              ) : null}
            </>
          )}
        </div>
        </div>
      </div>
    </section>
  )
}
