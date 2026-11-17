/* @vitest-environment jsdom */

import { render, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { ExperienceSite } from '@/contracts/site'
import { BlogArticleHeroProvider } from '@/experience/components/BlogArticleHeroContext'
import Hero from '@/experience/components/organisms/Hero'
import BlogPostDetail from '@/experience/components/organisms/BlogPostDetail'

const site: ExperienceSite = { name: 'PPGA', slug: 'ppga', supportedLocales: ['en', 'es', 'pt'] }
const localizedArticles = [
  { locale: 'en', category: 'News', title: 'English article' },
  { locale: 'es', category: 'Noticias', title: 'Artículo en español' },
  { locale: 'pt', category: 'Notícias', title: 'Artigo em português' },
]

describe('blog article hero', () => {
  afterEach(() => vi.unstubAllGlobals())

  it.each(localizedArticles)('shows the $locale article title and category in its page hero', async ({ locale, category, title }) => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        title,
        excerpt: 'Article excerpt',
        categories: [{ name: category, slug: 'news' }],
        contentHtml: '<p>Article body</p>',
      }),
    }))

    const { container } = render(
      <BlogArticleHeroProvider>
        <Hero
          content={{ blogArticleHeadingHero: true, description: 'Generic listing description', eyebrow: 'Blog', heading: 'News from Best Doctors Insurance' }}
          locale={locale}
          settings={{}}
          site={site}
        />
        <BlogPostDetail content={{ automatic: true, slug: 'article' }} locale={locale} settings={{}} site={site} />
      </BlogArticleHeroProvider>,
    )

    await waitFor(() => {
      const heading = container.querySelector('.hero-carousel h1')
      expect(heading?.querySelector('.hero-slide__copy-desktop')?.textContent).toBe(title)
      expect(heading?.querySelector('.hero-slide__copy-tablet')?.textContent).toBe(title)
      expect(heading?.querySelector('.hero-slide__copy-mobile')?.textContent).toBe(title)
    })
    expect(container.querySelector('.hero-carousel .hero-slide__field-wrap[data-editor-field="eyebrow"]')?.textContent).toContain(category)
    expect(container.querySelector('.hero-carousel')?.textContent).not.toContain('Generic listing description')
    expect(container.querySelector('.blog-detail__title')).toBeNull()
    const shareLinks = container.querySelector('.blog-share-links')
    expect(shareLinks?.parentElement?.classList.contains('blog-detail__container--article')).toBe(true)
    expect(shareLinks?.nextElementSibling?.classList.contains('blog-detail__article')).toBe(true)
  })
})
