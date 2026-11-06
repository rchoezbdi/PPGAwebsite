'use client'

import { useEffect, useState } from 'react'
import Icon from '../atoms/Icon'

const LABELS: Record<string, { title: string; facebook: string; x: string; linkedin: string; whatsapp: string }> = {
  en: { title: 'Share this article', facebook: 'Share on Facebook', x: 'Share on X', linkedin: 'Share on LinkedIn', whatsapp: 'Share on WhatsApp' },
  es: { title: 'Compartir este artículo', facebook: 'Compartir en Facebook', x: 'Compartir en X', linkedin: 'Compartir en LinkedIn', whatsapp: 'Compartir por WhatsApp' },
  pt: { title: 'Compartilhar este artigo', facebook: 'Compartilhar no Facebook', x: 'Compartilhar no X', linkedin: 'Compartilhar no LinkedIn', whatsapp: 'Compartilhar pelo WhatsApp' },
}

export default function BlogShareLinks({ locale, title }: { locale: string; title: string }) {
  const [hrefs, setHrefs] = useState<{ facebook: string; x: string; linkedin: string; whatsapp: string } | null>(null)
  const labels = LABELS[locale] ?? LABELS.en

  useEffect(() => {
    const url = window.location.href
    const encodedURL = encodeURIComponent(url)
    const encodedText = encodeURIComponent(title)
    setHrefs({
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedURL}`,
      x: `https://twitter.com/intent/tweet?url=${encodedURL}&text=${encodedText}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedURL}`,
      whatsapp: `https://api.whatsapp.com/send?text=${encodeURIComponent(`${title} ${url}`)}`,
    })
  }, [title])

  return <nav aria-label={labels.title} className="blog-share-links">
    {([
      ['facebook', labels.facebook],
      ['x', labels.x],
      ['linkedin', labels.linkedin],
      ['whatsapp', labels.whatsapp],
    ] as const).map(([network, label]) => <a aria-disabled={!hrefs || undefined} aria-label={label} href={hrefs?.[network]} key={network} rel="noopener noreferrer" target="_blank" title={label}>
      <Icon name={network} size={20} />
    </a>)}
  </nav>
}
