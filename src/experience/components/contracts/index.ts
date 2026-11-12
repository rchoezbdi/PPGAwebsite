import type { ComponentEditingPolicy } from './types'

const policies: ComponentEditingPolicy[] = [
  { type: 'SectionLayout', presentationOnly: true },
  { type: 'BackToTopWidget', presentationOnly: true },
  { type: 'MediaCarousel', functional: ['items.type'], excluded: ['items.videoURL'] },
  { type: 'RichContent', functional: ['embed.provider'], excluded: ['statementImage', 'statementImageAlt'] },
  { type: 'QuickActions', excluded: ['actions.analyticsEvent'] },
  { type: 'ServiceActionGrid', excluded: ['decorationAlt'] },
  { type: 'AudienceSelector', excluded: ['audiences.audienceKey'] },
  { type: 'CardGrid', functional: ['buttonVariant'], excluded: ['backgroundMedia', 'backgroundMediaMobile', 'cards.analyticsEvent'] },
  { type: 'PlanShowcase', functional: ['source', 'documentType'] },
  { type: 'PlanComparison', functional: ['documentType'] },
  { type: 'Stats', excluded: ['stats.sourceNote'] },
  { type: 'TestimonialShowcase', functional: ['source'] },
  { type: 'BlogListing', functional: ['source'] },
  { type: 'Form', functional: ['buttonVariant', 'buttonIcon'], excluded: ['formRelationship'] },
  { type: 'BdilFooter', functional: ['socialLinks.platform'], excluded: ['customLogo'] },
]

export const componentEditingPolicies: ReadonlyMap<string, ComponentEditingPolicy> = new Map(policies.map((policy) => [policy.type, policy]))
