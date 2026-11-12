import { EDITABLE_BUTTON_VARIANTS } from '@/experience/components/atoms/buttonVariants'

export type ValidationIssue = { path: string; message: string }
export type ValidationResult = { valid: boolean; issues: ValidationIssue[] }
export type ExperienceCategory = 'Contenido' | 'Marketing' | 'Conversion' | 'Productos' | 'Confianza'

export type ExperienceFieldSchema = {
  name: string
  label?: string
  dbName?: string
  type:
    | 'text'
    | 'textarea'
    | 'select'
    | 'colorToken'
    | 'number'
    | 'checkbox'
    | 'group'
    | 'array'
    | 'relationship'
    | 'upload'
    | 'flag'
    | 'richText'
    | 'date'
  /** `button` marks a group that is a Button instance (label, variant, destination). */
  role?: 'button'
  localized?: boolean
  required?: boolean
  defaultValue?: string | number | boolean
  relationTo?: string
  hasMany?: boolean
  options?: string[]
  fields?: ExperienceFieldSchema[]
  minRows?: number
  maxRows?: number
  maxLength?: number
}

export interface ExperienceComponentCatalogItem {
  type: string
  label: string
  description: string
  category: ExperienceCategory
  schemaVersion: number
  defaultProps: Record<string, unknown>
  fields: ExperienceFieldSchema[]
  validate: (props: unknown) => ValidationResult
}

const damMediaUrl = (filename: string) => `/api/media/file/${filename}?prefix=experience-platform%2Fmedia`

export const planAudienceCardImages = {
  individuals: {
    desktop: damMediaUrl('Group-651.webp'),
    mobile: damMediaUrl('Group-664.webp'),
  },
  companies: {
    desktop: damMediaUrl('Group-646.webp'),
    mobile: damMediaUrl('Mask-group-6.webp'),
  },
} as const

const text = (name: string, required = false, localized = true): ExperienceFieldSchema => ({ name, type: 'text', required, localized })
const textarea = (name: string, required = false, localized = true): ExperienceFieldSchema => ({ name, type: 'textarea', required, localized })
const boundedText = (name: string, maxLength: number, required = false): ExperienceFieldSchema => ({ ...text(name, required), maxLength })
const boundedTextarea = (name: string, maxLength: number): ExperienceFieldSchema => ({ ...textarea(name), maxLength })
const select = (name: string, options: string[], defaultValue?: string, dbName?: string): ExperienceFieldSchema => ({ name, type: 'select', options, defaultValue, dbName })
const colorToken = (name: string, label = 'Color del texto'): ExperienceFieldSchema => ({ name, label, type: 'colorToken' })
const number = (name: string, defaultValue?: number): ExperienceFieldSchema => ({ name, type: 'number', defaultValue })
const checkbox = (name: string, defaultValue = false): ExperienceFieldSchema => ({ name, type: 'checkbox', defaultValue })
const cta = (name: string, chevronOnly = false): ExperienceFieldSchema => ({
  name,
  // Labeled as "Button" (not "CTA") on purpose: these fields (label/href/variant) are exactly
  // the Button atom's own props (`atoms/Button.tsx`) — this group IS a Button instance, just
  // stored inline rather than as a separate `components` row. The shape (which fields exist) is
  // shared by every component that calls `cta()`; the values an editor types stay per-instance,
  // same as any other CMS field — that part is intentional, not a gap.
  label: /^primary/i.test(name) ? 'Primary Button' : /^secondary/i.test(name) ? 'Secondary Button' : 'Button',
  type: 'group',
  role: 'button',
  fields: [
    // Ideal length is BUTTON_LABEL_IDEAL_LIMIT (30); the hard cap keeps layouts intact.
    boundedText('label', 60),
    select('variant', [...EDITABLE_BUTTON_VARIANTS], 'primary', `${name.slice(0, 8)}_var`),
    // Type Link: internal page, external URL, mail, tel, popup or none.
    select('linkType', ['internal', 'external', 'mail', 'tel', 'popup', 'none'], 'internal', `${name.slice(0, 8)}_link`),
    pageLink(),
    { name: 'url', label: 'URL externa', type: 'text' },
    { name: 'email', label: 'Correo', type: 'text' },
    { name: 'countryCode', label: 'Código de país', type: 'text' },
    { name: 'phone', label: 'Teléfono', type: 'text' },
    // A modal target opens a matching Form/RichContent instance on this page.
    text('modalKey', false, false),
    checkbox('showIcon', true),
    select('icon', chevronOnly ? ['chevron-right'] : ['arrow-right', 'chevron-right', 'external-link', 'none'], chevronOnly ? 'chevron-right' : 'arrow-right', `${name.slice(0, 8)}_icon`),
    select('iconPosition', ['left', 'right'], 'right', `${name.slice(0, 8)}_ipos`),
    { ...checkbox('showButton', true), label: 'Mostrar botón' },
  ],
})
const media = (name = 'media'): ExperienceFieldSchema => ({ name, type: 'upload', relationTo: 'media' })
const pageLink = (): ExperienceFieldSchema => ({ name: 'page', type: 'relationship', relationTo: 'pages' })
const planRelationship = (name: string): ExperienceFieldSchema => ({ name, type: 'relationship', relationTo: 'plans', hasMany: true })
const testimonialRelationship = (name: string): ExperienceFieldSchema => ({ name, type: 'relationship', relationTo: 'testimonials', hasMany: true })
const richText = (name = 'content'): ExperienceFieldSchema => ({ name, type: 'richText', localized: true })

const requiredHeading = (props: unknown): ValidationResult => {
  const value = props as { heading?: unknown; slides?: Array<{ heading?: unknown }> }
  if (Array.isArray(value?.slides) && value.slides.length > 0) {
    const firstHeading = value.slides[0]?.heading
    const valid = typeof firstHeading === 'string' && firstHeading.trim().length > 0
    return { valid, issues: valid ? [] : [{ path: 'slides.0.heading', message: 'Heading is required on first slide.' }] }
  }
  const valid = typeof value?.heading === 'string' && value.heading.trim().length > 0
  return { valid, issues: valid ? [] : [{ path: 'heading', message: 'Heading is required.' }] }
}

const valid = (): ValidationResult => ({ valid: true, issues: [] })

export const componentCatalog: ExperienceComponentCatalogItem[] = [
  {
    type: 'SectionLayout',
    label: 'Section Layout',
    description: 'Flexible section container with editable layout, spacing, background and decorative edges.',
    category: 'Contenido',
    schemaVersion: 1,
    defaultProps: { width: 'wide', layout: 'column', alignment: 'left', verticalAlignment: 'center', gap: 24, paddingTop: 64, paddingBottom: 64, background: 'transparent', bottomShape: 'none', bottomShapeHeight: 48 },
    validate: valid,
    fields: [
      text('anchor', false, false),
      select('width', ['content', 'wide', 'full'], 'wide', 'sl_width'),
      select('layout', ['column', 'row', 'grid-2', 'grid-3', 'grid-4'], 'column', 'sl_layout'),
      select('alignment', ['left', 'center', 'right'], 'left', 'sl_align'),
      select('verticalAlignment', ['start', 'center', 'end', 'stretch'], 'center', 'sl_valign'),
      number('gap', 24), number('paddingTop', 64), number('paddingBottom', 64),
      select('background', ['transparent', 'white', 'light', 'primary', 'secondary', 'image'], 'transparent', 'sl_bg'),
      media('backgroundMedia'), checkbox('overlay', false),
      select('bottomShape', ['none', 'curve', 'wave', 'angle'], 'none', 'sl_shape'),
      number('bottomShapeHeight', 48), text('bottomShapeColor', false, false),
      checkbox('reverseOnMobile', false), text('cssClass', false, false),
    ],
  },
  {
    type: 'Hero',
    label: 'Hero',
    description: 'Main page hero with single slide or progressive carousel.',
    category: 'Marketing',
    schemaVersion: 3,
    defaultProps: {
      slides: [
        {
          eyebrow: '',
          heading: 'Building accessible, high-quality international healthcare solutions',
          subtitle: '',
          description: 'Renowned for its legacy of service, Best Doctors Insurance offers access to high-quality international healthcare to individuals, families and organizations across Latin America, the Caribbean, and Canada.',
          additionalText: '',
          backgroundType: 'gradient',
          backgroundColor: 'color.brand',
          gradientFrom: 'color.text-highlight',
          gradientTo: 'color.brand',
          gradientType: 'linear',
          gradientShape: 'ellipse',
          gradientAngle: 135,
          theme: 'dark',
          overlay: true,
          overlayOpacity: 45,
          alignment: 'left',
          contentPosition: 'center',
          headingLevel: 'h1',
          primaryCTA: { label: 'Get started', href: '/contact', variant: 'bright' },
        },
      ],
      height: 'large',
      autoplay: false,
      interval: 6000,
      loop: true,
      transition: 'fade',
      showArrows: true,
      arrowStyle: 'circle',
      showPagination: true,
      showSinglePagination: false,
      indicatorStyle: 'circle',
      pauseOnHover: true,
      bottomShape: 'curve',
      bottomShapeDirection: 'down',
      bottomShapeHeight: 64,
      bottomShapeColor: 'color.surface',
      paddingTop: 0,
      paddingBottom: 0,
      marginTop: 0,
      marginBottom: 0,
    },
    validate: requiredHeading,
    fields: [
      {
        name: 'slides',
        type: 'array',
        minRows: 1,
        fields: [
          boundedText('eyebrow', 36),
          boundedText('heading', 70, true),
          { ...text('headingHighlight'), label: 'Texto resaltado' },
          boundedText('subtitle', 100),
          boundedTextarea('description', 220),
          { name: 'deviceCopy', label: 'Copy por dispositivo (opcional)', type: 'group', fields: [
            { name: 'tablet', label: 'Tablet', type: 'group', fields: [{ ...boundedText('eyebrowText', 32), label: 'Eyebrow' }, { ...boundedText('headingText', 60), label: 'Título' }, { ...boundedText('subtitleText', 90), label: 'Subtítulo' }, { ...boundedTextarea('descriptionText', 180), label: 'Descripción' }] },
            { name: 'mobile', label: 'Móvil', type: 'group', fields: [{ ...boundedText('eyebrowText', 28), label: 'Eyebrow' }, { ...boundedText('headingText', 48), label: 'Título' }, { ...boundedText('subtitleText', 80), label: 'Subtítulo' }, { ...boundedTextarea('descriptionText', 160), label: 'Descripción' }] },
          ] },
          textarea('additionalText'),
          select('backgroundType', ['transparent', 'color', 'gradient', 'image', 'video', 'embed'], 'gradient', 'h_s_bg'),
          text('backgroundColor', false, false),
          text('gradientFrom', false, false),
          text('gradientTo', false, false),
          { ...select('gradientType', ['linear', 'radial', 'conic'], 'linear'), label: 'Tipo de degradado' },
          { ...select('gradientShape', ['circle', 'ellipse'], 'ellipse'), label: 'Forma radial' },
          number('gradientAngle', 135),
          media('mediaDesktop'),
          media('mediaTablet'),
          media('mediaMobile'),
          { ...select('layout', ['default', 'split', 'mascot', 'first-aid-kit'], 'default'), label: 'Diseño del Hero' },
          { ...media('kitMedia'), label: 'Imagen del maletín (Hero First Aid Kit)' },
          { ...text('kitImageAlt'), label: 'Texto alternativo del maletín' },
          { ...media('titleMedia'), label: 'Imagen del título (Hero First Aid Kit)' },
          { ...media('sideMedia'), label: 'Arte combinado (Hero First Aid Kit)' },
          text('imageUrl', false, false),
          text('tabletImageUrl', false, false),
          text('mobileImageUrl', false, false),
          media('video'),
          media('videoTablet'),
          media('videoMobile'),
          text('videoUrl', false, false),
          text('tabletVideoUrl', false, false),
          text('mobileVideoUrl', false, false),
          media('poster'),
          media('posterTablet'),
          text('posterUrl', false, false),
          text('tabletPosterUrl', false, false),
          text('embedUrl', false, false),
          { ...select('tabletBackgroundType', ['inherit', 'transparent', 'color', 'gradient', 'image', 'video', 'embed'], 'inherit'), label: 'Fondo Tablet' },
          text('tabletBackgroundColor', false, false),
          text('tabletGradientFrom', false, false),
          text('tabletGradientTo', false, false),
          { ...select('tabletGradientType', ['linear', 'radial', 'conic'], 'linear'), label: 'Tipo de degradado Tablet' },
          { ...select('tabletGradientShape', ['circle', 'ellipse'], 'ellipse'), label: 'Forma radial Tablet' },
          number('tabletGradientAngle', 135),
          text('tabletEmbedUrl', false, false),
          { ...select('mobileBackgroundType', ['inherit', 'transparent', 'color', 'gradient', 'image', 'video', 'embed'], 'inherit'), label: 'Fondo Mobile' },
          text('mobileBackgroundColor', false, false),
          text('mobileGradientFrom', false, false),
          text('mobileGradientTo', false, false),
          { ...select('mobileGradientType', ['linear', 'radial', 'conic'], 'linear'), label: 'Tipo de degradado Mobile' },
          { ...select('mobileGradientShape', ['circle', 'ellipse'], 'ellipse'), label: 'Forma radial Mobile' },
          number('mobileGradientAngle', 135),
          media('posterMobile'),
          text('mobilePosterUrl', false, false),
          text('mobileEmbedUrl', false, false),
          { ...checkbox('videoAutoplay', true), label: 'Reproducir video automáticamente' },
          checkbox('overlay', true),
          number('overlayOpacity', 45),
          { ...select('alignment', ['left', 'center', 'right'], 'left', 'h_s_align'), label: 'Alineación del texto' },
          select('contentPosition', ['start', 'center', 'end'], 'center', 'h_s_cpos'),
          select('theme', ['light', 'dark'], 'dark', 'h_s_theme'),
          select('headingLevel', ['h1', 'h2'], 'h1', 'h_s_hlvl'),
          cta('primaryCTA', true),
          cta('secondaryCTA', true),
        ],
      },
      select('height', ['small', 'medium', 'large', 'screen'], 'large', 'hero_height'),
      checkbox('autoplay', false),
      number('interval', 6000),
      checkbox('loop', true),
      select('transition', ['fade', 'slide'], 'fade', 'hero_transition'),
      checkbox('showArrows', true),
      select('arrowStyle', ['circle', 'square', 'glass', 'minimal'], 'circle', 'hero_arrows'),
      checkbox('showPagination', true),
      checkbox('showSinglePagination', false),
      select('indicatorStyle', ['circle', 'square', 'triangle', 'number'], 'circle', 'hero_dots'),
      checkbox('pauseOnHover', true),
      { ...select('bottomShape', ['none', 'curve', 'wave', 'angle'], 'none', 'hero_shape'), label: 'Forma de la base del Hero' },
      { ...select('bottomShapeDirection', ['down', 'up'], 'down', 'hero_shape_dir'), label: 'Dirección de la forma' },
      { ...number('bottomShapeHeight', 48), label: 'Altura de la forma' },
      number('paddingTop', 0),
      number('paddingBottom', 0),
      number('marginTop', 0),
      number('marginBottom', 0),
    ],
  },
  {
    type: 'MediaCarousel',
    label: 'Media Carousel',
    description: 'Reusable image and video carousel with responsive presentation.',
    category: 'Contenido',
    schemaVersion: 1,
    defaultProps: { columnsDesktop: 3, columnsTablet: 2, columnsMobile: 1, gap: 20, autoplay: false, interval: 5000, showArrows: true, showPagination: true, aspectRatio: 'landscape', mediaFit: 'cover' },
    validate: valid,
    fields: [
      text('eyebrow'), text('heading'), textarea('description'),
      { name: 'items', type: 'array', minRows: 1, fields: [select('type', ['image', 'video'], 'image', 'mcar_type'), media(), media('poster'), text('videoURL', false, false), text('alt'), text('caption'), cta('link')] },
      number('columnsDesktop', 3), number('columnsTablet', 2), number('columnsMobile', 1), number('gap', 20),
      checkbox('autoplay', false), number('interval', 5000), checkbox('loop', true), checkbox('showArrows', true), checkbox('showPagination', true),
      select('aspectRatio', ['auto', 'square', 'portrait', 'landscape', 'wide'], 'landscape', 'mcar_ratio'),
      select('mediaFit', ['cover', 'contain'], 'cover', 'mcar_fit'),
    ],
  },
  {
    type: 'RichContent',
    label: 'Rich Content',
    description: 'Editorial text.',
    category: 'Contenido',
    schemaVersion: 3,
    defaultProps: { width: 'content', alignment: 'left', background: 'white', spacing: 'normal' },
    validate: valid,
    // Match the live renderer. `content` remains as legacy fallback, but editors always see the
    // actual title, highlighted fragment, description and CTA used on the page.
    fields: [text('eyebrow'), text('heading'), colorToken('headingColor', 'Color del titulo'), text('headingHighlight'), colorToken('headingHighlightColor'), text('subheading'), { name: 'offerings', type: 'array', minRows: 0, maxRows: 8, fields: [text('text', true)] }, { name: 'gallery', type: 'array', minRows: 0, maxRows: 3, fields: [media('image'), text('imageUrl', false, false), text('alt')] }, text('cardHeading'), textarea('description'), cta('cta'), media('image'), media('imageMobile'), text('imageAlt'), media('statementImage'), text('statementImageAlt'), text('imageUrl', false, false), text('imageMobileUrl', false, false), text('linkLabel'), text('url', false, false), richText(), { name: 'embed', type: 'group', fields: [select('provider', ['youtube', 'paycom'], 'youtube'), text('url', true, false), text('title'), text('posterUrl', false, false)] }, select('variant', ['default', 'split', 'timeline', 'experience-card', 'distributor-offer', 'financial-difference', 'financial-difference-signature', 'first-aid-guide-heading', 'first-aid-guide-tabs', 'first-aid-scheduled-appointments'], 'default', 'rc_variant'), { name: 'tabs', type: 'array', minRows: 0, maxRows: 8, fields: [text('label', true), text('heading', true), textarea('description'), text('subheading'), text('closing'), text('linkLabel'), text('url', false, false), cta('cta'), media('image'), text('imageAlt'), media('additionalImage'), text('additionalImageAlt'), { name: 'items', type: 'array', minRows: 0, maxRows: 6, fields: [text('label', true), media('image'), text('imageAlt')] }, { name: 'tip', type: 'group', fields: [text('heading'), text('intro'), text('value'), text('label'), textarea('description')] }] }, select('width', ['content', 'wide', 'full'], 'content'), select('alignment', ['left', 'center', 'right'], 'left'), select('background', ['white', 'light', 'primary', 'secondary'], 'white'), select('spacing', ['none', 'compact', 'normal', 'wide'], 'normal'),
      select('displayMode', ['inline', 'modal'], 'inline', 'rc_disp'),
      { name: 'modalKey', type: 'text' }],
  },
  {
    type: 'MediaContent',
    label: 'Media Content',
    description: 'Media with editorial content.',
    category: 'Contenido',
    schemaVersion: 1,
    defaultProps: { mediaPosition: 'left', mediaWidth: 'half', theme: 'light', spacing: 'normal' },
    validate: valid,
    fields: [media(), text('mediaAlt'), richText(), select('mediaPosition', ['left', 'right'], 'left', 'mc_pos'), select('mediaWidth', ['third', 'half', 'two-thirds'], 'half', 'mc_width'), select('theme', ['light', 'dark'], 'light', 'mc_theme'), select('spacing', ['compact', 'normal', 'wide'], 'normal', 'mc_space')],
  },
  {
    type: 'QuickActions',
    label: 'Quick Actions',
    description: 'Shortcut actions for key journeys.',
    category: 'Conversion',
    schemaVersion: 1,
    defaultProps: { columnsDesktop: '4', columnsMobile: '2', variant: 'default', background: 'white' },
    validate: requiredHeading,
    fields: [text('eyebrow'), text('heading', true), colorToken('headingColor', 'Color del titulo'), text('headingHighlight'), colorToken('headingHighlightColor'), textarea('description'), colorToken('descriptionColor', 'Color de descripcion'), { name: 'actions', type: 'array', minRows: 1, fields: [{ name: 'icon', type: 'text' }, text('label', true), textarea('description'), select('linkType', ['internal', 'external'], 'internal', 'qa_a_ltyp'), pageLink(), { name: 'url', type: 'text' }, checkbox('newWindow', false), { name: 'analyticsEvent', type: 'text' }] }, select('columnsDesktop', ['2', '3', '4'], '4', 'qa_cdsk'), select('columnsMobile', ['1', '2'], '2', 'qa_cmbl'), select('variant', ['default', 'cards', 'compact'], 'default', 'qa_var'), select('background', ['white', 'light', 'primary', 'secondary'], 'white', 'qa_bg')],
  },
  {
    type: 'ServiceActionGrid',
    label: 'Centro de acciones rápidas',
    description: 'Cuatro accesos principales para resolver recorridos frecuentes del asegurado.',
    category: 'Conversion',
    schemaVersion: 1,
    defaultProps: {
      heading: 'How can we help you today?',
      description: 'Manage your healthcare coverage and complete essential tasks in just minutes',
      actions: [
        { accent: 'Find', label: 'a health insurance plan', linkType: 'external', url: 'https://www.bestdoctorsinsurance.com/en/our-plans/' },
        { accent: 'Start', label: 'a conversation', linkType: 'external', url: 'https://www.bestdoctorsinsurance.com/support/' },
        { accent: 'Pay', label: 'your policy with In$taPay', linkType: 'external', url: 'https://instapay.bestdoctorsinsurance.com/', newWindow: true },
        { accent: 'Become', label: 'a Best Doctors Insurance Distributor', linkType: 'external', url: 'https://www.bestdoctorsinsurance.com/become-a-distributor/' },
      ],
      decorationUrl: damMediaUrl('Ellipse-3-4.webp'),
      decorationAlt: '', animate: true,
    },
    validate: requiredHeading,
    fields: [
      text('heading', true), textarea('description'),
      { name: 'actions', type: 'array', minRows: 1, maxRows: 4, fields: [text('accent', true), text('label', true), select('linkType', ['internal', 'external', 'none'], 'external', 'sag_ltyp'), pageLink(), text('url', false, false), checkbox('newWindow', false)] },
      media('decoration'), text('decorationUrl', false, false), text('decorationAlt'), checkbox('animate', true),
    ],
  },
  {
    type: 'InsuranceBenefitsGrid',
    label: 'Beneficios de cobertura',
    description: 'Cuatro beneficios diferenciales con iconos y enlace de conversión.',
    category: 'Marketing',
    schemaVersion: 1,
    defaultProps: {
      benefits: [
        { title: 'Worldwide coverage', description: 'A comprehensive international health insurance plan with strong maternity care benefits, high medical expense limits, and enhanced emergency coverage.', iconUrl: damMediaUrl('freepik__enhance__27327-1-raster-5.webp'), iconAlt: '' },
        { title: '24/7 customer support', description: 'Reach our team anytime for emergencies, authorizations or questions about your coverage', iconUrl: damMediaUrl('ChatGPT-Image-21-nov-2025-08_22_36-a.m_-1-raster-5.webp'), iconAlt: '' },
        { title: 'Expert medical opinions', description: 'Get complex diagnoses and treatment plans assessed and reviewed through InterConsultation® so you can decide with confidence.', iconUrl: damMediaUrl('ChatGPT-Image-10-dic-2025-09_03_10-p.m.-1-raster-5.webp'), iconAlt: '' },
        { title: 'Stability you can trust', description: 'Decades of experience and strong global partners mean we’re ready to be there when it matters most', iconUrl: damMediaUrl('icon-Stability-you-can-trust-2-1-raster-5.webp'), iconAlt: '' },
      ],
      cta: { label: 'See what makes us different', variant: 'primary', linkType: 'external', url: 'https://www.bestdoctorsinsurance.com/why-best-doctors-insurance/', showIcon: true, icon: 'chevron-right' }, animate: true,
    },
    validate: valid,
    fields: [
      { name: 'benefits', type: 'array', minRows: 1, maxRows: 4, fields: [text('title', true), textarea('description'), media('icon'), text('iconUrl', false, false), text('iconAlt')] },
      cta('cta'), checkbox('animate', true),
    ],
  },
  {
    type: 'PlanAudienceCards',
    label: 'Planes por audiencia',
    description: 'Selector de planes con recorridos separados para personas y empresas.',
    category: 'Productos',
    schemaVersion: 1,
    defaultProps: {
      headingPrefix: 'Find the', headingHighlight: 'right plan', headingSuffix: 'for you',
      cards: [
        { title: 'Individuals & families', cta: { label: 'Find a plan', variant: 'primary', linkType: 'external', url: 'https://www.bestdoctorsinsurance.com/en/our-plans/', showIcon: true, icon: 'arrow-right' }, imageUrl: planAudienceCardImages.individuals.desktop, imageMobileUrl: planAudienceCardImages.individuals.mobile, imageAlt: 'Family covered by an international health plan' },
        { title: 'Companies & employers', cta: { label: 'Learn more', variant: 'primary', linkType: 'external', url: 'https://www.bestdoctorsinsurance.com/en/our-plans/#corporate-group', showIcon: true, icon: 'arrow-right' }, imageUrl: planAudienceCardImages.companies.desktop, imageMobileUrl: planAudienceCardImages.companies.mobile, imageAlt: 'Business leader traveling internationally' },
      ],
      decorationUrl: damMediaUrl('Ellipse-3-4.webp'), animate: true,
    },
    validate: valid,
    fields: [
      text('headingPrefix', true), colorToken('headingColor', 'Color del titulo'), text('headingHighlight', true), colorToken('headingHighlightColor'), text('headingSuffix', true),
      { name: 'cards', type: 'array', minRows: 2, maxRows: 2, fields: [text('title', true), cta('cta'), media('image'), text('imageUrl', false, false), media('imageMobile'), text('imageMobileUrl', false, false), text('imageAlt')] },
      media('decoration'), text('decorationUrl', false, false), checkbox('animate', true),
    ],
  },
  {
    type: 'GlobalCareStatement',
    label: 'Declaración de cuidado global',
    description: 'Declaración editorial con dos imágenes y titulares subrayados animados.',
    category: 'Marketing',
    schemaVersion: 1,
    defaultProps: {
      firstHighlight: 'We combine', secondPrefix: 'global medical access, expert guidance and', secondHighlight: 'care that never sleeps',
      leftImageUrl: damMediaUrl('Frame-2.webp'), leftImageAlt: '',
      rightImageUrl: damMediaUrl('Frame-3.webp'), rightImageAlt: '', animate: true,
    },
    validate: valid,
    fields: [
      text('firstHighlight', true), colorToken('firstHighlightColor'), text('secondPrefix', true), text('secondHighlight', true), colorToken('secondHighlightColor'),
      media('leftImage'), text('leftImageUrl', false, false), text('leftImageAlt'),
      media('rightImage'), text('rightImageUrl', false, false), text('rightImageAlt'), checkbox('animate', true),
    ],
  },
  {
    type: 'TrustStoryCollage',
    label: 'Historia de confianza',
    description: 'Collage editorial que comunica trayectoria, protección y confianza global.',
    category: 'Confianza',
    schemaVersion: 1,
    defaultProps: {
      heading: 'Global health protection', highlight: 'built on trust',
      description: 'For more than 36 years, Best Doctors Insurance Group has supported individuals, families, employers and global citizens with international private health insurance focused on access to medical care, global health services and consistent customer service',
      primaryImageUrl: damMediaUrl('Rectangle-164-1536x749-2.webp'), primaryImageAlt: 'Family enjoying coverage benefits',
      secondaryImageUrl: '/api/media/file/Rectangle-168.webp?prefix=experience-platform%2Fmedia', secondaryImageAlt: 'Man using a tablet',
      tertiaryImageUrl: damMediaUrl('Rectangle-172.webp'), tertiaryImageAlt: 'Couple enjoying their vacation',
      decorationUrl: damMediaUrl('Group-5.webp'), animate: true,
    },
    validate: requiredHeading,
    fields: [
      text('heading', true), text('highlight'), textarea('description'),
      media('primaryImage'), text('primaryImageUrl', false, false), text('primaryImageAlt'),
      media('secondaryImage'), text('secondaryImageUrl', false, false), text('secondaryImageAlt'),
      media('tertiaryImage'), text('tertiaryImageUrl', false, false), text('tertiaryImageAlt'),
      media('decoration'), text('decorationUrl', false, false), checkbox('animate', true),
    ],
  },
  {
    type: 'AudienceSelector',
    label: 'Audience Selector',
    description: 'Selectable audiences for product discovery.',
    category: 'Marketing',
    schemaVersion: 1,
    defaultProps: { layout: 'tabs', imageRatio: 'landscape', background: 'white' },
    validate: requiredHeading,
    fields: [text('heading', true), colorToken('headingColor', 'Color del titulo'), text('headingHighlight'), colorToken('headingHighlightColor'), textarea('description'), colorToken('descriptionColor', 'Color de descripcion'), { name: 'audiences', type: 'array', minRows: 1, fields: [text('title', true), text('subtitle'), textarea('description'), media('image'), text('imageAlt'), media('mobileImage'), cta('cta'), select('audienceKey', ['individual', 'family', 'company', 'broker', 'expatriate', 'digital-nomad'], 'individual', 'aud_key')] }, select('layout', ['tabs', 'cards', 'split'], 'tabs', 'aud_layout'), select('imageRatio', ['square', 'landscape', 'portrait'], 'landscape', 'aud_ratio'), select('background', ['white', 'light', 'primary', 'secondary'], 'white', 'aud_bg')],
  },
  {
    type: 'CardGrid',
    label: 'Card Grid',
    description: 'Governed marketing cards.',
    category: 'Marketing',
    schemaVersion: 1,
    defaultProps: { columns: '3', cardVariant: 'default', alignment: 'left', background: 'white', aspectRatio: 'auto', hoverBehavior: 'lift', collapsible: false },
    validate: requiredHeading,
    fields: [text('eyebrow'), text('heading', true), colorToken('headingColor', 'Color del titulo'), text('headingHighlight'), colorToken('headingHighlightColor'), textarea('description'), colorToken('descriptionColor', 'Color de descripcion'), media('backgroundMedia'), media('backgroundMediaMobile'), { name: 'cards', type: 'array', minRows: 1, maxRows: 30, fields: [media('image'), text('imageAlt'), text('heading', true), { name: 'icon', label: 'Icono titulo', type: 'text' }, textarea('description'), text('imageUrl', false, false), text('badge'), select('linkType', ['internal', 'external'], 'internal', 'cg_c_ltyp'), pageLink(), { name: 'url', type: 'text' }, text('linkLabel'), select('buttonVariant', ['primary', 'secondary', 'outline'], 'primary', 'cg_c_btnvar'), checkbox('showIcon', true), select('buttonIcon', ['arrow-right', 'chevron-right', 'external-link', 'none'], 'arrow-right', 'cg_c_icon'), checkbox('newWindow', false),
      // When set, the card opens the Form/RichContent instance elsewhere on the page whose own
      // `modalKey` matches, in a modal — instead of following `url`. Mutually exclusive with it
      // (see ModalTrigger/ContentModal in componentRegistry.tsx). E.g. Support's "Message" card.
      { name: 'modalKey', type: 'text' },
      { name: 'analyticsEvent', type: 'text' }] }, select('columns', ['2', '3', '4'], '3', 'cg_cols'), select('cardVariant', ['default', 'bordered', 'elevated', 'logo'], 'default', 'cg_var'), select('alignment', ['left', 'center'], 'left', 'cg_align'), select('background', ['white', 'light', 'primary', 'secondary'], 'white', 'cg_bg'), select('aspectRatio', ['auto', 'square', 'landscape'], 'auto', 'cg_ratio'), select('hoverBehavior', ['none', 'lift', 'glow'], 'lift', 'cg_hover'),
      // Optional native <details> disclosure around the whole grid — no client JS needed (same
      // no-code-friendly pattern the FAQ accordion already uses). Matches production's real
      // "View/Hide Standard Products" toggle on Our Plans, which is a plain show/hide, not a
      // second data source — off by default so it never changes any existing CardGrid instance.
      checkbox('collapsible', false), text('collapsedLabel'), text('expandedLabel'), select('variant', ['default', 'providers-carousel', 'related-plans-carousel', 'providers', 'logos'], 'default', 'cg_variant')],
  },
  {
    type: 'FeatureGrid',
    label: 'Feature Grid',
    description: 'Governed benefit list.',
    category: 'Marketing',
    schemaVersion: 1,
    defaultProps: { columns: '3', iconStyle: 'circle', theme: 'light', background: 'white', alignment: 'left', mobileLayout: 'stack' },
    validate: requiredHeading,
    fields: [text('eyebrow'), text('heading', true), colorToken('headingColor', 'Color del titulo'), text('headingHighlight'), colorToken('headingHighlightColor'), textarea('description'), colorToken('descriptionColor', 'Color de descripcion'), { name: 'features', type: 'array', minRows: 1, maxRows: 12, fields: [{ ...checkbox('show', true), label: 'Visible' }, text('heading', true), colorToken('headingColor', 'Color del titulo'), text('headingHighlight'), colorToken('headingHighlightColor'), textarea('description'), colorToken('descriptionColor', 'Color de descripcion'), media('image'), text('imageAlt'), select('iconSource', ['library', 'custom'], 'library', 'fg_f_isrc'), { name: 'iconName', type: 'text' }, media('customIcon'), cta('link'), select('linkType', ['internal', 'external', 'none'], 'none', 'fg_ltyp'), pageLink(), text('url', false, false), checkbox('linkButton', false), checkbox('openInNewWindow', false)] }, cta('primaryCTA'), media('document'), media('customIcon'), text('supportingText'), text('footerText'), { name: 'iconName', type: 'text' }, media('topMedia'), textarea('legalNotice'), textarea('eligibilityNotice'), select('anchorId', ['', 'corporate-group'], '', 'fg_anchor'), select('variant', ['default', 'key-benefits', 'critical-select', 'corporate-group', 'service-tabs', 'first-aid-kit'], 'default', 'fg_variant'), select('columns', ['2', '3', '4'], '3', 'fg_cols'), select('iconStyle', ['none', 'circle', 'square'], 'circle', 'fg_istyl'), select('theme', ['light', 'dark'], 'light', 'fg_theme'), select('background', ['white', 'light', 'primary', 'secondary'], 'white', 'fg_bg'), select('alignment', ['left', 'center'], 'left', 'fg_align'), select('mobileLayout', ['stack', 'carousel'], 'stack', 'fg_mlay')],
  },
  {
    type: 'PlanShowcase',
    label: 'Plan Showcase',
    description: 'Carrusel reutilizable de planes y acceso a la comparación.',
    category: 'Productos',
    schemaVersion: 2,
    defaultProps: {
      background: 'primary', heading: 'Explore our', headingHighlight: 'most popular plans', highlightsLabel: 'Highlights', proLabel: 'Pro', previousLabel: 'Previous plans', nextLabel: 'Next plans',
      plans: [
        { name: 'Medical Elite™', imageUrl: damMediaUrl('a86cb6aa3748dbcf02692a45e2ac9a607fe92631-1-1024x574-1.webp'), shortDescription: 'Our signature plan is designed for maximum coverage and peace of mind.', benefits: [{ text: '100% maternity benefits within the maternity network, with the possibility of insuring up to 2 children at no cost until the age of 10' }, { text: 'Mental health coverage' }, { text: 'Broad preventive benefits' }], primaryCTA: { label: 'View details', href: 'https://www.bestdoctorsinsurance.com/product/medical-elite/' } },
        { name: 'Premier Plus™', imageUrl: damMediaUrl('8af49e8c5b4696412b663b9a451784fc1fc96189-1-1024x574-1.webp'), shortDescription: 'A plan with robust coverage and enhanced protection for a variety of medical needs.', benefits: [{ text: '100% maternity benefits, with the option to include up to 2 children at no cost until age 5.' }, { text: 'Coverage for multiple medical therapies' }, { text: 'Greater coverage for critical or catastrophic events' }], primaryCTA: { label: 'View details', href: 'https://www.bestdoctorsinsurance.com/product/premiere-plus/' } },
        { name: 'Global Care™', imageUrl: damMediaUrl('40851b0b303f4281a2a0d808ef795feee638311f-1-1024x586-1.webp'), shortDescription: 'It delivers comprehensive coverage with seamless access to quality medical care worldwide.', benefits: [{ text: 'A broad network of providers across the United States' }, { text: 'Coverage for maternity and organ transplants' }, { text: 'Palliative care benefits' }], primaryCTA: { label: 'View details', href: 'https://www.bestdoctorsinsurance.com/product/global-care/' } },
        { name: 'Medical Care™', imageUrl: damMediaUrl('e16ec877675d9ada5e338139bd1aa0e9ee1ee392-5.webp'), shortDescription: 'An option that offers key medical coverage for your day-to-day life, both inside and outside your country of residence.', benefits: [{ text: '100% coverage outside the United States' }, { text: 'Medical care in the United States through an extensive network of providers' }, { text: 'Coverage for medical emergencies and transportation included' }], primaryCTA: { label: 'View details', href: 'https://www.bestdoctorsinsurance.com/product/medical-care/' } },
        { name: 'Medical Select™', imageUrl: damMediaUrl('17-Desktop-Isurance-product-BDI-PROStandard-34-1024x532-1.webp'), shortDescription: 'A smart health plan designed to give peace of mind and accompany our members through the different stages of life.', benefits: [{ text: 'Coverage for accidents related to professional sports' }, { text: 'Coverage for Acquired Immunodeficiency Syndrome (HIV)' }, { text: 'Coverage for cancer treatment' }], primaryCTA: { label: 'View details', href: 'https://www.bestdoctorsinsurance.com/product/medical-select/' } },
      ],
      helpHeading: 'Need help deciding?', helpIconUrl: damMediaUrl('icon-question-1-raster-5.webp'), compareCTA: { label: 'Compare all plans', href: 'https://www.bestdoctorsinsurance.com/plan-comparsion/' },
    },
    validate: requiredHeading,
    fields: [
      select('background', ['white', 'light', 'primary', 'secondary', 'home-gradient'], 'primary', 'ps_bg'), select('anchorId', ['', 'individual-plans'], '', 'ps_anchor'), text('heading', true), colorToken('headingColor', 'Color del titulo'), text('headingHighlight'), colorToken('headingHighlightColor'), text('highlightsLabel'), text('proLabel'), { ...checkbox('showProLabel', true), label: 'Resaltar Pro (solo en los planes Pro)' }, text('previousLabel'), text('nextLabel'),
      select('source', ['automatic', 'manual'], 'manual', 'ps_src'), planRelationship('selectedPlans'),
      // Manual curation is the only mode the render layer supports today (no Plans collection to
      // auto-fetch from) — this array is what `plans` actually reads.
      {
        name: 'plans', type: 'array', minRows: 1,
        fields: [
          text('name', true), textarea('shortDescription'), media('image'), text('imageUrl', false, false), text('imageAlt'), { name: 'countryCode', type: 'flag' }, text('availabilityLabel'),
          { name: 'benefits', type: 'array', fields: [text('text', true)] }, cta('primaryCTA'),
          // ADR-004: stable identifiers only. The Page Builder presents the official codes
          // for the App's document issuer, and the proxy checks issuer + planCode server-side.
          { ...text('planCode', false, false), label: 'Código de plan (Product Documents API)' },
          {
            name: 'documents', type: 'array',
            fields: [select('documentType', ['COC', 'TOB'], 'TOB', 'pdoc_type'), { name: 'planOptionCode', type: 'text' }],
          },
        ],
      },
      checkbox('showHelp', true), text('helpHeading'), media('helpIcon'), text('helpIconUrl', false, false), cta('compareCTA'),
    ],
  },
  {
    type: 'PlanComparison',
    label: 'Plan Comparison',
    description: 'Comparador de hasta 3 planes lado a lado, con matriz de beneficios real.',
    category: 'Productos',
    schemaVersion: 1,
    // Values transcribed verbatim from bestdoctorsinsurance.com/en/plan-comparsion/ (23 sep,
    // curl+jsdom against the live production HTML — same "Choose up to three plans" widget the
    // user shared screenshots of). Two real content quirks worth knowing before editing any of
    // these rows by hand: (1) Global Care's "Provider Network" cell and Medical Elite's
    // "Maternity Care" cell are each one production benefit split into several real bullet
    // points where the other plans only have one — not a data-entry mistake, verified against
    // the raw HTML structure directly; (2) `defaultSelection`/`compareTableUrl`/`compareTableLabel`
    // are renderer fields not exposed to the Page Builder. Individual plan images are DAM
    // relationships on each `plans[]` entry.
    defaultProps: {
      heading: 'Compare our plans', description: 'Explore coverage limits, benefits, and key differences to find the plan that fits your needs',
      // "side‑by‑side comparison" (real non-breaking hyphens, verified 23 sep against the live
      // widget's markup) is its own highlighted trailing phrase in production (--text-highlight, same
      // `<mark>`-on-`--text-highlight` convention already used elsewhere — see SectionHeading),
      // not part of the plain heading text — split out into its own field rather than baked in.
      compareHeadingDesktop: 'Choose up to three plans for a', compareHeadingMobile: 'Choose up to two plans for a', compareHeadingHighlight: 'side‑by‑side comparison',
      contactHref: '/home/support',
      plans: [
        { code: 'MEPRO', name: 'Medical Elite™ Pro', planCode: 'MEPRO', detailsHref: '/home/medical-elite', documents: [{ documentType: 'TOB' }, { documentType: 'COC' }] },
        { code: 'PPPRO', name: 'Premier Plus™ Pro', planCode: 'PPPRO', detailsHref: '/home/premiere-plus', documents: [{ documentType: 'TOB' }, { documentType: 'COC' }] },
        { code: 'GCPRO', name: 'Global Care™ Pro', planCode: 'GCPRO', detailsHref: '/home/global-care', documents: [{ documentType: 'TOB' }, { documentType: 'COC' }] },
        { code: 'MCPRO', name: 'Medical Care™ Pro', planCode: 'MCPRO', detailsHref: '/home/medical-care', documents: [{ documentType: 'TOB' }, { documentType: 'COC' }] },
        { code: 'MSPRO', name: 'Medical Select™ Pro', detailsHref: '/home/medical-select', documents: [{ documentType: 'TOB' }, { documentType: 'COC' }] },
      ],
      categories: [
        { heading: 'Key Benefits', rows: [
          { label: 'Maximum Annual Benefit', values: { MEPRO: '$10 million', PPPRO: '$7 million', GCPRO: '$5 million', MCPRO: '$3 million', MSPRO: '$1 million' } },
          { label: 'Provider Network', values: {
            MEPRO: 'Free choice of Providers', PPPRO: 'Free choice of Providers',
            GCPRO: ['Outside the U.S.: Free choice of Providers', 'In the U.S.: Within the GlobalCare Network', 'Services outside the GlobalCare Network covered at 60%'],
            MCPRO: ['Outside the U.S.: Free choice of Providers', 'In the U.S.: Within the MedicalCare Network', 'Services outside the MedicalCare Network covered at 60%'],
            MSPRO: ['No coverage in the U.S.', 'Free choice of Providers', 'Services within Premium Providers Network covered at 60%'],
          } },
        ] },
        { heading: 'Hospitalization', rows: [
          { label: 'Hospital Admission', values: { MEPRO: '100%', PPPRO: '100%', GCPRO: '100%', MCPRO: '100%', MSPRO: '100%' } },
        ] },
        { heading: 'Inpatient and Day Patient', rows: [
          { label: 'Organ and Tissue Transplants', values: { MEPRO: '$3,000,000 lifetime', PPPRO: '$1,100,000 lifetime', GCPRO: '$500,000 lifetime', MCPRO: '$300,000 lifetime', MSPRO: '$300,000 lifetime' } },
          { label: 'Cochlear Implants for Congenital Condition', values: { MEPRO: '$40,000', PPPRO: '$30,000', GCPRO: '$20,000', MCPRO: 'Not covered', MSPRO: 'Not covered' } },
          { label: 'Oncology Treatment', values: { MEPRO: '100%', PPPRO: '100%', GCPRO: '100%', MCPRO: '100%', MSPRO: '100%' } },
          { label: 'Genetic Therapy / CAR T Cell Therapy', values: { MEPRO: '$1,000,000', PPPRO: '$1,000,000', GCPRO: '$1,000,000', MCPRO: '$1,000,000', MSPRO: '$500,000' } },
        ] },
        { heading: 'Outpatient Benefits', rows: [
          { label: 'Prescription Medication', values: { MEPRO: '100%', PPPRO: '100%', GCPRO: '$30,000', MCPRO: '$10,000', MSPRO: '$5,000' } },
          { label: 'Highly Specialized Medications (HSM)', values: { MEPRO: '100%', PPPRO: '100%', GCPRO: '$400,000', MCPRO: '$200,000', MSPRO: '$50,000' } },
          { label: 'Rehabilitation Therapy', values: { MEPRO: '100%', PPPRO: '100%', GCPRO: '$10,000', MCPRO: '$6,000', MSPRO: '$4,000' } },
          { label: 'Home Health Care – Private Nurse', values: { MEPRO: '100%', PPPRO: '100%', GCPRO: '$10,000', MCPRO: '$6,000', MSPRO: '$4,000' } },
        ] },
        { heading: 'Preventive Benefits', rows: [
          { label: 'Adult Routine Health Check-Up', values: { MEPRO: '$750', PPPRO: '$500', GCPRO: '$200', MCPRO: '$150', MSPRO: 'Not covered' } },
          { label: 'Pediatric Routine Health Check-Up', values: { MEPRO: '$400', PPPRO: '$250', GCPRO: '$150', MCPRO: '$100', MSPRO: 'Not covered' } },
        ] },
        { heading: 'Maternity Benefits', rows: [
          { label: 'Maternity Care', values: {
            MEPRO: ['Normal Delivery: 100% within the Best Doctors Insurance Maternity Network;', '$8,000 outside the Best Doctors Insurance Maternity Network;', 'Elective Cesarean Section: $10,000 at any Hospital'],
            PPPRO: '$8,500', GCPRO: '$4,000', MCPRO: '$3,500', MSPRO: '$3,000',
          } },
          { label: 'Complications of Maternity and Birth', values: { MEPRO: '$1,000,000 lifetime/Policy', PPPRO: '$1,000,000 lifetime/Policy', GCPRO: '$500,000 lifetime/Policy', MCPRO: '$250,000 lifetime/Policy', MSPRO: '$125,000 lifetime/Policy' } },
          { label: 'Premium Waiver for Dependent Children Only for children born from Covered Maternity – for 2 children when both parents covered under the Policy – for 1 child when only one parent covered the Policy', values: { MEPRO: 'Dependents up to 10 years old', PPPRO: 'Dependents up to 5 years old', GCPRO: 'Not covered', MCPRO: 'Not covered', MSPRO: 'Not covered' } },
        ] },
        { heading: 'Other Benefits', rows: [
          { label: 'Congenital and Hereditary Disorders (diagnosed before 18 years old)', values: { MEPRO: '$5,000,000 lifetime', PPPRO: '$3,000,000 lifetime', GCPRO: '$500,000 lifetime', MCPRO: '$100,000 lifetime', MSPRO: '$100,000 lifetime' } },
          { label: 'Congenital and Hereditary Disorders (diagnosed at or after 18 years old)', values: { MEPRO: '100%', PPPRO: '100%', GCPRO: '100%', MCPRO: '100%', MSPRO: '100%' } },
          { label: 'Palliative Care / Hospice Services', values: { MEPRO: '100%', PPPRO: '100%', GCPRO: '100%', MCPRO: '100%', MSPRO: '100%' } },
          { label: 'Hearing Aids', values: { MEPRO: '$3,000 lifetime', PPPRO: '$2,000 lifetime', GCPRO: '$1,000 lifetime', MCPRO: '$500 lifetime', MSPRO: 'Not covered' } },
        ] },
      ],
    },
    validate: requiredHeading,
    fields: [
      text('heading', true), textarea('description'), text('compareHeadingDesktop'), text('compareHeadingMobile'), text('compareHeadingHighlight'), cta('contactCTA'), cta('compareTableCTA'),
      {
        name: 'plans', type: 'array', minRows: 1,
        fields: [
          text('code', true), text('name', true), media('image'), text('imageAlt'), cta('detailsCTA'),
          { ...text('planCode', false, false), label: 'Código de plan (Product Documents API)' },
          { name: 'documents', type: 'array', fields: [select('documentType', ['COC', 'TOB'], 'TOB', 'pcmp_doc_type')] },
        ],
      },
      {
        name: 'categories', type: 'array', minRows: 1,
        fields: [
          text('heading', true),
          { name: 'rows', type: 'array', fields: [text('label', true)] },
        ],
      },
    ],
  },
  {
    type: 'CTA',
    label: 'CTA',
    description: 'Governed call to action.',
    category: 'Conversion',
    schemaVersion: 1,
    defaultProps: { variant: 'banner', background: 'primary' },
    validate: requiredHeading,
    fields: [text('heading', true), colorToken('headingColor', 'Color del titulo'), text('headingHighlight'), colorToken('headingHighlightColor'), textarea('description'), colorToken('descriptionColor', 'Color de descripcion'), media('image'), text('imageAlt'), textarea('legalNotice'), cta('primaryCTA'), cta('secondaryCTA'), select('variant', ['banner', 'card', 'split', 'inline', 'floating-card', 'first-aid-help', 'testimonial-story'], 'banner', 'cta_var'), select('background', ['white', 'light', 'primary', 'secondary'], 'primary', 'cta_bg')],
  },
  {
    type: 'FAQ',
    label: 'FAQ',
    description: 'Accessible FAQ accordion.',
    category: 'Contenido',
    schemaVersion: 1,
    defaultProps: { allowMultiple: false, schemaMarkup: true, background: 'white' },
    validate: requiredHeading,
    fields: [media('icon'), text('heading', true), colorToken('headingColor', 'Color del titulo'), text('headingHighlight'), colorToken('headingHighlightColor'), { name: 'items', type: 'array', minRows: 1, fields: [text('question', true), richText('answer')] }, checkbox('allowMultiple', false), checkbox('schemaMarkup', true), select('variant', ['default', 'editorial'], 'default', 'faq_variant'), select('background', ['white', 'light'], 'white', 'faq_bg')],
  },
  {
    type: 'CompanyImpactMetrics',
    label: 'Indicadores de impacto',
    description: 'Indicadores institucionales de experiencia, reclamaciones y satisfacción.',
    category: 'Confianza',
    schemaVersion: 1,
    defaultProps: {
      metrics: [
        { value: 36, suffix: '+', label: 'years', title: 'of experience', description: 'Since 1989, the Best Doctors Insurance Group has been helping members navigate the healthcare ecosystem' },
        { value: 150000, prefix: '+', label: 'claims', title: 'paid last fiscal year', description: 'Reliable support during medical emergencies and planned care' },
        { value: 92, suffix: '%', label: 'member', title: 'satisfaction', description: 'Our members consistently report confidence and peace of mind throughout their health journeys' },
      ],
      cta: { label: 'Learn more about who we are', href: 'https://www.bestdoctorsinsurance.com/who-we-are/' }, animateNumbers: true,
    },
    validate: valid,
    fields: [
      { name: 'metrics', type: 'array', minRows: 1, maxRows: 3, fields: [select('presentation', ['standard', 'service-results'], 'standard'), number('value', 0), text('prefix'), text('suffix'), text('label', true), text('title'), text('highlight'), text('closing'), textarea('description'), textarea('details')] },
      select('variant', ['default', 'why-best-doctors'], 'default'), cta('cta'), checkbox('animateNumbers', true),
    ],
  },
  {
    type: 'Stats',
    label: 'Stats',
    description: 'Metrics and trust counters.',
    category: 'Confianza',
    schemaVersion: 1,
    defaultProps: { columns: '4', animateNumbers: true, background: 'white', alignment: 'center' },
    validate: requiredHeading,
    fields: [text('eyebrow'), text('heading', true), colorToken('headingColor', 'Color del titulo'), text('headingHighlight'), colorToken('headingHighlightColor'), textarea('description'), colorToken('descriptionColor', 'Color de descripcion'), { name: 'stats', type: 'array', minRows: 1, fields: [text('prefix'), { name: 'value', type: 'number', required: true }, text('suffix'), text('label', true), textarea('description'), { name: 'icon', type: 'text' }, text('sourceNote'), { name: 'lastVerifiedAt', type: 'date' }] }, select('columns', ['2', '3', '4'], '4', 'st_cols'), checkbox('animateNumbers', true), select('background', ['white', 'light', 'primary', 'secondary'], 'white', 'st_bg'), select('alignment', ['left', 'center'], 'center', 'st_align')],
  },
  {
    type: 'TestimonialShowcase',
    label: 'Testimonial Showcase',
    description: 'Showcase approved testimonials.',
    category: 'Confianza',
    schemaVersion: 1,
    defaultProps: { source: 'automatic', maximumItems: 3, displayMode: 'grid', showQuote: true, showPlan: true, background: 'white' },
    validate: requiredHeading,
    fields: [
      text('eyebrow'), text('heading', true), colorToken('headingColor', 'Color del titulo'), text('headingHighlight'), colorToken('headingHighlightColor'), textarea('description'), colorToken('descriptionColor', 'Color de descripcion'),
      select('source', ['automatic', 'manual'], 'manual', 'ts_src'), testimonialRelationship('selectedTestimonials'),
      // Same manual-only caveat as PlanShowcase above.
      { name: 'testimonials', type: 'array', minRows: 1, fields: [{ ...text('title'), maxLength: 80 }, { ...text('personName', true), maxLength: 60 }, { ...textarea('quote', true), maxLength: 240 }, { ...text('role'), maxLength: 80 }, media('image'), text('imageAlt'), text('imageUrl', false, false), cta('cta')] },
      number('maximumItems', 3), select('displayMode', ['grid', 'carousel', 'featured'], 'grid', 'ts_mode'), checkbox('showQuote', true), checkbox('showPlan', true), cta('viewAllCTA'), select('background', ['white', 'light', 'primary', 'secondary'], 'white', 'ts_bg'),
    ],
  },
  {
    type: 'BlogListing',
    label: 'Blog Listing',
    description: 'Listado de artículos del blog, con portada, categoría y fecha por tarjeta.',
    category: 'Contenido',
    schemaVersion: 1,
    defaultProps: {
      eyebrow: 'News', heading: 'Latest articles', description: '', columns: '3', background: 'white',
      // Manual curation for now — same caveat as PlanShowcase/TestimonialShowcase above: the render
      // layer reads this array directly. The four sample posts are the real EN teasers verified
      // against production (bestdoctorsinsurance.com/en/blogs/), not invented placeholders.
      posts: [
        { heading: 'Innovation and Expertise in Cervical Cancer Care', description: 'Cervical cancer remains one of the most significant gynecologic cancers affecting women worldwide.', category: 'News', publishedAt: 'July 28, 2026', imageUrl: damMediaUrl('BACK-END-AGENTS-Ingles-22-Jul_IMG-8.webp'), url: 'https://www.bestdoctorsinsurance.com/en/innovation-and-expertise-in-cervical-cancer-care/', linkLabel: 'Read article' },
        { heading: 'Strengthening Specialized Care in Peru', description: 'Best Doctors Insurance and Oftálmica Clínica de la Visión in Peru, have established a strategic alliance that strengthens access to specialized ophthalmology services and world-class eye care in Peru.', category: 'News', publishedAt: 'July 28, 2026', imageUrl: damMediaUrl('BACK-END-AGENTS-Ingles-22-Jul_IMG-7.webp'), url: 'https://www.bestdoctorsinsurance.com/en/strengthening-specialized-care-in-peru/', linkLabel: 'Read article' },
        { heading: 'Required Documentation for Claim Submission', description: 'To support a timely and efficient claims review process, please ensure that all required documentation is submitted when filing a claim through the Portal.', category: 'News', publishedAt: 'July 28, 2026', imageUrl: damMediaUrl('BACK-END-AGENTS-Ingles-22-Jul_IMG-6.webp'), url: 'https://www.bestdoctorsinsurance.com/en/required-documentation-for-claim-submission/', linkLabel: 'Read article' },
        { heading: 'Whole-Body MRI Added to Executive Health Assessment Rider', description: 'At Best Doctors Canada Insurance, we are committed to enhancing our benefits by providing access to innovative healthcare solutions that support prevention and long-term well-being.', category: 'News', publishedAt: 'July 28, 2026', imageUrl: damMediaUrl('BACK-END-AGENTS-Ingles-22-Jul-11.webp'), url: 'https://www.bestdoctorsinsurance.com/en/whole-body-mri-added-to-executivehealth-assessment-rider/', linkLabel: 'Read article' },
      ],
    },
    validate: requiredHeading,
    fields: [
      text('eyebrow'), text('heading', true), colorToken('headingColor', 'Color del titulo'), text('headingHighlight'), colorToken('headingHighlightColor'), textarea('description'), colorToken('descriptionColor', 'Color de descripcion'), checkbox('showHeading', true), { ...media('contactImage'), label: 'Imagen' },
      { ...checkbox('showFilters', true), label: 'Mostrar filtros' },
      { ...checkbox('showContact', true), label: 'Mostrar CTA' },
      { ...textarea('contactHeading'), label: 'Texto' },
      { ...cta('contactCTA'), label: 'Botón' },
      select('source', ['automatic', 'manual'], 'manual', 'bl_src'),
      { name: 'posts', type: 'array', minRows: 1, maxRows: 24, fields: [text('heading', true), textarea('description'), media('coverImage'), text('imageAlt'), text('imageUrl', false, false), text('category'), text('publishedAt', false, false), { name: 'url', type: 'text' }, text('linkLabel', false, false)] },
      select('columns', ['2', '3', '4'], '3', 'bl_cols'), select('background', ['white', 'light'], 'white', 'bl_bg'),
    ],
  },
  {
    type: 'BlogDetail',
    label: 'Blog Post Detail',
    description: 'Artículo individual del blog: portada, metadatos y cuerpo.',
    category: 'Contenido',
    schemaVersion: 1,
    defaultProps: { category: 'News', background: 'white', backLabel: 'Back to Blog', backHref: '/blog' },
    validate: requiredHeading,
    fields: [
      text('category'), text('publishedAt', false, false), text('author', false, false),
      text('heading', true), textarea('description'), media('coverImage'), text('imageAlt'), text('imageUrl', false, false),
      richText('content'), text('backLabel'), text('backHref', false, false), select('background', ['white', 'light'], 'white', 'bd_bg'),
    ],
  },
  {
    type: 'SearchResults',
    label: 'Search Results',
    description: 'Caja de búsqueda real + resultados en vivo (páginas y artículos publicados), vía /api/site-search.',
    category: 'Contenido',
    schemaVersion: 1,
    defaultProps: { background: 'white' },
    validate: valid,
    fields: [select('background', ['white', 'light'], 'white', 'sr_bg')],
  },
  {
    type: 'Form',
    label: 'Form',
    description: 'Governed form reference.',
    category: 'Conversion',
    schemaVersion: 1,
    defaultProps: { layout: 'stacked', successBehavior: 'message', theme: 'light', buttonVariant: 'primary' },
    validate: requiredHeading,
    // NOTE: this contract (formRelationship/successBehavior/theme) predates and does not match
    // the shape the live Form organism actually reads (a `fields[]` array authored directly on
    // the instance — see organisms/Form.tsx) — pre-existing drift, not introduced here. `modalKey`
    // and the matching `displayMode` option below are the two fields that DO reach the runtime.
    fields: [{ name: 'formRelationship', type: 'relationship', relationTo: 'forms', required: true }, text('heading', true), textarea('description'), select('layout', ['stacked', 'two-column'], 'stacked', 'frm_layout'), select('successBehavior', ['message', 'redirect'], 'message', 'frm_succ'), select('theme', ['light', 'dark'], 'light', 'frm_theme'), select('buttonVariant', ['primary', 'secondary', 'outline'], 'primary', 'frm_btn_var'), checkbox('showIcon', true), { ...text('buttonIcon'), label: 'Icono del botón' },
      select('displayMode', ['inline', 'modal'], 'inline', 'frm_disp'),
      { name: 'modalKey', type: 'text' }],
  },
  {
    type: 'BdilFooter',
    label: 'Footer',
    description: 'Site footer: description, link columns, legal links, social networks and copyright.',
    category: 'Contenido',
    schemaVersion: 1,
    defaultProps: { logoSource: 'app-dark', description: '', columns: [], socialSource: 'app', socialLinks: [], copyright: '' },
    validate: valid,
    fields: [
      select('logoSource', ['app-light', 'app-dark', 'custom'], 'app-dark', 'ft_logo_src'),
      media('customLogo'),
      textarea('description'),
      { name: 'columns', type: 'array', minRows: 0, maxRows: 4, fields: [text('heading'), text('title'), { name: 'links', type: 'array', minRows: 0, maxRows: 12, fields: [text('label', true), select('linkType', ['internal', 'external'], 'internal', 'ft_l_ltyp'), pageLink(), { name: 'url', label: 'URL', type: 'text' }] }] },
      select('socialSource', ['app', 'custom'], 'app', 'ft_social_source'),
      { name: 'socialLinks', type: 'array', minRows: 0, maxRows: 8, fields: [select('platform', ['instagram', 'linkedin', 'facebook', 'youtube', 'x', 'tiktok', 'whatsapp'], 'instagram', 'ft_s_plat'), text('label'), { name: 'url', label: 'URL', type: 'text' }] },
      { ...text('copyright'), label: 'Copyright (vacío = © año + nombre de la App)' },
    ],
  },
  {
    type: 'BackToTopWidget',
    label: 'Back To Top Widget',
    description: 'Floating button that returns the visitor to the top of the page.',
    category: 'Conversion',
    schemaVersion: 1,
    defaultProps: {
      enabled: true,
      icon: '↑',
      position: 'left',
      offsetX: 24,
      offsetY: 24,
      size: 56,
      showAfter: 320,
      backgroundColor: 'color.brand',
      iconColor: 'color.surface',
    },
    validate: valid,
    fields: [
      checkbox('enabled', true),
      text('icon', false, false),
      select('position', ['left', 'right'], 'left', 'btt_pos'),
      number('offsetX', 24),
      number('offsetY', 24),
      number('size', 56),
      number('showAfter', 320),
      { name: 'backgroundColor', type: 'text' },
      { name: 'iconColor', type: 'text' },
    ],
  },
]

export const experienceComponentRegistry = Object.fromEntries(componentCatalog.map((item) => [item.type, item])) as Record<string, ExperienceComponentCatalogItem>
