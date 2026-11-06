import type { ReactNode } from 'react'
import type { Metadata } from 'next'
import { headers } from 'next/headers'
import { DesignSystemBaseStyle } from '@/experience/design-system/DesignSystemRuntime'
import 'react-day-picker/style.css'
import './styles.css'

export const metadata: Metadata = { title: { default: 'International Health Insurance | Best Doctors Insurance', template: '%s | Best Doctors Insurance' }, icons: { icon: '/favicon.png' } }
export default async function RootLayout({ children }: { children: ReactNode }) {
  const locale = (await headers()).get('x-site-locale') ?? 'en'
  return <html lang={locale}><body><DesignSystemBaseStyle />{children}</body></html>
}
