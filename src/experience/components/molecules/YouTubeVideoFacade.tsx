'use client'

import { useState } from 'react'
import Icon from '../atoms/Icon'

type YouTubeVideoFacadeProps = {
  posterUrl: string
  title: string
  videoId: string
}

export default function YouTubeVideoFacade({ posterUrl, title, videoId }: YouTubeVideoFacadeProps) {
  const [playing, setPlaying] = useState(false)
  if (!/^[\w-]{11}$/.test(videoId)) return null

  return (
    <div className="youtube-video-facade">
      {playing ? (
        <iframe
          allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          loading="lazy"
          referrerPolicy="strict-origin-when-cross-origin"
          src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&playsinline=1&rel=0`}
          title={title}
        />
      ) : (
        <>
          {posterUrl ? <img alt="" className="youtube-video-facade__poster" loading="lazy" src={posterUrl} /> : null}
          <button aria-label={`Play video: ${title}`} className="youtube-video-facade__play" onClick={() => setPlaying(true)} type="button">
            <Icon name="play" size={28} />
          </button>
        </>
      )}
    </div>
  )
}
