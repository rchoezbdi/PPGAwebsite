import { resolveExperienceLink } from '@/experience/navigation/resolver'
import type { ExperienceComponentProps } from '@/experience/registry/componentRegistry'
import { planAudienceCardImages } from '@/experience/registry/catalog'
import Image, { getImageProps } from 'next/image'
import { asMediaAlt, asMediaDimension, asMediaOptimizerURL, asMediaURL, designTextColor, readButtonCTA, text, type CTAContent } from '../shared'
import CTAButton from '../molecules/CTAButton'
import type { ButtonVariant } from '../atoms/Button'

type AudienceCard = {
  cta?: CTAContent
  buttonLabel?: string
  buttonIcon?: string
  buttonVariant?: ButtonVariant
  showIcon?: boolean
  image?: unknown
  imageAlt?: string
  imageUrl?: string
  imageMobile?: unknown
  imageMobileUrl?: string
  linkType?: 'internal' | 'external' | 'none'
  newWindow?: boolean
  page?: unknown
  title?: string
  url?: string
}

export default function PlanAudienceCards({ content, settings, locale, site }: ExperienceComponentProps) {
  const p = { ...settings, ...content }
  const cards = (Array.isArray(p.cards) ? p.cards : []) as AudienceCard[]
  const decoration = asMediaURL(p.decoration) || text(p.decorationUrl)
  return (
    <section className="plan-audience-cards">
      <div className="section-container plan-audience-cards__inner">
        <h2 className="plan-audience-cards__title">
          <span data-editor-field="headingPrefix" style={designTextColor(p.headingColor) ? { color: designTextColor(p.headingColor) } : undefined}>{text(p.headingPrefix)}</span> <mark data-editor-field="headingHighlight" style={designTextColor(p.headingHighlightColor) ? { color: designTextColor(p.headingHighlightColor) } : undefined}>{text(p.headingHighlight)}</mark> <span data-editor-field="headingSuffix" style={designTextColor(p.headingColor) ? { color: designTextColor(p.headingColor) } : undefined}>{text(p.headingSuffix)}</span>
        </h2>
        <div className="plan-audience-cards__grid">
          {cards.map((card, index) => {
            const link = resolveExperienceLink({ fallbackSite: site.slug, localizedRoutes: site.localizedRoutes, linkType: card.linkType ?? 'external', locale, page: card.page as Parameters<typeof resolveExperienceLink>[0]['page'], url: card.url })
            const ppgaFallback = site.slug === 'ppga' && card.linkType !== 'none'
            const ppgaPlanPath = process.env.NODE_ENV === 'production' ? '/nuestros-planes' : '/ppga/nuestros-planes?locale=es'
            const href = link.href ?? (ppgaFallback ? `${ppgaPlanPath}${index === 1 ? '#corporate-group' : ''}` : null)
            const cta = readButtonCTA(card as Record<string, unknown>, {}, { icon: 'arrow-right', variant: 'primary' })
            // PPGA's legacy instance has the company photo assigned to the family card,
            // a missing company desktop asset, and no CTA URLs. Use the shared verified
            // DAM pair for this App until its editorial instance is synchronized.
            const ppgaImages = [planAudienceCardImages.individuals, planAudienceCardImages.companies]
            const image = ppgaFallback
              ? ppgaImages[index] ? ppgaImages[index].desktop : ''
              : asMediaURL(card.image) || text(card.imageUrl)
            const mobileImage = ppgaFallback
              ? ppgaImages[index] ? ppgaImages[index].mobile : ''
              : asMediaURL(card.imageMobile) || text(card.imageMobileUrl)
            const imageAlt = text(card.imageAlt) || (ppgaFallback ? index === 0 ? 'Familia disfrutando de tiempo juntos' : 'Líder empresarial viajando en avión' : asMediaAlt(card.image))
            const mobileImageProps = mobileImage ? getImageProps({
              alt: imageAlt,
              height: asMediaDimension(card.imageMobile, 'height') ?? asMediaDimension(card.image, 'height') ?? 668,
              quality: 60,
              sizes: '(max-width: 640px) calc(100vw - 3rem), 42rem',
              src: asMediaOptimizerURL(mobileImage),
              width: asMediaDimension(card.imageMobile, 'width') ?? asMediaDimension(card.image, 'width') ?? 1059,
            }).props : undefined
            return (
              <article className="plan-audience-cards__card" data-editor-field="cards" data-editor-index={index} key={`${card.title}-${index}`}>
                {image ? <picture data-editor-field="cards" data-editor-index={index}>{mobileImageProps ? <source media="(max-width: 640px)" sizes={mobileImageProps.sizes} srcSet={mobileImageProps.srcSet} /> : null}<Image alt={imageAlt} fill loading="lazy" quality={60} sizes="(max-width: 640px) calc(100vw - 3rem), (max-width: 1024px) 50vw, 42rem" src={asMediaOptimizerURL(image)} /></picture> : null}
                <div><h3 data-editor-field="cards" data-editor-index={index}>{card.title}</h3><span data-editor-field="cards" data-editor-index={index}><CTAButton cta={cta} defaultIcon="arrow-right" fallbackHref={href} locale={locale} site={site} /></span></div>
              </article>
            )
          })}
        </div>
        {decoration ? <Image alt="" aria-hidden="true" className="plan-audience-cards__decoration" height={asMediaDimension(p.decoration, 'height') ?? 502} loading="lazy" quality={30} sizes="38rem" src={asMediaOptimizerURL(decoration)} width={asMediaDimension(p.decoration, 'width') ?? 600} /> : null}
      </div>
    </section>
  )
}
