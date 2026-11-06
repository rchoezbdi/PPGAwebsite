import { useId } from "react";
import Heading from "../atoms/Heading";
import Label from "../atoms/Label";
import Media from "../atoms/Media";
import Text from "../atoms/Text";
import CTAGroup from "./CTAGroup";
import type { CTAContent } from "../shared";
import type { ExperienceSite } from "@/experience/registry/componentRegistry";

export default function HeroSlide({
  alignment = "left",
  background,
  hasMobileBackground = false,
  hasTabletBackground = false,
  body,
  bottomShape = "none",
  bottomShapeDirection = "down",
  bottomShapeHeight = 48,
  contentPosition = "center",
  description,
  tabletDescription,
  mobileDescription,
  embedUrl,
  eyebrow,
  tabletEyebrow,
  mobileEyebrow,
  focalPosition = "center",
  height = "large",
  headingLevel = "h1",
  locale,
  media,
  mobileMedia,
  mobileBackground,
  mobileEmbedUrl,
  mobileVideo,
  tabletBackground,
  tabletEmbedUrl,
  tabletMedia,
  tabletVideo,
  overlay,
  overlayOpacity = 45,
  poster,
  priority = false,
  primaryCTA,
  secondaryCTA,
  site,
  subtitle,
  tabletSubtitle,
  mobileSubtitle,
  theme = "light",
  title,
  tabletTitle,
  mobileTitle,
  video,
  videoAutoplay = true,
  layout,
  variant,
  sideMedia,
  kitMedia,
  kitImageAlt,
  titleMedia,
  bottomShapeImage,
  backgroundPattern,
  headingHighlight,
}: {
  alignment?: "left" | "center" | "right";
  background?: string;
  hasMobileBackground?: boolean;
  hasTabletBackground?: boolean;
  body?: string;
  bottomShape?: "none" | "curve" | "wave" | "angle";
  bottomShapeDirection?: "up" | "down";
  bottomShapeHeight?: number;
  contentPosition?: "start" | "center" | "end";
  description?: string;
  tabletDescription?: string;
  mobileDescription?: string;
  embedUrl?: string;
  eyebrow?: string;
  tabletEyebrow?: string;
  mobileEyebrow?: string;
  focalPosition?: "center" | "top" | "bottom" | "left" | "right";
  height?: "small" | "medium" | "large" | "screen";
  headingLevel?: "h1" | "h2";
  locale: string;
  media?: string;
  mobileMedia?: string;
  mobileBackground?: string;
  mobileEmbedUrl?: string;
  mobileVideo?: string;
  tabletBackground?: string;
  tabletEmbedUrl?: string;
  tabletMedia?: string;
  tabletVideo?: string;
  overlay?: boolean;
  overlayOpacity?: number;
  poster?: string;
  priority?: boolean;
  primaryCTA?: CTAContent | null;
  secondaryCTA?: CTAContent | null;
  site?: ExperienceSite;
  subtitle?: string;
  tabletSubtitle?: string;
  mobileSubtitle?: string;
  theme?: "light" | "dark";
  title?: string;
  tabletTitle?: string;
  mobileTitle?: string;
  video?: string;
  videoAutoplay?: boolean;
  layout?: "default" | "split" | "mascot" | "first-aid-kit";
  variant?: string;
  sideMedia?: string;
  kitMedia?: string;
  kitImageAlt?: string;
  titleMedia?: string;
  bottomShapeImage?: string;
  backgroundPattern?: string;
  headingHighlight?: string;
}) {
  const isFirstAidKit = layout === "first-aid-kit" || variant === "first-aid-kit";
  const isSplit = layout === "split" || variant === "split" || variant === "mascot";
  const desktopMediaQuery = hasTabletBackground
    ? (hasMobileBackground ? "(min-width: 1025px)" : "(min-width: 1025px), (max-width: 640px)")
    : hasMobileBackground ? "(min-width: 641px)" : undefined;
  const tabletMediaQuery = hasTabletBackground ? "(min-width: 641px) and (max-width: 1024px)" : undefined;
  const mobileMediaQuery = hasMobileBackground ? "(max-width: 640px)" : undefined;
  const highlightStart = title && headingHighlight ? title.indexOf(headingHighlight) : -1;
  const headingContent = highlightStart >= 0 && title && headingHighlight
    ? <>{title.slice(0, highlightStart)}<strong>{headingHighlight}</strong>{title.slice(highlightStart + headingHighlight.length)}</>
    : title;
  const responsiveHeading = (value: string) => {
    const start = headingHighlight ? value.indexOf(headingHighlight) : -1;
    return start >= 0 && headingHighlight
      ? <>{value.slice(0, start)}<strong>{headingHighlight}</strong>{value.slice(start + headingHighlight.length)}</>
      : value;
  };
  const titleMarkup = tabletTitle || mobileTitle
    ? <><span className="hero-slide__copy-desktop">{headingContent}</span><span className="hero-slide__copy-tablet">{responsiveHeading(tabletTitle || title || '')}</span><span className="hero-slide__copy-mobile">{responsiveHeading(mobileTitle || title || '')}</span></>
    : headingContent;
  const subtitleMarkup = tabletSubtitle || mobileSubtitle
    ? <><span className="hero-slide__copy-desktop">{subtitle}</span><span className="hero-slide__copy-tablet">{tabletSubtitle || subtitle}</span><span className="hero-slide__copy-mobile">{mobileSubtitle || subtitle}</span></>
    : subtitle;
  const descriptionMarkup = tabletDescription || mobileDescription
    ? <><span className="hero-slide__copy-desktop">{description}</span><span className="hero-slide__copy-tablet">{tabletDescription || description}</span><span className="hero-slide__copy-mobile">{mobileDescription || description}</span></>
    : description;
  const eyebrowMarkup = tabletEyebrow || mobileEyebrow
    ? <><span className="hero-slide__copy-desktop">{eyebrow}</span><span className="hero-slide__copy-tablet">{tabletEyebrow || eyebrow}</span><span className="hero-slide__copy-mobile">{mobileEyebrow || eyebrow}</span></>
    : eyebrow;

  if (isSplit) {
    return (
      <div
        className={`hero-slide hero-slide--split hero-slide--${theme} hero-slide--height-${height} hero-slide--align-${alignment}`}
        style={{
          "--hero-slide-background": background || "linear-gradient(90deg, var(--brand) 0%, var(--brand-bright) 20%, var(--text-highlight) 90%, var(--brand) 100%)",
        } as React.CSSProperties}
      >
        {backgroundPattern ? (
          <div
            className="hero-slide__pattern-overlay"
            style={{ backgroundImage: `url(${backgroundPattern})` }}
          />
        ) : null}

        <div className="hero-slide__split-container">
          <div className="hero-slide__split-left">
            {eyebrow ? (
              <span className="hero-slide__field-wrap" data-editor-field="eyebrow">
                <Label variant="eyebrow">{eyebrowMarkup}</Label>
              </span>
            ) : null}
            <span className="hero-slide__field-wrap" data-editor-field="heading">
              <Heading className="hero-heading" level={headingLevel}>
                {titleMarkup}
              </Heading>
            </span>
            {subtitle ? (
              <span className="hero-slide__field-wrap" data-editor-field="subtitle">
                <Text className="hero-subtitle">{subtitleMarkup}</Text>
              </span>
            ) : null}
            {description ? (
              <span className="hero-slide__field-wrap" data-editor-field="description">
                <Text className="hero-description">{descriptionMarkup}</Text>
              </span>
            ) : null}
            {body ? (
              <span className="hero-slide__field-wrap" data-editor-field="additionalText">
                <Text className="hero-body">{body}</Text>
              </span>
            ) : null}
            {(primaryCTA || secondaryCTA) ? (
              <div className="hero-slide__field-wrap" data-editor-field="primaryCTA">
                <CTAGroup
                  alignment={alignment}
                  forceChevronIcon
                  locale={locale}
                  primaryCTA={primaryCTA}
                  secondaryCTA={secondaryCTA}
                  site={site}
                />
              </div>
            ) : null}
          </div>

          <div className="hero-slide__split-right">
            {sideMedia ? (
              <div className="hero-slide__mascot-wrap" data-editor-field="media">
                <img src={sideMedia} alt="" className="hero-slide__mascot-img" />
              </div>
            ) : null}
          </div>
        </div>

        {bottomShapeImage ? (
          <div className="hero-slide__bottom-wave-wrap" aria-hidden="true">
            <img src={bottomShapeImage} alt="" className="hero-slide__bottom-wave-img" />
          </div>
        ) : null}
      </div>
    );
  }

  const shapeId = `hero-shape-${useId().replace(/:/g, "")}`;
  const depth = Math.max(0.02, Math.min(0.22, bottomShapeHeight / 600));
  const top = 1 - depth;
  const shapePath = bottomShape === "curve"
    ? (bottomShapeDirection === "down" ? `M0 0H1V${top}Q.5 1 0 ${top}Z` : `M0 0H1V1Q.5 ${top} 0 1Z`)
    : bottomShape === "wave"
      ? `M0 0H1V${1 - depth / 2}C.75 ${top} .65 1 .5 ${1 - depth / 2}S.25 ${top} 0 ${1 - depth / 2}Z`
      : `M0 0H1V${top}L.5 ${bottomShapeDirection === "down" ? 1 : top} 0 ${bottomShapeDirection === "down" ? top : 1}Z`;
  return (
    <div
      className={`hero-slide hero-slide--${theme} hero-slide--height-${height} hero-slide--content-${contentPosition} hero-slide--align-${alignment}${isFirstAidKit ? " hero-slide--first-aid-kit" : ""}${hasTabletBackground ? " hero-slide--has-tablet-background" : ""}${hasMobileBackground ? " hero-slide--has-mobile-background" : ""}`}
      style={{ "--hero-slide-background": background, "--hero-slide-tablet-background": tabletBackground ?? background, "--hero-slide-mobile-background": mobileBackground ?? tabletBackground ?? background, clipPath: bottomShape === "none" ? undefined : `url(#${shapeId})` } as React.CSSProperties}
    >
      {bottomShape !== "none" ? <svg aria-hidden="true" className="hero-slide__clip-def"><defs><clipPath clipPathUnits="objectBoundingBox" id={shapeId}><path d={shapePath} /></clipPath></defs></svg> : null}
      {embedUrl ? (
        <div className="hero-slide__embed-wrap hero-slide__desktop-background" data-editor-field="background">
          <iframe
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="hero-slide__embed-frame"
            src={embedUrl}
            title="Hero media embed"
          />
        </div>
      ) : media || video ? (
        <div className="hero-slide__media-wrap hero-slide__desktop-background" data-editor-field="background">
          <Media
            autoPlay={videoAutoplay}
            className={`hero-slide__media hero-slide__media--${focalPosition}`}
            fill
            mediaQuery={video ? desktopMediaQuery : undefined}
            priority={priority}
            src={media || poster}
            videoSrc={video}
          />
        </div>
      ) : (
        <div className="hero-slide__bg-anchor" data-editor-field="background" />
      )}
      {tabletEmbedUrl ? (
        <div className="hero-slide__embed-wrap hero-slide__tablet-background" data-editor-field="background"><iframe allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen className="hero-slide__embed-frame" src={tabletEmbedUrl} title="Hero tablet media embed" /></div>
      ) : tabletMedia || tabletVideo ? (
        <div className="hero-slide__media-wrap hero-slide__tablet-background" data-editor-field="background"><Media autoPlay={videoAutoplay} className={`hero-slide__media hero-slide__media--${focalPosition}`} fill mediaQuery={tabletVideo ? tabletMediaQuery : undefined} priority={priority} src={tabletMedia} videoSrc={tabletVideo} /></div>
      ) : null}
      {mobileEmbedUrl ? (
        <div className="hero-slide__embed-wrap hero-slide__mobile-background" data-editor-field="background">
          <iframe allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen className="hero-slide__embed-frame" src={mobileEmbedUrl} title="Hero mobile media embed" />
        </div>
      ) : mobileMedia || mobileVideo ? (
        <div className="hero-slide__media-wrap hero-slide__mobile-background" data-editor-field="background">
          <Media autoPlay={videoAutoplay} className={`hero-slide__media hero-slide__media--${focalPosition}`} fill mediaQuery={mobileVideo ? mobileMediaQuery : undefined} priority={priority} src={mobileMedia} videoSrc={mobileVideo} />
        </div>
      ) : null}
      {overlay ? (
        <div
          aria-hidden="true"
          className="hero-slide__overlay"
          data-editor-field="overlay"
          style={{ opacity: Math.max(0, Math.min(100, overlayOpacity)) / 100 }}
        />
      ) : null}
      {backgroundPattern ? <div aria-hidden="true" className="hero-slide__pattern-overlay" style={{ backgroundImage: `url(${backgroundPattern})` }} /> : null}
      <div className="hero-slide__content">
        {eyebrow ? (
          <span className="hero-slide__field-wrap" data-editor-field="eyebrow">
            <Label variant="eyebrow">{eyebrowMarkup}</Label>
          </span>
        ) : null}
        {isFirstAidKit ? (
          <>
            <div className="hero-slide__first-aid-art" data-editor-field="heading">
              {sideMedia ? <Media alt="" className="hero-slide__first-aid-combined-art" objectFit="contain" src={sideMedia} /> : <>
                {kitMedia ? <Media alt={kitImageAlt || ""} className="hero-slide__first-aid-kit-image" src={kitMedia} /> : null}
                {titleMedia ? <Media alt="" className="hero-slide__first-aid-title-image" src={titleMedia} /> : <Heading className="hero-heading" level={headingLevel}>{title}</Heading>}
              </>}
            </div>
            {titleMedia || sideMedia ? <Heading className="hero-slide__first-aid-accessible-title" level={headingLevel}>{title}</Heading> : null}
          </>
        ) : (
          <span className="hero-slide__field-wrap" data-editor-field="heading">
            <Heading className="hero-heading" level={headingLevel}>
              {titleMarkup}
            </Heading>
          </span>
        )}
        {(isFirstAidKit ? (subtitle || description) : subtitle) ? (
          <span className="hero-slide__field-wrap" data-editor-field="subtitle">
            <Text className="hero-subtitle">{isFirstAidKit ? (subtitle || description) : subtitleMarkup}</Text>
          </span>
        ) : null}
        {description && !isFirstAidKit ? (
          <span className="hero-slide__field-wrap" data-editor-field="description">
            <Text className="hero-description">{descriptionMarkup}</Text>
          </span>
        ) : null}
        {body ? (
          <span className="hero-slide__field-wrap" data-editor-field="additionalText">
            <Text className="hero-body">{body}</Text>
          </span>
        ) : null}
        <div className="hero-slide__field-wrap" data-editor-field="primaryCTA">
          <CTAGroup
            alignment={alignment}
            forceChevronIcon
            locale={locale}
            primaryCTA={primaryCTA}
            secondaryCTA={secondaryCTA}
            site={site}
          />
        </div>
      </div>
    </div>
  );
}
