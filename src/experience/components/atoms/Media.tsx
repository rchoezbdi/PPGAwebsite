"use client";

import { useCallback, useEffect, useRef, useSyncExternalStore } from "react";

const normalizeMediaURL = (value?: string | null) => {
  if (!value) return "";
  if (value.startsWith("/")) return value;
  if (/^https?:\/\//i.test(value)) {
    try {
      const parsed = new URL(value);
      if (parsed.pathname.startsWith("/api/media/file/"))
        return `${parsed.pathname}${parsed.search}${parsed.hash}`;
    } catch {
      return value;
    }
    return value;
  }
  return `/media/${value}`;
};

export type MediaProps = {
  alt?: string;
  autoPlay?: boolean;
  className?: string;
  fill?: boolean;
  height?: number;
  mediaQuery?: string;
  mobileSrc?: string;
  mobileVideoSrc?: string;
  objectFit?: "cover" | "contain";
  priority?: boolean;
  src?: string;
  videoSrc?: string;
  width?: number;
};

/** CMS media rendering primitive — accepts a plain URL string (already resolved from a Payload
 * Media relation upstream) rather than the relation object itself, so it stays decoupled from any
 * particular collection shape. Supports an optional mobile-specific source and an optional video
 * fallback for hero-style backgrounds. */
export default function Media({
  alt = "",
  autoPlay = true,
  className,
  fill,
  height,
  mediaQuery,
  mobileSrc,
  mobileVideoSrc,
  objectFit = "cover",
  priority,
  src,
  videoSrc,
  width,
}: MediaProps) {
  const resolvedSrc = normalizeMediaURL(src);
  const resolvedMobile = normalizeMediaURL(mobileSrc);
  const resolvedVideo = normalizeMediaURL(videoSrc);
  const resolvedMobileVideo = normalizeMediaURL(mobileVideoSrc);
  const videoPoster = resolvedSrc && mediaQuery === "(max-width: 640px)" && resolvedSrc.startsWith("/api/media/file/")
    ? `/_next/image?url=${encodeURIComponent(resolvedSrc)}&w=640&q=40`
    : resolvedSrc;
  const videoRef = useRef<HTMLVideoElement>(null);
  const subscribe = useCallback((onChange: () => void) => {
    if (!mediaQuery) return () => undefined;
    const query = window.matchMedia(mediaQuery);
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, [mediaQuery]);
  const getSnapshot = useCallback(() => !mediaQuery || window.matchMedia(mediaQuery).matches, [mediaQuery]);
  const getServerSnapshot = useCallback(() => !mediaQuery, [mediaQuery]);
  const mediaMatches = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const shouldAutoplay = autoPlay && mediaMatches;
  useEffect(() => {
    if (!videoRef.current) return;
    if (!shouldAutoplay) {
      videoRef.current.pause();
      return;
    }
    void videoRef.current.play().catch(() => undefined);
  }, [shouldAutoplay, resolvedVideo, resolvedMobileVideo]);
  const classes = [
    "media",
    fill ? "media--fill" : "",
    `media--${objectFit}`,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  if (resolvedVideo) {
    return (
      <>
        {priority && videoPoster ? <link as="image" fetchPriority="high" href={videoPoster} media={mediaQuery} rel="preload" /> : null}
        <video
          autoPlay={shouldAutoplay}
          className={classes}
          {...(priority ? { fetchPriority: "high", loading: "eager" } as Record<string, string> : { loading: "lazy" } as Record<string, string>)}
          loop
          muted
          playsInline
          poster={videoPoster || undefined}
          preload={priority && mediaMatches ? "metadata" : "none"}
          ref={videoRef}
        >
          {resolvedMobileVideo ? (
            <source media="(max-width: 640px)" src={resolvedMobileVideo} />
          ) : null}
          <source src={resolvedVideo} />
        </video>
      </>
    );
  }
  if (!resolvedSrc) return null;
  if (resolvedMobile) {
    return (
      <picture>
        <source media="(max-width: 640px)" srcSet={resolvedMobile} />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          alt={alt}
          className={classes}
          fetchPriority={priority ? "high" : "auto"}
          height={height}
          loading={priority ? "eager" : "lazy"}
          src={resolvedSrc}
          width={width}
        />
      </picture>
    );
  }
  // eslint-disable-next-line @next/next/no-img-element
  return (
    <img
      alt={alt}
      className={classes}
      fetchPriority={priority ? "high" : "auto"}
      height={height}
      loading={priority ? "eager" : "lazy"}
      src={resolvedSrc}
      width={width}
    />
  );
}
