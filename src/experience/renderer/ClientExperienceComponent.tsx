'use client'

import dynamic from 'next/dynamic'
import type { ComponentType, ReactNode } from 'react'
import type { ExperienceComponentProps, ExperienceSite } from '@/experience/registry/componentRegistry'
import Icon from '@/experience/components/atoms/Icon'
import Media from '@/experience/components/atoms/Media'
import CTAButton from '@/experience/components/molecules/CTAButton'

type Props = ExperienceComponentProps & { code: string; children?: ReactNode }
type ExperienceComponent = ComponentType<ExperienceComponentProps>
type FirstAidTabsProps = { tabs: Array<Record<string, unknown>>; locale: string; site: ExperienceSite }
type FirstAidScheduledAppointmentsProps = { tabs: Array<Record<string, unknown>>; locale: string }
type ContentModalProps = { children: ReactNode; locale: string; modalKey: string }
type YouTubeProps = { posterUrl: string; title: string; videoId: string }

// Keep interactive page organisms behind client-side split points. The PageRenderer is a Server
// Component, so calling next/dynamic from there would not split its Client Component graph.
const clientComponents: Record<string, ExperienceComponent> = {
  'blog-detail': dynamic(() => import('@/experience/components/organisms/BlogPostDetail')),
  'blog-listing': dynamic(() => import('@/experience/components/organisms/BlogListingSection')),
  faq: dynamic(() => import('@/experience/components/organisms/FAQSection')),
  form: dynamic(() => import('@/experience/components/organisms/Form')),
  hero: dynamic(() => import('@/experience/components/organisms/Hero')),
  'hero-carousel': dynamic(() => import('@/experience/components/organisms/Hero')),
  'plan-comparison': dynamic(() => import('@/experience/components/organisms/PlanComparisonSection')),
  'plan-showcase': dynamic(() => import('@/experience/components/organisms/PlansShowcaseSection')),
  'search-results': dynamic(() => import('@/experience/components/organisms/SearchResultsSection')),
  header: dynamic(() => import('@/experience/components/organisms/SiteHeader')),
  'site-header': dynamic(() => import('@/experience/components/organisms/SiteHeader')),
  'bdil-header': dynamic(() => import('@/experience/components/organisms/SiteHeader')),
  'testimonial-showcase': dynamic(() => import('@/experience/components/organisms/TestimonialsSection')),
}
const FirstAidGuideTabsClient = dynamic<FirstAidTabsProps>(() => import('@/experience/components/organisms/FirstAidGuideTabs'))
const FirstAidScheduledAppointmentsClient = dynamic<FirstAidScheduledAppointmentsProps>(() => import('@/experience/components/organisms/FirstAidScheduledAppointments'))
const ContentModalClient = dynamic<ContentModalProps>(() => import('@/experience/components/molecules/ContentModal'))
const YouTubeVideoClient = dynamic<YouTubeProps>(() => import('@/experience/components/molecules/YouTubeVideoFacade'))

const normalize = (code: string) => code.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')

export default function ClientExperienceComponent({ code, content, locale, site, settings, instanceId, children }: Props) {
  const normalized = normalize(code)
  if (normalized === 'icon') return <Icon name={String(content.name ?? '')} size={Number(content.size ?? 24)} />
  if (normalized === 'media') return <Media alt={String(content.alt ?? '')} className={String(content.className ?? '')} objectFit={content.objectFit as 'contain' | 'cover' | undefined} src={String(content.src ?? '')} />
  if (normalized === 'modal-trigger') return <CTAButton className={String(content.className ?? '')} cta={{ showIcon: Boolean(content.icon), icon: content.icon ? String(content.icon) : undefined, ...(content.cta as object | undefined), label: String((content.cta as { label?: unknown } | undefined)?.label ?? content.label ?? ''), linkType: 'popup', modalKey: String((content.cta as { modalKey?: unknown } | undefined)?.modalKey ?? content.modalKey ?? ''), variant: ((content.cta as { variant?: unknown } | undefined)?.variant ?? content.variant) as import('@/experience/components/atoms/Button').ButtonVariant | undefined }} locale={locale} site={site} />
  if (normalized === 'content-modal') return <ContentModalClient locale={locale} modalKey={String(content.modalKey ?? '')}>{children}</ContentModalClient>
  if (normalized === 'youtube-video') return <YouTubeVideoClient posterUrl={String(content.posterUrl ?? '')} title={String(content.title ?? '')} videoId={String(content.videoId ?? '')} />
  if (normalized === 'first-aid-guide-tabs') return <FirstAidGuideTabsClient tabs={Array.isArray(content.tabs) ? content.tabs as Array<Record<string, unknown>> : []} locale={locale} site={site} />
  if (normalized === 'first-aid-scheduled-appointments') return <FirstAidScheduledAppointmentsClient tabs={Array.isArray(content.tabs) ? content.tabs as Array<Record<string, unknown>> : []} locale={locale} />
  const Component = clientComponents[normalized]
  return Component ? <Component content={content} instanceId={instanceId} locale={locale} settings={settings} site={site} /> : null
}
