import LucideFallbackIcon from './LucideFallbackIcon'

export type IconName =
  | 'arrow-right' | 'chevron-down' | 'chevron-right' | 'menu' | 'close' | 'phone' | 'mail'
  | 'whatsapp' | 'globe' | 'chat' | 'check' | 'star' | 'play' | 'user' | 'shield' | 'pin' | 'truck'
  | 'download' | 'file-text' | 'search' | 'instagram' | 'linkedin' | 'facebook' | 'youtube' | 'x'

const paths: Record<IconName, React.ReactNode> = {
  'arrow-right': <path d="M5 12h14M13 6l6 6-6 6" />,
  'chevron-down': <path d="m6 9 6 6 6-6" />,
  'chevron-right': <path d="m9 18 6-6-6-6" />,
  menu: <path d="M3 6h18M3 12h18M3 18h18" />,
  close: <path d="M6 6l12 12M18 6 6 18" />,
  phone: <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.362 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.338 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />,
  mail: <><rect height="16" rx="2" width="20" x="2" y="4" /><path d="m22 6-10 7L2 6" /></>,
  whatsapp: <path d="M12 2a10 10 0 0 0-8.5 15.2L2 22l4.9-1.5A10 10 0 1 0 12 2zM8.6 7.3c.2-.4.4-.4.6-.4h.5c.2 0 .4 0 .6.4.2.5.7 1.7.8 1.8.1.2.1.3 0 .5-.6 1-1.2 1-.9 1.5.9 1.5 1.9 2.4 3.3 3.1.5.2.6.2.8-.1.2-.2.8-1 1-1.3.2-.3.4-.2.7-.1.3.1 1.8.9 2.1 1s.5.2.6.3c.1.4.1.9-.1 1.4-.3.6-1.5 1.2-2.1 1.3-.6.1-1.3.2-4.1-1S9 13.9 8 12.2c-.2-.3-1.4-2-1.4-3.7 0-.2 0-.6.2-1z" />,
  globe: <><circle cx="12" cy="12" r="10" /><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" /></>,
  chat: <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />,
  check: <path d="M20 6 9 17l-5-5" />,
  star: <path d="m12 2 3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z" />,
  play: <path d="M6 3l15 9-15 9V3z" />,
  user: <><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></>,
  shield: <><path d="M12 2 4 5v6c0 5 3.4 8.2 8 9 4.6-.8 8-4 8-9V5z" /><path d="m9 12 2 2 4-4" /></>,
  pin: <><path d="M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11z" /><circle cx="12" cy="10" r="2.4" /></>,
  truck: <><path d="M3 5h11v11H3z" /><path d="M14 9h4l3 3v4h-7z" /><circle cx="7" cy="18" r="2" /><circle cx="18" cy="18" r="2" /></>,
  download: <><path d="M12 3v12" /><path d="m7 10 5 5 5-5" /><path d="M5 21h14" /></>,
  'file-text': <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" /><path d="M9 13h6M9 17h6" /></>,
  search: <><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></>,
  instagram: <><rect height="20" rx="5" ry="5" width="20" x="2" y="2" /><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" /><path d="M17.5 6.5h.01" /></>,
  linkedin: <><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-7a6 6 0 0 1 6-6z" /><rect height="12" width="4" x="2" y="9" /><circle cx="4" cy="4" r="2" /></>,
  facebook: <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />,
  x: <><path d="M5 4 19 20M19 4 5 20" /></>,
  youtube: <><path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z" /><path d="m9.75 15.02 5.75-3.27-5.75-3.27z" /></>,
}

/** Static SVG icon set for the public site — a distinct, deliberately small set from the admin
 * icon-picker in `src/components/components/componentIcons.tsx` (which resolves per-Component
 * library glyphs, not runtime UI icons). `name` should come from CMS content (e.g. a
 * ContactAction's `icon` field); an unrecognized name renders nothing rather than throwing, since
 * editorial content shouldn't be able to crash the page. */
export default function Icon({ ariaHidden = true, name, size = 20, title }: { ariaHidden?: boolean; name: string; size?: number; title?: string }) {
  const path = paths[name as IconName]
  // Page Builder stores Lucide selections as kebab-case (for example `circle-help`). The
  // original hand-tuned SVGs remain authoritative for the established site icons; this fallback
  // lets Content use the complete approved picker without an unknown icon disappearing publicly.
  if (!path) return <LucideFallbackIcon ariaHidden={ariaHidden} name={name} size={size} title={title} />
  return (
    <svg aria-hidden={ariaHidden} className="icon" fill="none" height={size} role={title ? 'img' : undefined} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width={size}>
      {title ? <title>{title}</title> : null}
      {path}
    </svg>
  )
}
