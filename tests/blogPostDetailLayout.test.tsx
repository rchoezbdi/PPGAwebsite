/* @vitest-environment jsdom */

import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import BlogPostDetail from '@/experience/components/organisms/BlogPostDetail'

const site = { name: 'PPGA', slug: 'ppga', supportedLocales: ['en', 'es', 'pt'] }
const coverURL = '/api/media/file/article-cover.jpg'
const article = (showAsHero?: boolean) => ({
  title: 'Article title',
  slug: 'article-title',
  excerpt: 'Article summary',
  coverImageUrl: coverURL,
  categories: [{ name: 'News', slug: 'news' }],
  contentHtml: '',
  visualContent: [{ code: 'image', content: { url: coverURL, alt: 'Article image' }, settings: {}, instanceId: 'body-image' }],
  ...(showAsHero === undefined ? {} : { coverStyle: { showAsHero } }),
})
const relatedPosts = [
  { title: 'Article title', slug: 'article-title', excerpt: 'Current article', categories: [{ name: 'News', slug: 'news' }] },
  ...['related-one', 'related-two', 'related-three'].map((slug) => ({ title: slug, slug, excerpt: 'Related article', categories: [{ name: 'News', slug: 'news' }] })),
]

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

function stubBlogFetch(showAsHero?: boolean) {
  vi.stubGlobal('fetch', vi.fn((input: RequestInfo | URL) => {
    const isListing = String(input).startsWith('/api/site-blog?')
    return Promise.resolve({
      ok: true,
      json: async () => isListing ? { posts: relatedPosts } : article(showAsHero),
    })
  }))
}

describe('blog post detail layout', () => {
  it('hides the cover by default, preserves the body image, and closes with sharing and related articles', async () => {
    stubBlogFetch()
    const { container } = render(<BlogPostDetail content={{ automatic: true, slug: 'article-title' }} locale="en" settings={{}} site={site} />)

    await screen.findByRole('heading', { name: 'Related Articles' })

    expect(container.querySelector('.blog-detail__cover')).toBeNull()
    expect(container.querySelectorAll('.blog-visual-image img')).toHaveLength(1)
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } })
    fireEvent.click(screen.getByRole('button', { name: 'Copy link' }))
    expect(await screen.findByText('Link copied')).not.toBeNull()
    expect(writeText).toHaveBeenCalledWith(window.location.href)
    expect(container.querySelector('.blog-share-footer')?.previousElementSibling).toBe(container.querySelector('.blog-detail__article'))
    expect(container.querySelectorAll('.blog-detail__related-grid .blog-card')).toHaveLength(3)
    expect(container.querySelector('.blog-detail__related')?.previousElementSibling).toBe(container.querySelector('.blog-detail__container--article'))
  })

  it('renders the cover as hero only when explicitly selected and removes its duplicate from the body', async () => {
    stubBlogFetch(true)
    const { container } = render(<BlogPostDetail content={{ automatic: true, slug: 'article-title' }} locale="en" settings={{}} site={site} />)

    await screen.findByRole('heading', { name: 'Related Articles' })

    expect(container.querySelector('.blog-detail__cover')).not.toBeNull()
    expect(container.querySelector('.blog-visual-image img')).toBeNull()
  })
})
