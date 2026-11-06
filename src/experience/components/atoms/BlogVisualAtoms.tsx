'use client'

import type React from 'react'
import { useEffect, useState } from 'react'
import DOMPurify from 'dompurify'
import { asMediaAlt, asMediaURL, designTextColor, text } from '@/experience/components/shared'
import { cornerRadiusCSS } from '@/lib/cornerRadius'
import type { ExperienceComponentProps } from '@/experience/registry/componentRegistry'

function safeRichMarkup(html: string, allowedColors: string[]) {
  const parsed = new DOMParser().parseFromString(html, 'text/html')
  const normalizedColors = allowedColors.map((color) => color.replace(/\s/g, '').toLowerCase())
  parsed.body.querySelectorAll('font[color], font[face]').forEach((font) => {
    const color = font.getAttribute('color') ?? ''
    const family = font.getAttribute('face') ?? ''
    const safe = !normalizedColors.length || normalizedColors.includes(color.replace(/\s/g, '').toLowerCase())
    const span = parsed.createElement('span')
    if (safe && /^(#[\da-f]{3,8}|rgb\(|rgba\(|hsl\(|hsla\(|var\(--[\w-]+\))/i.test(color)) span.style.color = color
    if (/^[\w\s,'"-]{1,100}$/.test(family)) span.style.fontFamily = family
    span.append(...Array.from(font.childNodes))
    font.replaceWith(span)
  })
  parsed.body.querySelectorAll('[style]').forEach((element) => {
    const style = (element as HTMLElement).style
    const color = style.color
    const family = style.fontFamily
    const align = style.textAlign
    element.removeAttribute('style')
    const validColor = !normalizedColors.length || normalizedColors.includes(color.replace(/\s/g, '').toLowerCase())
    if (validColor && /^(#[\da-f]{3,8}|rgb\(|rgba\(|hsl\(|hsla\(|var\(--[\w-]+\))/i.test(color)) (element as HTMLElement).style.color = color
    if (/^[\w\s,'"-]{1,100}$/.test(family)) (element as HTMLElement).style.fontFamily = family
    if (['left', 'right', 'center', 'justify'].includes(align)) (element as HTMLElement).style.textAlign = align
  })
  parsed.body.querySelectorAll('[class]').forEach((element) => {
    const sizes = element.tagName === 'SPAN' ? element.className.split(/\s+/).filter((name) => /^rt-text--(h1|h2|h3|h4)$/.test(name)) : []
    if (sizes.length) element.className = sizes.join(' ')
    else element.removeAttribute('class')
  })
  return DOMPurify.sanitize(parsed.body.innerHTML, {
    ALLOWED_TAGS: ['p', 'h1', 'h2', 'h3', 'h4', 'ul', 'ol', 'li', 'strong', 'b', 'em', 'i', 'u', 'a', 'br', 'blockquote', 'span'],
    ALLOWED_ATTR: ['href', 'rel', 'style', 'class'],
    ALLOW_DATA_ATTR: false,
  })
}

export function RichTextAtom({ content }: ExperienceComponentProps) {
  const html = text(content.content) || text(content.text)
  const tokenColors = Array.isArray(content.tokenColors) ? content.tokenColors.filter((item): item is string => typeof item === 'string') : []
  const [safeHTML, setSafeHTML] = useState('')
  useEffect(() => { setSafeHTML(safeRichMarkup(html, tokenColors)) }, [html, tokenColors.join('|')])
  return <div className="blog-rich-text-preview" dangerouslySetInnerHTML={{ __html: safeHTML }} />
}

export function ImageAtom({ content }: ExperienceComponentProps) {
  const source = asMediaURL(content.media) || asMediaURL(content.image) || text(content.src) || text(content.url)
  if (!source) return null
  const position = text(content.position) || 'center'
  return <figure className="blog-visual-image" style={{ justifyContent: position === 'left' ? 'flex-start' : position === 'right' ? 'flex-end' : 'center' }}>
    <img alt={text(content.alt) || asMediaAlt(content.media) || asMediaAlt(content.image)} src={source} style={{ borderRadius: cornerRadiusCSS(content.borderRadius), aspectRatio: text(content.aspectRatio) !== 'auto' ? text(content.aspectRatio) : undefined, objectFit: text(content.objectFit) === 'contain' || text(content.aspectRatio) === 'auto' || !text(content.aspectRatio) ? 'contain' : 'cover', objectPosition: position }} />
    {text(content.caption) ? <figcaption>{text(content.caption)}</figcaption> : null}
  </figure>
}

const videoEmbedURL = (value: string) => {
  try {
    const url = new URL(value)
    const host = url.hostname.replace(/^www\./, '')
    if (host === 'youtu.be') return `https://www.youtube-nocookie.com/embed/${url.pathname.slice(1)}`
    if (host === 'youtube.com' || host === 'm.youtube.com') {
      const id = url.searchParams.get('v') || /^\/(?:embed|shorts)\/([\w-]{11})/.exec(url.pathname)?.[1]
      return id ? `https://www.youtube-nocookie.com/embed/${id}` : ''
    }
    if (host === 'vimeo.com') {
      const id = /^\/(\d+)/.exec(url.pathname)?.[1]
      return id ? `https://player.vimeo.com/video/${id}` : ''
    }
  } catch { /* not an absolute URL: treated as a file path below */ }
  return ''
}

/** Video atom for articles: a DAM file or path plays natively; YouTube/Vimeo links use a privacy-friendly iframe. */
export function VideoAtom({ content }: ExperienceComponentProps) {
  const source = asMediaURL(content.media) || text(content.src) || text(content.url)
  if (!source) return null
  const title = text(content.title) || 'Video'
  const embed = videoEmbedURL(source)
  if (embed) return <figure className="blog-visual-video"><iframe allow="accelerometer; encrypted-media; picture-in-picture" allowFullScreen loading="lazy" referrerPolicy="strict-origin-when-cross-origin" src={embed} style={{ borderRadius: cornerRadiusCSS(content.borderRadius) }} title={title} /></figure>
  const poster = asMediaURL(content.poster)
  return <figure className="blog-visual-video">
    <video aria-label={title} autoPlay={content.autoplay === true} controls={content.controls !== false} loop={content.loop === true} muted={content.muted === true || content.autoplay === true} playsInline poster={poster || undefined} preload="metadata" src={source} style={{ borderRadius: cornerRadiusCSS(content.borderRadius) }} />
    {text(content.caption) ? <figcaption>{text(content.caption)}</figcaption> : null}
  </figure>
}

const headingLevels = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'] as const
const alignOf = (value: unknown): 'left' | 'center' | 'right' | undefined => {
  const align = text(value)
  return align === 'left' || align === 'center' || align === 'right' ? align : undefined
}

/** Section heading for articles: semantic level + Design System size/color, no free-form styles. */
export function HeadingAtom({ content }: ExperienceComponentProps) {
  const value = text(content.text) || text(content.heading)
  if (!value) return null
  const requested = text(content.level) as (typeof headingLevels)[number]
  const Tag = headingLevels.includes(requested) ? requested : 'h2'
  const color = designTextColor(content.colorToken)
  const align = alignOf(content.align)
  return <Tag className={`blog-visual-heading blog-visual-heading--${Tag}`} style={{ ...(color ? { color } : {}), ...(align ? { textAlign: align } : {}) }}>{value}</Tag>
}

export function DividerAtom({ content }: ExperienceComponentProps) {
  const style = ['solid', 'dashed', 'dotted'].includes(text(content.style)) ? text(content.style) : 'solid'
  const thickness = Math.min(Math.max(Number(content.thickness) || 1, 1), 8)
  const length = Math.min(Math.max(Number(content.length) || 100, 10), 100)
  const color = designTextColor(content.colorToken)
  return <hr className="blog-visual-divider" style={{ borderTopStyle: style as React.CSSProperties['borderTopStyle'], borderTopWidth: thickness, width: `${length}%`, ...(color ? { borderTopColor: color } : {}) }} />
}

export function SpacerAtom({ content }: ExperienceComponentProps) {
  const height = (value: unknown, fallback: number) => `${Math.min(Math.max(Number(value) || fallback, 0), 240)}px`
  const style = { '--spacer-desktop': height(content.desktopHeight, 48), '--spacer-tablet': height(content.tabletHeight, 40), '--spacer-mobile': height(content.mobileHeight, 32) } as React.CSSProperties
  return <div aria-hidden="true" className="blog-visual-spacer" style={style} />
}

const mapsEmbedURL = (value: string) => {
  try {
    const url = new URL(value)
    return url.protocol === 'https:' && url.hostname === 'www.google.com' && url.pathname.startsWith('/maps/embed') ? url.toString() : ''
  } catch { return '' }
}

/** Embed limited to YouTube, Vimeo and Google Maps: any other host is ignored instead of framed. */
export function EmbedAtom({ content }: ExperienceComponentProps) {
  const source = text(content.url) || text(content.src)
  const embed = videoEmbedURL(source) || mapsEmbedURL(source)
  if (!embed) return null
  const ratio = /^\d{1,2}\s*\/\s*\d{1,2}$/.test(text(content.aspectRatio)) ? text(content.aspectRatio) : '16 / 9'
  return <figure className="blog-visual-video"><iframe allow="accelerometer; encrypted-media; picture-in-picture" allowFullScreen loading={content.lazy === false ? 'eager' : 'lazy'} referrerPolicy="strict-origin-when-cross-origin" src={embed} style={{ aspectRatio: ratio, borderRadius: cornerRadiusCSS(content.borderRadius) }} title={text(content.title) || 'Contenido embebido'} /></figure>
}

/** Positions an inline block (badge, link, button) at the start, center or end of the article column. */
export function AlignWrap({ align, children }: { align?: unknown; children: React.ReactNode }) {
  const value = alignOf(align)
  if (!value || value === 'left') return <>{children}</>
  return <div className={`blog-visual-align blog-visual-align--${value}`}>{children}</div>
}

export function LinkAtom({ content }: ExperienceComponentProps) {
  const label = text(content.text)
  const href = text(content.href)
  if (!label || !/^(https?:|mailto:|tel:|\/|#)/i.test(href)) return null
  const external = text(content.target) === 'new-tab'
  return <AlignWrap align={content.align}><a className="blog-visual-link" href={href} {...(external ? { rel: 'noopener noreferrer', target: '_blank' } : {})}>{label}</a></AlignWrap>
}

export function BadgeAtom({ content }: ExperienceComponentProps) {
  const label = text(content.text)
  if (!label) return null
  const tone = ['neutral', 'info', 'success', 'warning', 'danger'].includes(text(content.tone)) ? text(content.tone) : 'info'
  const variant = ['solid', 'soft', 'outline'].includes(text(content.variant)) ? text(content.variant) : 'soft'
  return <AlignWrap align={content.align}><span className={`blog-visual-badge blog-visual-badge--${tone} blog-visual-badge--${variant}`}>{label}</span></AlignWrap>
}

/** One "Media" block for articles: an image, a video (file or link) or an embedded URL (YouTube, Vimeo, Maps). */
export function MediaAtom(props: ExperienceComponentProps) {
  const type = text(props.content.mediaType)
  if (type === 'video') return <VideoAtom {...props} />
  if (type === 'embed') return <EmbedAtom {...props} />
  return <ImageAtom {...props} />
}
