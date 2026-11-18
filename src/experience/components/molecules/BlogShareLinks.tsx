'use client'

import { useEffect, useState } from 'react'
import Icon from '../atoms/Icon'

const LABELS: Record<string, { title: string; sharePost: string; copy: string; copied: string; copyFailed: string; facebook: string; x: string; linkedin: string; whatsapp: string }> = {
  en: { title: 'Share this article', sharePost: 'Share this post', copy: 'Copy link', copied: 'Link copied', copyFailed: 'Could not copy link', facebook: 'Share on Facebook', x: 'Share on X', linkedin: 'Share on LinkedIn', whatsapp: 'Share on WhatsApp' },
  es: { title: 'Compartir este artículo', sharePost: 'Compartir esta publicación', copy: 'Copiar enlace', copied: 'Enlace copiado', copyFailed: 'No se pudo copiar el enlace', facebook: 'Compartir en Facebook', x: 'Compartir en X', linkedin: 'Compartir en LinkedIn', whatsapp: 'Compartir por WhatsApp' },
  pt: { title: 'Compartilhar este artigo', sharePost: 'Compartilhar esta publicação', copy: 'Copiar link', copied: 'Link copiado', copyFailed: 'Não foi possível copiar o link', facebook: 'Compartilhar no Facebook', x: 'Compartilhar no X', linkedin: 'Compartilhar no LinkedIn', whatsapp: 'Compartilhar pelo WhatsApp' },
}

export default function BlogShareLinks({ locale, title, variant = 'rail' }: { locale: string; title: string; variant?: 'rail' | 'footer' }) {
  const [hrefs, setHrefs] = useState<{ facebook: string; x: string; linkedin: string; whatsapp: string } | null>(null)
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied' | 'failed'>('idle')
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

  const links = ([
      ['facebook', labels.facebook],
      ['x', labels.x],
      ['linkedin', labels.linkedin],
      ['whatsapp', labels.whatsapp],
  ] as const).map(([network, label]) => <a aria-disabled={!hrefs || undefined} aria-label={label} href={hrefs?.[network]} key={network} rel="noopener noreferrer" target="_blank" title={label}>
      <Icon name={network} size={20} />
  </a>)

  if (variant === 'footer') {
    const copyLink = async () => {
      try {
        await navigator.clipboard.writeText(window.location.href)
        setCopyStatus('copied')
      } catch {
        setCopyStatus('failed')
      }
    }
    const status = copyStatus === 'copied' ? labels.copied : copyStatus === 'failed' ? labels.copyFailed : ''
    return <div className="blog-share-footer">
      <strong className="blog-share-footer__title">{labels.sharePost}</strong>
      <div className="blog-share-footer__actions">
        <button className="blog-share-footer__copy" onClick={copyLink} type="button"><Icon name="copy" size={16} /><span>{labels.copy}</span></button>
        <nav aria-label={labels.title} className="blog-share-footer__social">{links}</nav>
      </div>
      <span aria-live="polite" className="blog-share-footer__status">{status}</span>
    </div>
  }

  return <nav aria-label={labels.title} className="blog-share-links">{links}</nav>
}
