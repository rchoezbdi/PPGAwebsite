import React from 'react'
import dynamic from 'next/dynamic'
import ClientExperienceComponent from '@/experience/renderer/ClientExperienceComponent'
import AlertBar from '@/experience/components/organisms/AlertBar'
import AudienceSelectorSection from '@/experience/components/organisms/AudienceSelectorSection'
import FloatingChat from '@/experience/components/organisms/FloatingChat'
import GlobalCareStatement from '@/experience/components/organisms/GlobalCareStatement'
import PlanAudienceCards from '@/experience/components/organisms/PlanAudienceCards'
import QuickActionsSection from '@/experience/components/organisms/QuickActionsSection'
import ServiceActionGrid from '@/experience/components/organisms/ServiceActionGrid'
import InsuranceBenefitsGrid from '@/experience/components/organisms/InsuranceBenefitsGrid'
import SectionCTA from '@/experience/components/organisms/SectionCTA'
import SiteFooter from '@/experience/components/organisms/SiteFooter'
import TrustMetricsSection from '@/experience/components/organisms/TrustMetricsSection'
import TrustStoryCollage from '@/experience/components/organisms/TrustStoryCollage'
import CompanyImpactMetrics from '@/experience/components/organisms/CompanyImpactMetrics'
import FirstAidScheduledAppointments from '@/experience/components/organisms/FirstAidScheduledAppointments'
import CardGridSection from '@/experience/components/organisms/CardGridSection'
import RichContentSection from '@/experience/components/organisms/RichContentSection'
import BackToTopWidgetComponent from '@/experience/components/organisms/BackToTopWidget'
import ContainerSection from '@/experience/components/organisms/ContainerSection'
import FallbackSection from '@/experience/components/organisms/FallbackSection'
import ButtonAtom from '@/experience/components/atoms/ButtonAtom'
import TextAtom from '@/experience/components/atoms/TextAtom'
import type { ExperienceComponentProps, ExperienceSite, NavigationItem } from '@/experience/components/types'
import { AlignWrap, BadgeAtom, DividerAtom, EmbedAtom, HeadingAtom, ImageAtom, LinkAtom, MediaAtom, RichTextAtom, SpacerAtom, VideoAtom } from '@/experience/components/atoms/BlogVisualAtoms'

const FeaturesSection = dynamic(() => import('@/experience/components/organisms/FeaturesSection'))

export type { ExperienceComponentProps, ExperienceSite, NavigationItem }

/**
 * Maps a backend `Component.code` (e.g. "hero", "card-grid") to the React component that
 * renders it. This is the single place new component codes get wired up — PageRenderer never
 * branches on a type string itself, it only looks codes up here.
 *
 * Real organisms (Hero, the *Section components, SiteHeader/SiteFooter, AlertBar,
 * FloatingChat) live under `src/experience/components/{atoms,molecules,organisms}` and are built
 * by composing the shared atom/molecule library — see that directory for the Atomic Design layer.
 * Every visual component lives in `components/`; this file only wires codes to them. Form lives in its own file (organisms/Form.tsx)
 * because it needs real client-side submit handling — see dispatchFormSubmission.ts for where a
 * submission goes after it's saved.
 */

/** Normalizes a backend `code` (or a legacy PascalCase `type`) to a lookup key: lowercase,
 * non-alphanumerics collapsed to single hyphens. "CardGrid", "card-grid" and "card_grid" all
 * resolve to the same entry. */
export const normalizeComponentCode = (code: string): string =>
  code
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

const registryEntries: Record<string, React.ComponentType<ExperienceComponentProps>> = {
  image: ImageAtom,
  video: VideoAtom,
  media: MediaAtom,
  heading: HeadingAtom,
  divider: DividerAtom,
  spacer: SpacerAtom,
  embed: EmbedAtom,
  link: LinkAtom,
  badge: BadgeAtom,
  'rich-text': RichTextAtom,
  text: TextAtom,
  button: (props) => <AlignWrap align={props.content.align}><ButtonAtom {...props} /></AlignWrap>,
  'section-layout': RichContentSection,
  container: ContainerSection,
  'media-carousel': CardGridSection,
  'rich-content': RichContentSection,
  'media-content': RichContentSection,
  'quick-actions': QuickActionsSection,
  'first-aid-scheduled-appointments': FirstAidScheduledAppointments,
  'service-action-grid': ServiceActionGrid,
  'insurance-benefits-grid': InsuranceBenefitsGrid,
  'plan-audience-cards': PlanAudienceCards,
  'global-care-statement': GlobalCareStatement,
  'trust-story-collage': TrustStoryCollage,
  'company-impact-metrics': CompanyImpactMetrics,
  'audience-selector': AudienceSelectorSection,
  'card-grid': CardGridSection,
  card: CardGridSection,
  'feature-grid': FeaturesSection,
  cta: SectionCTA,
  stats: TrustMetricsSection,
  footer: SiteFooter,
  'bdil-footer': SiteFooter,
  'announcement-bar': AlertBar,
  'floating-chat': FloatingChat,
  'back-to-top-widget': BackToTopWidgetComponent,
}

const clientComponentCodes = [
  'hero', 'hero-carousel', 'plan-showcase', 'plan-comparison', 'faq', 'testimonial-showcase',
  'blog-listing', 'blog-detail', 'search-results', 'form', 'header', 'bdil-header',
]
for (const code of clientComponentCodes) {
  registryEntries[code] = (props) => <ClientExperienceComponent {...props} code={code} />
}

export const componentRegistry: Readonly<Record<string, React.ComponentType<ExperienceComponentProps>>> = registryEntries

export function resolveComponent(code: string): React.ComponentType<ExperienceComponentProps> {
  return componentRegistry[normalizeComponentCode(code)] ?? FallbackSection
}
