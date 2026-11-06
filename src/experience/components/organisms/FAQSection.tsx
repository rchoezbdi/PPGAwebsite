'use client'

import React, { useEffect, useRef, useState, useCallback } from 'react'
import { asMediaURL, designTextColor, text } from '../shared'
import type { ExperienceComponentProps } from '@/experience/registry/componentRegistry'

export interface FAQItem {
  id?: string
  question: string
  answer?: string
  answerHtml?: string
}

export interface FAQCategory {
  id: string
  title: string
  icon?: string | Record<string, unknown>
  items: FAQItem[]
}

export default function FAQSection({ content, settings }: ExperienceComponentProps) {
  const p = { ...settings, ...content }
  const categories = (Array.isArray(p.categories) ? p.categories : []) as FAQCategory[]
  const flatItems = (Array.isArray(p.items) ? p.items : []) as FAQItem[]
  const iconValue = p.icon
  const iconUrl = asMediaURL(iconValue)
  const iconMediaId = iconValue && typeof iconValue === 'object' && 'id' in iconValue
    ? String((iconValue as Record<string, unknown>).id ?? '')
    : ''
  const [resolvedIconUrl, setResolvedIconUrl] = useState(iconUrl)
  const recoveredIconId = useRef<string | null>(null)

  useEffect(() => {
    setResolvedIconUrl(iconUrl)
    recoveredIconId.current = null
  }, [iconMediaId, iconUrl])

  const recoverIconURL = async () => {
    if (!iconMediaId || recoveredIconId.current === iconMediaId) return
    recoveredIconId.current = iconMediaId
    try {
      const response = await fetch(`/api/media/${encodeURIComponent(iconMediaId)}?depth=0`)
      if (!response.ok) return
      const media: unknown = await response.json()
      const currentURL = asMediaURL(media)
      if (currentURL && currentURL !== iconUrl) setResolvedIconUrl(currentURL)
    } catch {
      // Keep the editorial URL when the DAM cannot be reached.
    }
  }

  // Active category state for tabs
  const [activeTab, setActiveTab] = useState<string>(categories[0]?.id || '')
  const tabsNavRef = useRef<HTMLDivElement>(null)
  const isDragging = useRef(false)
  const startX = useRef(0)
  const scrollLeft = useRef(0)

  // Scroll to category
  const scrollToCategory = useCallback((id: string) => {
    setActiveTab(id)
    const element = document.getElementById(id)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [])

  // Mouse drag-to-scroll for tabsNav
  const onMouseDown = (e: React.MouseEvent) => {
    if (!tabsNavRef.current) return
    isDragging.current = true
    tabsNavRef.current.classList.add('is-dragging')
    startX.current = e.pageX - tabsNavRef.current.offsetLeft
    scrollLeft.current = tabsNavRef.current.scrollLeft
  }

  const onMouseLeaveOrUp = () => {
    if (!tabsNavRef.current) return
    isDragging.current = false
    tabsNavRef.current.classList.remove('is-dragging')
  }

  const onMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current || !tabsNavRef.current) return
    e.preventDefault()
    const x = e.pageX - tabsNavRef.current.offsetLeft
    const walk = (x - startX.current) * 1.5
    tabsNavRef.current.scrollLeft = scrollLeft.current - walk
  }

  // IntersectionObserver to sync active tab with scroll position
  useEffect(() => {
    if (!categories.length || typeof IntersectionObserver === 'undefined') return
    const syncActiveCategory = () => {
      const lastCategory = categories.at(-1)!
      const documentHeight = document.documentElement.scrollHeight
      if (documentHeight > window.innerHeight && window.scrollY + window.innerHeight >= documentHeight - 2) {
        setActiveTab(lastCategory.id)
        return
      }

      const activationLine = 180
      const currentCategory = categories.reduce((activeCategory, category) => {
        const section = document.getElementById(category.id)
        return section && section.getBoundingClientRect().top <= activationLine ? category : activeCategory
      }, categories[0])
      setActiveTab(currentCategory.id)
    }

    const observerCallback: IntersectionObserverCallback = () => syncActiveCategory()
    const observer = new IntersectionObserver(observerCallback, {
      rootMargin: '-120px 0px -60% 0px',
      threshold: 0.1,
    })

    categories.forEach((cat) => {
      const el = document.getElementById(cat.id)
      if (el) observer.observe(el)
    })

    return () => observer.disconnect()
  }, [categories])

  // Center active tab in scrollable nav
  useEffect(() => {
    if (!tabsNavRef.current || !activeTab) return
    const activeLink = tabsNavRef.current.querySelector(`[data-tab-id="${activeTab}"]`) as HTMLElement | null
    if (activeLink) {
      const container = tabsNavRef.current
      const linkLeft = activeLink.offsetLeft
      const linkWidth = activeLink.offsetWidth
      const containerWidth = container.offsetWidth
      if (typeof container.scrollTo === 'function') {
        container.scrollTo({
          left: linkLeft - containerWidth / 2 + linkWidth / 2,
          behavior: 'smooth',
        })
      }
    }
  }, [activeTab])

  // If categorized FAQ
  if (categories.length > 0) {
    return (
      <section className="faq-main-wrapper">
        {/* Horizontal scrollable category tabs */}
        <div className="faq-tabs-wrapper">
          <div className="faq-tabs-container">
            <div
              className="tabs-nav"
              id="tabsNav"
              onMouseDown={onMouseDown}
              onMouseLeave={onMouseLeaveOrUp}
              onMouseMove={onMouseMove}
              onMouseUp={onMouseLeaveOrUp}
              ref={tabsNavRef}
            >
              {categories.map((cat, idx) => (
                <a
                  className={`tab-link${activeTab === cat.id ? ' active' : ''}`}
                  data-tab-id={cat.id}
                  href={`#${cat.id}`}
                  key={cat.id || idx}
                  onClick={(e) => {
                    e.preventDefault()
                    scrollToCategory(cat.id)
                  }}
                >
                  {cat.title}
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Categories container with 2-column layout */}
        <div className="faq-categories-content">
          {categories.map((cat) => {
            const iconUrl = typeof cat.icon === 'string' ? cat.icon : asMediaURL(cat.icon)
            return (
              <div className="tab-section faq-category-section" id={cat.id} key={cat.id}>
                <div className="faq-category-inner">
                  {/* Left Column: Icon + Category Title */}
                  <div className="faq-category-left">
                    {iconUrl ? (
                      <img alt="" aria-hidden="true" className="faq-category-icon" loading="lazy" src={iconUrl} />
                    ) : null}
                    <h2 className="faq-category-title">{cat.title}</h2>
                  </div>

                  {/* Right Column: Accordion list */}
                  <div className="faq-category-right">
                    <div className="faq-accordion-list">
                      {cat.items.map((item, i) => (
                        <details className="faq-accordion-item" key={item.id || i}>
                          <summary className="faq-accordion-summary">
                            <span className="faq-accordion-question">{item.question}</span>
                            <span aria-hidden="true" className="faq-accordion-icon-wrap">
                              <svg
                                className="faq-accordion-chevron"
                                fill="none"
                                height="18"
                                stroke="currentColor"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2.5"
                                viewBox="0 0 24 24"
                                width="18"
                              >
                                <polyline points="6 9 12 15 18 9" />
                              </svg>
                            </span>
                          </summary>
                          <div className="faq-accordion-content">
                            {item.answerHtml ? (
                              <div
                                className="faq-accordion-body"
                                dangerouslySetInnerHTML={{ __html: item.answerHtml }}
                              />
                            ) : (
                              <div className="faq-accordion-body">
                                <p>{item.answer || 'Contenido de respuesta administrado en Payload.'}</p>
                              </div>
                            )}
                          </div>
                        </details>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </section>
    )
  }

  // Fallback: flat items layout (backward compatible with tests)
  const highlight = text(p.headingHighlight)
  const heading = text(p.heading) || 'Frequently Asked Questions'
  const prefix = highlight && heading.endsWith(highlight) ? heading.slice(0, -highlight.length).trimEnd() : heading
  const icon = resolvedIconUrl

  return (
    <section className={`section faq-section${text(p.variant) === 'editorial' ? ' faq-section--editorial' : ''}${text(p.background) && text(p.background) !== 'white' ? ` section--${text(p.background)}` : ''}`}>
      <div className="section-container">
        {icon ? <img alt="" className="faq-section__icon" loading="lazy" onError={() => { void recoverIconURL() }} src={icon} /> : null}
        <h2 style={designTextColor(p.headingColor) ? { color: designTextColor(p.headingColor) } : undefined}>{highlight ? <>{prefix} <mark style={designTextColor(p.headingHighlightColor) ? { color: designTextColor(p.headingHighlightColor) } : undefined}>{highlight}</mark></> : heading}</h2>
        {text(p.description) ? <p className="section-subtitle">{text(p.description)}</p> : null}
        <div className="faq-list">
          {flatItems.map((item, i) => (
            <details className="faq-item" key={text(item.id) || i}>
              <summary className="faq-summary">
                <span>{text(item.question)}</span>
                <span aria-hidden="true" className="faq-icon">⌄</span>
              </summary>
              <div className="faq-answer">
                <p>{text(item.answer) || 'Contenido de respuesta administrado en Payload.'}</p>
              </div>
            </details>
          ))}
        </div>
      </div>
    </section>
  )
}
