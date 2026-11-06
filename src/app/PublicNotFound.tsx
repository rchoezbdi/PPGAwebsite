'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import styles from './public-not-found.module.css'

const copy = {
  en: { title: 'This page is no longer available.', action: 'Go to homepage', nav: { home: 'Home', plans: 'Our plans', about: 'About us', blog: 'Blog', support: 'Support' }, paths: { plans: 'our-plans', about: 'who-we-are', support: 'support' } },
  es: { title: 'Esta página ya no está disponible.', action: 'Ir al inicio', nav: { home: 'Inicio', plans: 'Nuestros planes', about: 'Quiénes somos', blog: 'Blog', support: 'Soporte' }, paths: { plans: 'nuestros-planes', about: 'quienes-somos', support: 'soporte' } },
  pt: { title: 'Esta página não está mais disponível.', action: 'Ir para o início', nav: { home: 'Início', plans: 'Nossos planos', about: 'Quem somos', blog: 'Blog', support: 'Suporte' }, paths: { plans: 'nossos-planos', about: 'quem-nos-somos', support: 'suporte' } },
} as const
type Locale = keyof typeof copy

function localeFromPath(pathname: string | null): Locale {
  const segment = pathname?.split('/').filter(Boolean)[0]
  return segment === 'es' || segment === 'pt' ? segment : 'en'
}

export default function PublicNotFound() {
  const locale = localeFromPath(usePathname())
  const content = copy[locale]
  const home = `/${locale}`
  return <main className={styles.page} lang={locale}>
    <header className={styles.header}>
      <Link aria-label="Best Doctors Insurance" href={home}><Image alt="Best Doctors Insurance" className={styles.logo} height={35} priority src="/brand-logo-white.svg" width={140} /></Link>
      <nav aria-label="Main navigation" className={styles.nav}>
        <Link href={home}>{content.nav.home}</Link><Link href={`/${locale}/${content.paths.plans}`}>{content.nav.plans}</Link><Link href={`/${locale}/${content.paths.about}`}>{content.nav.about}</Link><Link href={`/${locale}/blog`}>{content.nav.blog}</Link><Link href={`/${locale}/${content.paths.support}`}>{content.nav.support}</Link><span aria-hidden="true" className={styles.search}>⌕</span>
      </nav>
    </header>
    <section className={styles.content}>
      <Image alt="Best Doctors Insurance 404 robot" className={styles.robot} height={1536} priority src="/api/media/file/Kit-404-1407x1536.webp" width={1407} />
      <div className={styles.copy}><strong>404</strong><h1>{content.title}</h1><div className={styles.actions}><Link className={styles.primary} href={home}>{content.action} <span aria-hidden="true">⌂</span></Link></div></div>
    </section>
  </main>
}
