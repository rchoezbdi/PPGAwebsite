'use client'

import { useEffect, useState } from 'react'
import Icon from '../atoms/Icon'
import HeroSlide from '../molecules/HeroSlide'
import { asMediaURL, designTextColor, text, type CTAContent } from '../shared'
import type { ExperienceComponentProps } from '@/experience/registry/componentRegistry'

type Slide = Record<string, unknown> & { primaryCTA?: CTAContent; secondaryCTA?: CTAContent }
const choice = <T extends string>(value: unknown, values: readonly T[], fallback: T): T => values.includes(value as T) ? value as T : fallback
// An explicitly authored URL wins over a stale DAM relation. The editor clears the opposite
// source now, but this precedence also repairs older records that persisted both values.
const url = (relation: unknown, direct: unknown) => text(direct) || asMediaURL(relation)
// Video posters should use their DAM relation when one exists. Old home slides can retain a
// WordPress poster URL that now returns 403 alongside the migrated DAM poster relation.
const posterURL = (relation: unknown, direct: unknown) => asMediaURL(relation) || text(direct)
const gradientBackground = (slide: Slide, prefix = '') => {
  const read = (name: string) => slide[prefix ? `${prefix}${name[0].toUpperCase()}${name.slice(1)}` : name]
  const from = designTextColor(read('gradientFrom')) || 'var(--hero-gradient-from, var(--text-highlight))'
  const to = designTextColor(read('gradientTo')) || 'var(--hero-gradient-to, var(--brand))'
  const type = choice(read('gradientType'), ['linear', 'radial', 'conic'] as const, 'linear')
  if (type === 'radial') return `radial-gradient(${choice(read('gradientShape'), ['circle', 'ellipse'] as const, 'ellipse')} at center,${from},${to})`
  if (type === 'conic') return `conic-gradient(from ${Number(read('gradientAngle') ?? 0)}deg at center,${from},${to},${from})`
  return `linear-gradient(${Number(read('gradientAngle') ?? 135)}deg,${from},${to})`
}

/** One slide renders a static hero; multiple slides progressively enable carousel behavior. */
export default function Hero({ content, settings, locale, site }: ExperienceComponentProps) {
  const p = { ...settings, ...content }
  const configured = Array.isArray(p.slides) ? p.slides.filter((item): item is Slide => Boolean(item && typeof item === 'object')) : []
  const slides: Slide[] = configured.length ? configured : [p]
  const [activeIndex, setActiveIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const autoplay = p.autoplay === true
  const loop = p.loop !== false
  const interval = Math.max(2000, Number(p.interval ?? 6000))
  const multiple = slides.length > 1
  const go = (requested: number) => {
    if (!multiple) return
    setActiveIndex(loop ? ((requested % slides.length) + slides.length) % slides.length : Math.max(0, Math.min(slides.length - 1, requested)))
  }

  useEffect(() => {
    if (!multiple || !autoplay || paused) return
    const timer = window.setInterval(() => setActiveIndex((current) => loop ? (current + 1) % slides.length : Math.min(current + 1, slides.length - 1)), interval)
    return () => window.clearInterval(timer)
  }, [autoplay, interval, loop, multiple, paused, slides.length])

  const indicatorStyle = choice(p.indicatorStyle, ['circle', 'square', 'triangle', 'number'] as const, 'circle')
  const arrowStyle = choice(p.arrowStyle, ['circle', 'square', 'glass', 'minimal'] as const, 'circle')
  const transition = choice(p.transition, ['fade', 'slide'] as const, 'fade')
  const showPagination = p.showPagination !== false && (multiple || p.showSinglePagination === true)
  const showArrows = p.showArrows !== false && multiple

  const shape = choice(p.bottomShape, ['none', 'curve', 'wave', 'angle'] as const, 'none')
  const shapeHeight = Number(p.bottomShapeHeight ?? 48)
  const spacingStyle = {
    paddingTop: Number(p.paddingTop) || undefined,
    paddingBottom: Number(p.paddingBottom) || undefined,
    marginTop: Number(p.marginTop) || undefined,
    marginBottom: Number(p.marginBottom) || undefined,
    '--hero-shape-depth': shape === 'none' ? '0px' : `${Math.max(0, shapeHeight)}px`,
  } as React.CSSProperties

  return (
    <section className={`section hero-carousel hero-carousel--${transition}`} onMouseEnter={() => p.pauseOnHover !== false && setPaused(true)} onMouseLeave={() => setPaused(false)} style={spacingStyle}>
      <div className="hero-carousel__track">
        {slides.map((slide, slideIndex) => {
          const hasEmbed = Boolean(text(slide.embedUrl))
          const hasVideo = Boolean(url(slide.video, slide.videoUrl))
          const hasImage = Boolean(url(slide.mediaDesktop ?? slide.media, slide.imageUrl ?? slide.mediaUrl))
          const backgroundType = choice(slide.backgroundType ?? slide.mediaType, ['transparent', 'color', 'gradient', 'image', 'video', 'embed'] as const, hasEmbed ? 'embed' : hasVideo ? 'video' : hasImage ? 'image' : 'gradient')
          const background = backgroundType === 'transparent' ? 'transparent'
            : backgroundType === 'color' ? designTextColor(slide.backgroundColor) || 'var(--hero-background-color, var(--brand))'
              : backgroundType === 'gradient' ? gradientBackground(slide) : undefined
          const mobileType = choice(slide.mobileBackgroundType, ['inherit', 'transparent', 'color', 'gradient', 'image', 'video', 'embed'] as const, 'inherit')
          const hasMobileBackground = mobileType !== 'inherit'
          const mobileBackground = mobileType === 'transparent' ? 'transparent'
            : mobileType === 'color' ? designTextColor(slide.mobileBackgroundColor) || 'var(--hero-background-color, var(--brand))'
            : mobileType === 'gradient' ? gradientBackground(slide, 'mobile') : undefined
          const tabletType = choice(slide.tabletBackgroundType, ['inherit', 'transparent', 'color', 'gradient', 'image', 'video', 'embed'] as const, 'inherit')
          const hasTabletBackground = tabletType !== 'inherit'
          const tabletBackground = tabletType === 'transparent' ? 'transparent'
            : tabletType === 'color' ? designTextColor(slide.tabletBackgroundColor) || 'var(--hero-background-color, var(--brand))'
              : tabletType === 'gradient' ? gradientBackground(slide, 'tablet') : undefined
          const deviceCopy = slide.deviceCopy && typeof slide.deviceCopy === 'object' ? slide.deviceCopy as Record<string, unknown> : {}
          const tabletCopy = deviceCopy.tablet && typeof deviceCopy.tablet === 'object' ? deviceCopy.tablet as Record<string, unknown> : {}
          const mobileCopy = deviceCopy.mobile && typeof deviceCopy.mobile === 'object' ? deviceCopy.mobile as Record<string, unknown> : {}
          return (
            <div aria-hidden={slideIndex !== activeIndex} className={`hero-carousel__slide${slideIndex === activeIndex ? ' is-active' : ''}`} data-slide-index={slideIndex} inert={slideIndex !== activeIndex} key={String(slide.id ?? slideIndex)}>
              <HeroSlide
                alignment={choice(slide.alignment ?? p.alignment, ['left', 'center', 'right'] as const, 'left')}
                background={background}
                hasMobileBackground={hasMobileBackground}
                hasTabletBackground={hasTabletBackground}
                body={text(slide.body ?? slide.additionalText)}
                bottomShape={shape}
                bottomShapeDirection={choice(p.bottomShapeDirection, ['up', 'down'] as const, 'down')}
                bottomShapeHeight={shapeHeight}
                contentPosition={choice(slide.contentPosition ?? slide.textPosition ?? p.contentPosition, ['start', 'center', 'end'] as const, 'center')}
                description={text(slide.description)}
                tabletDescription={text(tabletCopy.descriptionText)}
                mobileDescription={text(mobileCopy.descriptionText)}
                embedUrl={backgroundType === 'embed' ? text(slide.embedUrl) : undefined}
                mobileEmbedUrl={mobileType === 'embed' ? text(slide.mobileEmbedUrl) : undefined}
                eyebrow={text(slide.eyebrow ?? p.eyebrow)}
                tabletEyebrow={text(tabletCopy.eyebrowText)}
                mobileEyebrow={text(mobileCopy.eyebrowText)}
                focalPosition={choice(slide.focalPosition ?? p.focalPosition, ['center', 'top', 'bottom', 'left', 'right'] as const, 'center')}
                headingLevel={choice(slide.headingLevel ?? p.headingLevel, ['h1', 'h2'] as const, 'h1')}
                height={choice(slide.height ?? p.height, ['small', 'medium', 'large', 'screen'] as const, 'large')}
                locale={locale}
                media={backgroundType === 'image' ? url(slide.mediaDesktop ?? slide.media, slide.imageUrl ?? slide.mediaUrl) : backgroundType === 'video' ? posterURL(slide.poster, slide.posterUrl) : ''}
                mobileBackground={mobileBackground}
                mobileMedia={mobileType === 'image' ? url(slide.mediaMobile, slide.mobileImageUrl ?? slide.mobileMediaUrl) : mobileType === 'video' ? posterURL(slide.posterMobile, slide.mobilePosterUrl) : ''}
                mobileVideo={mobileType === 'video' ? url(slide.videoMobile, slide.mobileVideoUrl) : ''}
                tabletBackground={tabletBackground}
                tabletMedia={tabletType === 'image' ? url(slide.mediaTablet, slide.tabletImageUrl) : tabletType === 'video' ? posterURL(slide.posterTablet, slide.tabletPosterUrl) : ''}
                tabletVideo={tabletType === 'video' ? url(slide.videoTablet, slide.tabletVideoUrl) : ''}
                tabletEmbedUrl={tabletType === 'embed' ? text(slide.tabletEmbedUrl) : undefined}
                overlay={Boolean(slide.overlay)} overlayOpacity={Number(slide.overlayOpacity ?? 45)} poster={posterURL(slide.poster, slide.posterUrl)}
                priority={slideIndex === 0}
                primaryCTA={slide.primaryCTA} secondaryCTA={slide.secondaryCTA} site={site}
                subtitle={text(slide.subtitle)} theme={choice(slide.theme, ['light', 'dark'] as const, 'dark')}
                tabletSubtitle={text(tabletCopy.subtitleText)}
                mobileSubtitle={text(mobileCopy.subtitleText)}
                tabletTitle={text(tabletCopy.headingText)}
                mobileTitle={text(mobileCopy.headingText)}
                title={text(slide.heading ?? slide.title)} video={backgroundType === 'video' ? url(slide.video, slide.videoUrl) : ''}
                videoAutoplay={slideIndex === activeIndex && slide.videoAutoplay !== false}
                layout={slide.layout ? choice(slide.layout, ['default', 'split', 'mascot', 'first-aid-kit'] as const, 'default') : undefined}
                variant={text(slide.variant ?? p.variant)}
                sideMedia={url(slide.sideMedia, '') || (slide.layout === 'split' || p.layout === 'split' || slide.variant === 'split' || p.variant === 'split' ? url(slide.mediaDesktop ?? slide.media, slide.imageUrl ?? slide.mediaUrl) : undefined)}
                kitMedia={url(slide.kitMedia, slide.kitImageUrl)}
                kitImageAlt={text(slide.kitImageAlt)}
                titleMedia={url(slide.titleMedia, slide.titleImageUrl)}
                bottomShapeImage={text(slide.bottomShapeImage ?? p.bottomShapeImage)}
                backgroundPattern={text(slide.backgroundPattern ?? p.backgroundPattern)}
                headingHighlight={text(slide.headingHighlight ?? p.headingHighlight)}
              />
            </div>
          )
        })}
      </div>
      {showArrows ? <>
        <button aria-label={locale === 'es' ? 'Anterior' : 'Previous slide'} className={`hero-carousel__arrow hero-carousel__arrow--prev hero-carousel__arrow--${arrowStyle}`} disabled={!loop && activeIndex === 0} onClick={() => go(activeIndex - 1)} type="button"><Icon name="chevron-right" size={20} /></button>
        <button aria-label={locale === 'es' ? 'Siguiente' : 'Next slide'} className={`hero-carousel__arrow hero-carousel__arrow--next hero-carousel__arrow--${arrowStyle}`} disabled={!loop && activeIndex === slides.length - 1} onClick={() => go(activeIndex + 1)} type="button"><Icon name="chevron-right" size={20} /></button>
      </> : null}
      {showPagination ? <div className={`hero-carousel__dots hero-carousel__dots--${indicatorStyle}`} role="tablist">
        {slides.map((_, dotIndex) => <button aria-label={`${locale === 'es' ? 'Ir a la diapositiva' : 'Go to slide'} ${dotIndex + 1}`} aria-selected={dotIndex === activeIndex} className={dotIndex === activeIndex ? 'is-active' : ''} key={dotIndex} onClick={() => go(dotIndex)} role="tab" type="button">{indicatorStyle === 'number' ? dotIndex + 1 : null}</button>)}
      </div> : null}
    </section>
  )
}
