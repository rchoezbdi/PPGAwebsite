import type { ExperienceComponentProps } from '@/experience/registry/componentRegistry'
import Image from 'next/image'
import { asMediaAlt, asMediaDimension, asMediaOptimizerURL, asMediaURL, designTextColor, text } from '../shared'

const mediaSource = (media: unknown, url: unknown) => asMediaURL(media) || text(url)

export default function GlobalCareStatement({ content, settings }: ExperienceComponentProps) {
  const p = { ...settings, ...content }
  const left = mediaSource(p.leftImage, p.leftImageUrl)
  const right = mediaSource(p.rightImage, p.rightImageUrl)
  const animated = p.animate !== false
  return (
    <section className={`global-care-statement${animated ? ' global-care-statement--animated' : ''}`}>
      <div className="section-container global-care-statement__inner">
        {left ? <Image alt={asMediaAlt(p.leftImage, text(p.leftImageAlt))} className="global-care-statement__image" height={asMediaDimension(p.leftImage, 'height') ?? 270} loading="lazy" sizes="(max-width: 600px) calc(50vw - 1.5rem), 20rem" src={asMediaOptimizerURL(left)} width={asMediaDimension(p.leftImage, 'width') ?? 510} /> : null}
        <div className="global-care-statement__copy">
          <h2><mark className="is-zigzag" data-editor-field="firstHighlight" style={designTextColor(p.firstHighlightColor) ? { color: designTextColor(p.firstHighlightColor) } : undefined}>{text(p.firstHighlight)}</mark></h2>
          <h2><span data-editor-field="secondPrefix">{text(p.secondPrefix)}</span> <mark data-editor-field="secondHighlight" style={designTextColor(p.secondHighlightColor) ? { color: designTextColor(p.secondHighlightColor) } : undefined}>{text(p.secondHighlight)}</mark></h2>
        </div>
        {right ? <Image alt={asMediaAlt(p.rightImage, text(p.rightImageAlt))} className="global-care-statement__image" height={asMediaDimension(p.rightImage, 'height') ?? 270} loading="lazy" sizes="(max-width: 600px) calc(50vw - 1.5rem), 20rem" src={asMediaOptimizerURL(right)} width={asMediaDimension(p.rightImage, 'width') ?? 510} /> : null}
      </div>
    </section>
  )
}
