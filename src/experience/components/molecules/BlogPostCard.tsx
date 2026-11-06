import Heading from '../atoms/Heading'
import Link from '../atoms/Link'
import Media from '../atoms/Media'
import Text from '../atoms/Text'

export default function BlogPostCard({ category, description, href, imageAlt, imageUrl, linkLabel, publishedAt, title }: {
  category?: string
  description?: string
  href?: string
  imageAlt?: string
  imageUrl?: string
  linkLabel?: string
  publishedAt?: string
  title?: string
}) {
  if (!title) return null
  return (
    <article className="blog-card">
      <div className="blog-card__visual">
        {imageUrl ? <Media alt={imageAlt || title} className="blog-card__media" src={imageUrl} /> : null}
        {category ? <span className="blog-card__category label label--category">{category}</span> : null}
      </div>
      <div className="blog-card__body">
        {publishedAt ? (
          <div className="blog-card__meta">
            {publishedAt ? <Text className="blog-card__date" size="sm" tone="muted">{publishedAt}</Text> : null}
          </div>
        ) : null}
        <Heading className="blog-card__title" level="h3" size="sm">{title}</Heading>
        <Text size="sm" tone="muted">{description}</Text>
      </div>
      {href ? <Link ariaLabel={title} className="blog-card__whole-link" href={href}><span className="iub-sr-only">{linkLabel || 'Read article'}</span></Link> : null}
    </article>
  )
}
