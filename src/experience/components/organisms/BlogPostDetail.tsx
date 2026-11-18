'use client'

import { useEffect, useState } from 'react'
import Heading from '../atoms/Heading'
import Label from '../atoms/Label'
import Link from '../atoms/Link'
import Media from '../atoms/Media'
import Text from '../atoms/Text'
import { asMediaURL, designTextColor, text } from '../shared'
import type { BlogTitleStyle } from '@/lib/blogTitleStyle'
import { coverStyleVars, type BlogCoverStyle } from '@/lib/blogCoverStyle'
import type { ExperienceComponentProps } from '@/experience/registry/componentRegistry'
import { resolveExperienceLink } from '@/experience/navigation/resolver'
import { resolveComponent } from '@/experience/registry/componentRegistry'
import BlogPostCard from '../molecules/BlogPostCard'
import BlogShareLinks from '../molecules/BlogShareLinks'
import { useSetBlogArticleHero } from '../BlogArticleHeroContext'


function ArticleTitle({ children, style }: { children: string; style?: BlogTitleStyle | null }) {
  const color = style?.color ? designTextColor(`color.${style.color}`) : undefined
  const classes = ['blog-detail__title', style?.size ? `blog-detail__title--${style.size}` : '', style?.align ? `blog-detail__title--${style.align}` : ''].filter(Boolean).join(' ')
  return <h1 className={`heading ${classes}`} style={color ? { color } : undefined}>{children}</h1>
}
const BACK_LABEL: Record<string, string> = { en: 'Back to Blog', es: 'Volver al Blog', pt: 'Voltar ao Blog' }

type AutomaticPost = { title: string; slug: string; excerpt: string; coverImageUrl?: string; imageAlt?: string; publishedAt?: string; author?: string; categories: Array<{ name: string; slug: string }>; contentHtml: string; titleStyle?: BlogTitleStyle | null; coverStyle?: BlogCoverStyle | null; visualContent?: Array<{ code: string; content: Record<string, unknown>; settings: Record<string, unknown>; instanceId: string }> }
type RelatedPost = { title: string; slug: string; excerpt: string; coverImageUrl?: string; publishedAt?: string; categories: Array<{ name: string; slug: string }> }

const RELATED_COPY: Record<string, { heading: string; error: string }> = {
  en: { heading: 'Related Articles', error: 'Related articles could not be loaded.' },
  es: { heading: 'Artículos relacionados', error: 'No se pudieron cargar los artículos relacionados.' },
  pt: { heading: 'Artigos relacionados', error: 'Não foi possível carregar os artigos relacionados.' },
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value))
}

function isRelatedPost(value: unknown): value is RelatedPost {
  if (!isRecord(value) || typeof value.title !== 'string' || typeof value.slug !== 'string' || typeof value.excerpt !== 'string' || !Array.isArray(value.categories)) return false
  return value.categories.every((category) => isRecord(category) && typeof category.name === 'string' && typeof category.slug === 'string')
    && (value.coverImageUrl === undefined || typeof value.coverImageUrl === 'string')
    && (value.publishedAt === undefined || typeof value.publishedAt === 'string')
}

async function fetchRelatedPosts(app: string, locale: string, category?: string): Promise<RelatedPost[]> {
  const params = new URLSearchParams({ app, locale, page: '1' })
  if (category) params.set('category', category)
  const response = await fetch(`/api/site-blog?${params}`)
  if (!response.ok) throw new Error('Failed to load related articles')
  const data: unknown = await response.json()
  if (!isRecord(data) || !Array.isArray(data.posts)) throw new Error('Invalid related articles response')
  const posts = data.posts.filter(isRelatedPost)
  if (posts.length !== data.posts.length) throw new Error('Invalid related articles response')
  return posts
}

function RelatedArticles({ error, locale, posts }: { error: boolean; locale: string; posts: RelatedPost[] }) {
  const copy = RELATED_COPY[locale] ?? RELATED_COPY.en
  return (
    <section aria-labelledby="blog-detail-related-heading" className="blog-detail__related">
      <div className="section-container blog-detail__related-container">
        <h2 className="blog-detail__related-heading" id="blog-detail-related-heading">{copy.heading}</h2>
        {posts.length ? <div className="blog-listing__grid blog-listing__grid--wide blog-detail__related-grid">
          {posts.map((post) => (
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
        </div> : null}
        {error ? <p aria-live="polite" className="blog-detail__related-error" role="status">{copy.error}</p> : null}
      </div>
    </section>
  )
}

function withoutRepeatedCover(content: Array<{ code: string; content: Record<string, unknown>; settings: Record<string, unknown>; instanceId: string }>, coverURL?: string) {
  if (!coverURL) return content
  const firstImageIndex = content.findIndex((section) => section.code === 'image')
  if (firstImageIndex < 0) return content
  const firstImage = content[firstImageIndex].content
  const imageURL = asMediaURL(firstImage.media) || text(firstImage.url)
  return imageURL && imageURL === coverURL ? content.filter((_, index) => index !== firstImageIndex) : content
}

/** Two modes: manual (existing behavior, content-driven — a single hand-curated preview post) and
 * automatic (content.automatic === true), which fetches a real published post by slug from
 * /api/site-blog/[slug] — real Lexical content converted to real HTML server-side, not a plain-text
 * excerpt standing in for the body. BlogListingSection switches into this mode when the page URL
 * has ?post=<slug>, so a reader can actually open one of the 115 seeded articles. */
export default function BlogPostDetail({ content, settings, locale, site }: ExperienceComponentProps) {
  const p = { ...settings, ...content }
  const automatic = Boolean(p.automatic)
  const slug = text(p.slug)
  const [post, setPost] = useState<AutomaticPost | null>(null)
  const [loading, setLoading] = useState(automatic)
  const [notFound, setNotFound] = useState(false)
  const [relatedPosts, setRelatedPosts] = useState<RelatedPost[]>([])
  const [relatedLoading, setRelatedLoading] = useState(false)
  const [relatedError, setRelatedError] = useState(false)
  const setBlogArticleHero = useSetBlogArticleHero()

  useEffect(() => {
    if (!automatic || !slug) return
    let active = true
    setLoading(true)
    setNotFound(false)
    setPost(null)
    setBlogArticleHero?.(null)
    fetch(`/api/site-blog/${encodeURIComponent(slug)}?${new URLSearchParams({ app: site.slug || 'home', locale })}`)
      .then((res) => { if (!res.ok) throw new Error('not found'); return res.json() })
      .then((data) => {
        if (!active) return
        setPost(data)
        if (typeof data.title === 'string') {
          setBlogArticleHero?.({
            title: data.title,
            category: Array.isArray(data.categories) ? data.categories[0]?.name : undefined,
          })
        }
      })
      .catch(() => {
        if (!active) return
        setNotFound(true)
        setBlogArticleHero?.(null)
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
      setBlogArticleHero?.(null)
    }
  }, [automatic, slug, locale, site.slug, setBlogArticleHero])

  const articleSlug = post?.slug ?? ''
  const relatedCategory = post?.categories[0]?.slug ?? ''
  useEffect(() => {
    if (!automatic || !articleSlug) {
      setRelatedPosts([])
      setRelatedError(false)
      setRelatedLoading(false)
      return
    }

    let active = true
    setRelatedLoading(true)
    setRelatedError(false)
    setRelatedPosts([])

    const loadRelated = async () => {
      try {
        const categoryPosts = await fetchRelatedPosts(site.slug || 'home', locale, relatedCategory)
        let related = categoryPosts.filter((item) => item.slug !== articleSlug).slice(0, 3)
        if (related.length < 3 && relatedCategory) {
          try {
            const allPosts = await fetchRelatedPosts(site.slug || 'home', locale)
            const excluded = new Set([articleSlug, ...related.map((item) => item.slug)])
            related = [...related, ...allPosts.filter((item) => !excluded.has(item.slug)).slice(0, 3 - related.length)]
          } catch {
            if (active) {
              setRelatedPosts(related)
              setRelatedError(true)
            }
            return
          }
        }
        if (active) setRelatedPosts(related)
      } catch {
        if (active) setRelatedError(true)
      } finally {
        if (active) setRelatedLoading(false)
      }
    }

    void loadRelated()
    return () => { active = false }
  }, [automatic, articleSlug, relatedCategory, locale, site.slug])

  const background = text(p.background)
  const className = `section${background && background !== 'white' ? ` section--${background}` : ''} blog-detail`
  const backLabel = BACK_LABEL[locale] ?? BACK_LABEL.en
  // Same page, just drop ?post= to go back to the listing — no separate route to navigate to.
  const backHref = automatic ? `?${locale === 'en' ? '' : `locale=${locale}`}` : resolveExperienceLink({ url: text(p.backHref), locale, fallbackSite: site.slug, localizedRoutes: site.localizedRoutes }).href ?? ''

  if (automatic) {
    if (loading) return <section className={className}><div className="section-container blog-detail__container"><p>…</p></div></section>
    if (notFound || !post) return (
      <section className={className}>
        <div className="section-container blog-detail__container">
          <p>{locale === 'es' ? 'Artículo no encontrado.' : locale === 'pt' ? 'Artigo não encontrado.' : 'Article not found.'}</p>
          <Link className="blog-detail__back" href={backHref}>{backLabel}</Link>
        </div>
      </section>
    )
    const showCoverAsHero = post.coverStyle?.showAsHero === true
    const articleContent = showCoverAsHero
      ? withoutRepeatedCover(post.visualContent ?? [], post.coverImageUrl)
      : post.visualContent ?? []
    const articleTitleIsInHero = setBlogArticleHero !== undefined
    return (
      <section className={className}>
        <div className="section-container blog-detail__container blog-detail__container--article">
          <BlogShareLinks locale={locale} title={post.title} />
          <article className="blog-detail__article">
            {(articleTitleIsInHero ? post.publishedAt || post.author : post.categories[0]?.name || post.publishedAt || post.author) ? (
              <div className="blog-detail__meta">
                {!articleTitleIsInHero && post.categories[0]?.name ? <Label variant="category">{post.categories[0].name}</Label> : null}
                {post.publishedAt ? <Text className="blog-detail__date" size="sm" tone="muted">{new Date(post.publishedAt).toLocaleDateString(locale, { year: 'numeric', month: 'long', day: 'numeric' })}</Text> : null}
                {post.author ? <Text className="blog-detail__author" size="sm" tone="muted">{post.author}</Text> : null}
              </div>
            ) : null}
            {!articleTitleIsInHero ? <ArticleTitle style={post.titleStyle}>{post.title}</ArticleTitle> : null}
            {post.excerpt ? <Text className="blog-detail__excerpt" size="lg" tone="muted">{post.excerpt}</Text> : null}
            {showCoverAsHero && post.coverImageUrl ? <div className="blog-detail__cover-wrap" style={coverStyleVars(post.coverStyle)}><Media alt={post.coverStyle?.alt || post.imageAlt || post.title} className="blog-detail__cover" priority src={post.coverImageUrl} /></div> : null}
            {articleContent.length ? <div className="blog-detail__body blog-detail__visual-body">{articleContent.map((section) => {
              const Component = resolveComponent(section.code)
              return <div className="experience-section-item" data-section-code={section.code} key={section.instanceId}><Component content={{ ...section.content, localePaths: site.localizedRoutes ?? {} }} instanceId={section.instanceId} locale={locale} settings={section.settings} site={site} /></div>
            })}</div> : <div className="blog-detail__body" dangerouslySetInnerHTML={{ __html: post.contentHtml }} />}
            <Link className="blog-detail__back" href={backHref}>{backLabel}</Link>
          </article>
          <BlogShareLinks locale={locale} title={post.title} variant="footer" />
        </div>
        {!relatedLoading && (relatedPosts.length > 0 || relatedError) ? <RelatedArticles error={relatedError} locale={locale} posts={relatedPosts} /> : null}
      </section>
    )
  }

  const body = text(p.content) || text(p.description)
  const cover = asMediaURL(p.coverImage) || text(p.imageUrl)
  const heading = text(p.heading)
  const coverStyle = p.coverStyle as BlogCoverStyle | null | undefined
  const showCoverAsHero = coverStyle?.showAsHero === true
  const sourceVisualContent = Array.isArray(p.visualContent) ? p.visualContent as Array<{ code: string; content: Record<string, unknown>; settings: Record<string, unknown>; instanceId: string }> : []
  const visualContent = showCoverAsHero ? withoutRepeatedCover(sourceVisualContent, cover) : sourceVisualContent

  return (
    <section className={className}>
      <div className="section-container blog-detail__container blog-detail__container--article">
        <BlogShareLinks locale={locale} title={heading} />
        <article className="blog-detail__article">
          {(text(p.category) || text(p.publishedAt) || text(p.author)) ? (
            <div className="blog-detail__meta">
              {text(p.category) ? <Label variant="category">{text(p.category)}</Label> : null}
              {text(p.publishedAt) ? <Text className="blog-detail__date" size="sm" tone="muted">{text(p.publishedAt)}</Text> : null}
              {text(p.author) ? <Text className="blog-detail__author" size="sm" tone="muted">{text(p.author)}</Text> : null}
            </div>
          ) : null}
          <ArticleTitle style={p.titleStyle as BlogTitleStyle | null | undefined}>{heading}</ArticleTitle>
          {text(p.description) ? <Text className="blog-detail__excerpt" size="lg" tone="muted">{text(p.description)}</Text> : null}
          {showCoverAsHero && cover ? <div className="blog-detail__cover-wrap" style={coverStyleVars(coverStyle)}><Media alt={coverStyle?.alt || text(p.imageAlt) || heading} className="blog-detail__cover" priority src={cover} /></div> : null}
          <div className={`blog-detail__body${visualContent.length ? ' blog-detail__visual-body' : ''}`}>
            {visualContent.length ? visualContent.map((section) => {
              const Component = resolveComponent(section.code)
              return <div className="experience-section-item" data-section-code={section.code} key={section.instanceId}><Component content={section.content} instanceId={section.instanceId} locale={locale} settings={section.settings} site={site} /></div>
            }) : body.split(/\n{2,}/).filter(Boolean).map((paragraph, index) => (
              <p key={index}>{paragraph.split('\n').flatMap((line, lineIndex) => (lineIndex === 0 ? [line] : [<br key={lineIndex} />, line]))}</p>
            ))}
          </div>
          {backHref ? <Link className="blog-detail__back" href={backHref}>{text(p.backLabel) || 'Back to Blog'}</Link> : null}
        </article>
      </div>
    </section>
  )
}
