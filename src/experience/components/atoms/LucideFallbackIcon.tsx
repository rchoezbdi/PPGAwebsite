'use client'

import { useEffect, useState } from 'react'
import type { LucideIcon } from 'lucide-react'

export default function LucideFallbackIcon({ ariaHidden, name, size, title }: { ariaHidden: boolean; name: string; size: number; title?: string }) {
  const [LibraryIcon, setLibraryIcon] = useState<LucideIcon | null>(null)
  useEffect(() => {
    let active = true
    const libraryName = name.split(/[-_\s]+/).filter(Boolean).map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join('')
    void import('lucide-react').then(({ icons }) => {
      if (active) setLibraryIcon((icons[libraryName as keyof typeof icons] as LucideIcon | undefined) ?? null)
    })
    return () => { active = false }
  }, [name])
  return LibraryIcon ? <LibraryIcon aria-hidden={ariaHidden} aria-label={title} className="icon" role={title ? 'img' : undefined} size={size} /> : null
}
