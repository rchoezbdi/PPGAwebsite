import Heading from '../atoms/Heading'
import Icon from '../atoms/Icon'
import Media from '../atoms/Media'
import Text from '../atoms/Text'
import Link from '../atoms/Link'
import Button from '../atoms/Button'
import { designTextColor } from '../shared'
import { asMediaAlt } from '../shared'
import type { ButtonVariant } from '../atoms/Button'

export default function FeatureCard({ alignment = 'left', buttonIcon, buttonIconPosition = 'right', buttonVariant = 'outline', description, eyebrow, href, icon, imageAlt, imageOverlay = false, linkButton = false, linkLabel, media, mediaRecord, openInNewWindow = false, panelSide = 'left', title, titleHighlight, titleHighlightColor }: {
  alignment?: 'left' | 'center'
  buttonIcon?: string
  buttonIconPosition?: 'left' | 'right'
  buttonVariant?: ButtonVariant
  description?: string
  eyebrow?: string
  href?: string
  icon?: string
  imageAlt?: string
  imageOverlay?: boolean
  linkButton?: boolean
  linkLabel?: string
  media?: string
  mediaRecord?: unknown
  openInNewWindow?: boolean
  panelSide?: 'left' | 'right'
  title?: string
  titleHighlight?: string
  titleHighlightColor?: string
}) {
  if (!title) return null
  const copy = <>
    {eyebrow ? <span className="feature-card__eyebrow">{eyebrow}</span> : null}
    <Heading level="h3" size="sm">{title}{titleHighlight ? <> <mark style={designTextColor(titleHighlightColor) ? { color: designTextColor(titleHighlightColor) } : undefined}>{titleHighlight}</mark></> : null}</Heading>
    <Text size="sm" tone="muted">{description}</Text>
  </>
  const action = href
    ? imageOverlay
      ? <Button className="feature-card__button" href={href} icon={buttonIcon} iconPosition={buttonIconPosition} label={linkLabel || 'Learn more'} size="sm" target={openInNewWindow ? '_blank' : undefined} variant={buttonVariant} />
      : linkButton
        ? <Button className="feature-card__button" href={href} icon={buttonIcon} iconPosition={buttonIconPosition} label={linkLabel || 'Learn more'} size="sm" target={openInNewWindow ? '_blank' : undefined} variant={buttonVariant} />
        : <Link className="feature-card__link" href={href} target={openInNewWindow ? '_blank' : undefined}>{linkLabel || 'Learn more'}</Link>
    : null
  return (
    <article className={`feature-card${alignment === 'center' ? ' feature-card--center' : ''}${imageOverlay ? ` feature-card--image-overlay feature-card--panel-${panelSide}` : ''}`}>
      {media ? <Media alt={imageOverlay ? '' : imageAlt || asMediaAlt(mediaRecord) || title} className={imageOverlay ? 'feature-card__background' : 'feature-card__media'} fill={imageOverlay} src={media} /> : icon ? <span className="feature-card__icon"><Icon name={icon} size={24} /></span> : null}
      {imageOverlay ? <div className="feature-card__panel">{copy}{action}</div> : <>{copy}{action}</>}
    </article>
  )
}
