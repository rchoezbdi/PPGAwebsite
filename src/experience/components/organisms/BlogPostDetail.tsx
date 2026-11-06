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
import BlogShareLinks from '../molecules/BlogShareLinks'


function ArticleTitle({ children, style }: { children: string; style?: BlogTitleStyle | null }) {
  const color = style?.color ? designTextColor(`color.${style.color}`) : undefined
  const classes = ['blog-detail__title', style?.size ? `blog-detail__title--${style.size}` : '', style?.align ? `blog-detail__title--${style.align}` : ''].filter(Boolean).join(' ')
  return <h1 className={`heading ${classes}`} style={color ? { color } : undefined}>{children}</h1>
}
const BACK_LABEL: Record<string, string> = { en: 'Back to Blog', es: 'Volver al Blog', pt: 'Voltar ao Blog' }

type AutomaticPost = { title: string; excerpt: string; coverImageUrl?: string; imageAlt?: string; publishedAt?: string; author?: string; categories: Array<{ name: string; slug: string }>; contentHtml: string; titleStyle?: BlogTitleStyle | null; coverStyle?: BlogCoverStyle | null; visualContent?: Array<{ code: string; content: Record<string, unknown>; settings: Record<string, unknown>; instanceId: string }> }

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

  useEffect(() => {
    if (!automatic || !slug) return
    setLoading(true)
    setNotFound(false)
    fetch(`/api/site-blog/${encodeURIComponent(slug)}?${new URLSearchParams({ app: site.slug || 'home', locale })}`)
      .then((res) => { if (!res.ok) throw new Error('not found'); return res.json() })
      .then((data) => setPost(data))
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false))
  }, [automatic, slug, locale, site.slug])

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
    const articleContent = withoutRepeatedCover(post.visualContent ?? [], post.coverImageUrl)
    return (
      <section className={className}>
        <div className="section-container blog-detail__container">
          <BlogShareLinks locale={locale} title={post.title} />
          {(post.categories[0]?.name || post.publishedAt || post.author) ? (
            <div className="blog-detail__meta">
              {post.categories[0]?.name ? <Label variant="category">{post.categories[0].name}</Label> : null}
              {post.publishedAt ? <Text className="blog-detail__date" size="sm" tone="muted">{new Date(post.publishedAt).toLocaleDateString(locale, { year: 'numeric', month: 'long', day: 'numeric' })}</Text> : null}
              {post.author ? <Text className="blog-detail__author" size="sm" tone="muted">{post.author}</Text> : null}
            </div>
          ) : null}
          <ArticleTitle style={post.titleStyle}>{post.title}</ArticleTitle>
          {post.excerpt ? <Text className="blog-detail__excerpt" size="lg" tone="muted">{post.excerpt}</Text> : null}
          {post.coverImageUrl ? <div className="blog-detail__cover-wrap" style={coverStyleVars(post.coverStyle)}><Media alt={post.coverStyle?.alt || post.imageAlt || post.title} className="blog-detail__cover" priority src={post.coverImageUrl} /></div> : null}
          {articleContent.length ? <div className="blog-detail__body blog-detail__visual-body">{articleContent.map((section) => {
            const Component = resolveComponent(section.code)
            return <div className="experience-section-item" data-section-code={section.code} key={section.instanceId}><Component content={{ ...section.content, localePaths: site.localizedRoutes ?? {} }} instanceId={section.instanceId} locale={locale} settings={section.settings} site={site} /></div>
          })}</div> : <div className="blog-detail__body" dangerouslySetInnerHTML={{ __html: post.contentHtml }} />}
          <Link className="blog-detail__back" href={backHref}>{backLabel}</Link>
        </div>
      </section>
    )
  }

  const body = text(p.content) || text(p.description)
  const cover = asMediaURL(p.coverImage) || text(p.imageUrl)
  const heading = text(p.heading)
  const visualContent = withoutRepeatedCover(Array.isArray(p.visualContent) ? p.visualContent as Array<{ code: string; content: Record<string, unknown>; settings: Record<string, unknown>; instanceId: string }> : [], cover)

  return (
    <section className={className}>
      <div className="section-container blog-detail__container">
        <BlogShareLinks locale={locale} title={heading} />
        {(text(p.category) || text(p.publishedAt) || text(p.author)) ? (
          <div className="blog-detail__meta">
            {text(p.category) ? <Label variant="category">{text(p.category)}</Label> : null}
            {text(p.publishedAt) ? <Text className="blog-detail__date" size="sm" tone="muted">{text(p.publishedAt)}</Text> : null}
            {text(p.author) ? <Text className="blog-detail__author" size="sm" tone="muted">{text(p.author)}</Text> : null}
          </div>
        ) : null}
        <ArticleTitle style={p.titleStyle as BlogTitleStyle | null | undefined}>{heading}</ArticleTitle>
        {text(p.description) ? <Text className="blog-detail__excerpt" size="lg" tone="muted">{text(p.description)}</Text> : null}
        {cover ? <div className="blog-detail__cover-wrap" style={coverStyleVars(p.coverStyle as BlogCoverStyle | null | undefined)}><Media alt={(p.coverStyle as BlogCoverStyle | undefined)?.alt || text(p.imageAlt) || heading} className="blog-detail__cover" priority src={cover} /></div> : null}
        <div className={`blog-detail__body${visualContent.length ? ' blog-detail__visual-body' : ''}`}>
          {visualContent.length ? visualContent.map((section) => {
            const Component = resolveComponent(section.code)
            return <div className="experience-section-item" data-section-code={section.code} key={section.instanceId}><Component content={section.content} instanceId={section.instanceId} locale={locale} settings={section.settings} site={site} /></div>
          }) : body.split(/\n{2,}/).filter(Boolean).map((paragraph, index) => (
            <p key={index}>{paragraph.split('\n').flatMap((line, lineIndex) => (lineIndex === 0 ? [line] : [<br key={lineIndex} />, line]))}</p>
          ))}
        </div>
        {backHref ? <Link className="blog-detail__back" href={backHref}>{text(p.backLabel) || 'Back to Blog'}</Link> : null}
      </div>
    </section>
  )
}
