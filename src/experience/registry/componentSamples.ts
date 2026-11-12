import type { ComponentProps } from 'react'
import { componentCatalog } from '@/experience/registry/catalog'
import type { componentSpecimens } from '@/experience/registry/componentSpecimens'
import { openContentModal } from '@/experience/components/shared'

/**
 * Explicit, representative samples for every entry of the design inventory. The preview mounts the
 * real component with these props, so a component can only appear in the DXP design view with
 * content that actually renders. `componentSamples` is keyed by the generated inventory ids: adding
 * a component to the frontend fails the type check until it gets a sample here.
 */
type Specimens = typeof componentSpecimens
export type SpecimenId = keyof Specimens

export type SpecimenSample<Id extends SpecimenId = SpecimenId> = {
  props: ComponentProps<Specimens[Id]>
  /** Text or markup the rendered preview must contain. An empty render is never a valid preview. */
  expect: string
  /** Puts the page in the state the component needs (scroll, open modal). Returns an optional cleanup. */
  prepare?: () => void | (() => void)
}

const site = { name: 'Sitio de muestra', slug: 'home', supportedLocales: ['es', 'en'] }
const image = '/favicon.png'
const link = { label: 'Conocer más', linkType: 'external' as const, url: '#', showIcon: true, icon: 'chevron-right' }

/** Props shared by every component that renders a page section. */
const section = (content: Record<string, unknown>, settings: Record<string, unknown> = {}) => ({ content, settings, locale: 'es', site })

/** Content a catalog entry already ships as its own representative sample. */
const catalogSample = (type: string) => {
  const item = componentCatalog.find((candidate) => candidate.type === type)
  if (!item) throw new Error(`Catalog entry ${type} does not exist`)
  return section(item.defaultProps)
}

const scrolledPage = () => {
  const spacer = document.createElement('div')
  spacer.style.height = '200vh'
  document.body.append(spacer)
  window.scrollTo(0, 400)
  return () => { spacer.remove(); window.scrollTo(0, 0) }
}

const contacts = [
  { id: 1, label: 'Emergencias 24/7', type: 'phone' as const, value: '+1 305 555 0100' },
  { id: 2, label: 'Atención al cliente', type: 'email' as const, value: 'ayuda@example.com' },
]

const languages = [
  { active: true, code: 'es', href: '#', label: 'Español' },
  { active: false, code: 'en', href: '#', label: 'English' },
]

const navigation = [
  { id: 1, label: 'Planes', linkType: 'external', url: '#' },
  { id: 2, label: 'Servicios', linkType: 'external', url: '#', children: [{ id: 3, label: 'Telemedicina', linkType: 'external', url: '#' }] },
  { id: 4, label: 'Soporte', linkType: 'external', url: '#' },
]

const plans = [
  { name: 'Plan Esencial', shortDescription: 'Cobertura médica internacional para el día a día.', imageUrl: image, benefits: [{ text: 'Emergencias en el exterior' }, { text: 'Telemedicina sin costo' }], primaryCTA: { label: 'Ver detalles', href: '#' } },
]

export const componentSamples: { [Id in SpecimenId]: SpecimenSample<Id> } = {
  'atoms/Button': { props: { label: 'Solicitar cotización', variant: 'primary', href: '#', icon: 'chevron-right' }, expect: 'Solicitar cotización' },
  'atoms/ButtonAtom': { props: section({ text: 'Ver planes', href: '#', variant: 'secondary' }), expect: 'Ver planes' },
  'atoms/Counter': { props: { value: 92, suffix: '%', animate: false, locale: 'es' }, expect: '92%' },
  'atoms/Heading': { props: { level: 'h2', children: 'Cobertura médica internacional' }, expect: 'Cobertura médica internacional' },
  'atoms/Icon': { props: { name: 'heart', size: 32, title: 'Salud' }, expect: '<svg' },
  'atoms/Label': { props: { children: 'Novedades', variant: 'eyebrow' }, expect: 'Novedades' },
  'atoms/Link': { props: { href: '#', children: 'Consultar la red de proveedores' }, expect: 'Consultar la red de proveedores' },
  'atoms/LucideFallbackIcon': { props: { name: 'heart', size: 32, ariaHidden: false, title: 'Salud' }, expect: '<svg' },
  'atoms/Media': { props: { src: image, alt: 'Imagen de muestra', width: 160, height: 160 }, expect: '<img' },
  'atoms/Text': { props: { children: 'Texto de apoyo para describir un beneficio del plan.', size: 'md' }, expect: 'Texto de apoyo' },
  'atoms/TextAtom': { props: section({ text: 'Texto editorial de muestra' }), expect: 'Texto editorial de muestra' },
  'atoms/BlogVisualAtoms.RichTextAtom': { props: section({ content: '<h2>Prevención</h2><p>Un chequeo a tiempo <strong>cambia</strong> el resultado.</p>' }), expect: 'Un chequeo a tiempo' },
  'atoms/BlogVisualAtoms.ImageAtom': { props: section({ src: image, alt: 'Imagen del artículo', caption: 'Pie de foto de muestra' }), expect: 'Pie de foto de muestra' },
  'atoms/BlogVisualAtoms.VideoAtom': { props: section({ src: 'https://www.youtube.com/watch?v=aqz-KE-bpKQ', title: 'Video de muestra' }), expect: 'youtube-nocookie.com/embed/aqz-KE-bpKQ' },
  'atoms/BlogVisualAtoms.HeadingAtom': { props: section({ text: 'Encabezado del artículo', level: 'h2', align: 'left' }), expect: 'Encabezado del artículo' },
  'atoms/BlogVisualAtoms.DividerAtom': { props: section({ style: 'solid', thickness: 2, length: 60 }), expect: 'blog-visual-divider' },
  'atoms/BlogVisualAtoms.SpacerAtom': { props: section({ desktopHeight: 48, tabletHeight: 40, mobileHeight: 32 }), expect: 'blog-visual-spacer' },
  'atoms/BlogVisualAtoms.EmbedAtom': { props: section({ url: 'https://vimeo.com/76979871', title: 'Contenido embebido de muestra' }), expect: 'player.vimeo.com/video/76979871' },
  'atoms/BlogVisualAtoms.AlignWrap': { props: { align: 'center', children: 'Contenido alineado al centro' }, expect: 'blog-visual-align--center' },
  'atoms/BlogVisualAtoms.LinkAtom': { props: section({ text: 'Leer la guía completa', href: '#', align: 'left' }), expect: 'Leer la guía completa' },
  'atoms/BlogVisualAtoms.BadgeAtom': { props: section({ text: 'Nuevo', tone: 'success', variant: 'soft' }), expect: 'Nuevo' },
  'atoms/BlogVisualAtoms.MediaAtom': { props: section({ mediaType: 'image', src: image, alt: 'Imagen de muestra' }), expect: '<img' },

  'molecules/AlertBarDismissible': { props: { locale: 'es', children: 'Aviso importante para asegurados' }, expect: 'Aviso importante para asegurados' },
  'molecules/AlertContactGroup': { props: { contacts }, expect: 'Emergencias 24/7' },
  'molecules/AudienceCard': { props: { title: 'Personas y familias', description: 'Planes pensados para proteger a quienes más quieres.', cta: link, imageAlt: 'Familia', media: image, locale: 'es', site }, expect: 'Personas y familias' },
  'molecules/BlogPostCard': { props: { title: 'Cómo preparar tu primera consulta', description: 'Consejos para aprovechar al máximo tu cita.', category: 'Salud', publishedAt: '28 de julio de 2026', imageUrl: image, imageAlt: 'Consulta médica', href: '#', linkLabel: 'Leer artículo' }, expect: 'Cómo preparar tu primera consulta' },
  'molecules/BlogShareLinks': { props: { locale: 'es', title: 'Cómo preparar tu primera consulta' }, expect: '<a' },
  'molecules/ContactAction': { props: { label: 'Línea 24/7', type: 'phone', value: '+1 305 555 0100' }, expect: 'Línea 24/7' },
  'molecules/ContentModal': { props: { locale: 'es', modalKey: 'muestra', children: 'Contenido mostrado dentro del modal' }, expect: 'Contenido mostrado dentro del modal', prepare: () => { openContentModal('muestra') } },
  'molecules/CTAButton': { props: { cta: { label: 'Cotizar ahora', linkType: 'external', url: '#', showIcon: true }, locale: 'es' }, expect: 'Cotizar ahora' },
  'molecules/CTAGroup': { props: { primaryCTA: { label: 'Cotizar ahora', linkType: 'external', url: '#' }, secondaryCTA: { label: 'Hablar con un asesor', linkType: 'external', url: '#', variant: 'outline' }, locale: 'es' }, expect: 'Hablar con un asesor' },
  'molecules/DropdownMenu': { props: { label: 'Planes', items: [{ id: 1, label: 'Individuos', href: '#' }, { id: 2, label: 'Empresas', href: '#' }] }, expect: 'Planes' },
  'molecules/FeatureCard': { props: { title: 'Cobertura mundial', description: 'Atención médica en cualquier país.', icon: 'heart', href: '#', linkLabel: 'Conocer más', linkButton: true }, expect: 'Cobertura mundial' },
  'molecules/FooterLinkGroup': { props: { title: 'Compañía', links: [{ id: 1, label: 'Quiénes somos', href: '#' }, { id: 2, label: 'Contacto', href: '#' }] }, expect: 'Quiénes somos' },
  'molecules/HeroSlide': { props: { title: 'Acceso a atención médica de alta calidad', description: 'Cobertura internacional para personas, familias y empresas.', eyebrow: 'Best Doctors Insurance', locale: 'es', site, theme: 'dark', background: 'linear-gradient(135deg, #003b6f, #0073b7)', primaryCTA: { label: 'Comenzar', linkType: 'external', url: '#' } }, expect: 'Acceso a atención médica de alta calidad' },
  'molecules/LanguageSelector': { props: { languages }, expect: 'Español' },
  'molecules/MetricCard': { props: { value: 92, suffix: '%', label: 'satisfacción', description: 'Miembros que recomiendan el servicio.', animate: false }, expect: 'satisfacción' },
  'molecules/MobileSlideRotator': { props: { slides: ['Primer mensaje', 'Segundo mensaje', 'Tercer mensaje'], showDots: true }, expect: 'Primer mensaje' },
  'molecules/PortalSelector': { props: { locale: 'es', triggerLabel: 'Portales', portals: [{ id: 1, label: 'Asegurados', href: '#' }, { id: 2, label: 'Agentes', href: '#' }] }, expect: 'Portales' },
  'molecules/ProductDocumentsList': { props: { appSlug: 'home', locale: 'es', planCode: 'MEPRO', documents: [{ documentType: 'TOB' }, { documentType: 'COC' }] }, expect: 'MEPRO' },
  'molecules/QuickActionCard': { props: { title: 'Pagar mi póliza', description: 'Realiza tu pago en pocos minutos.', href: '#', icon: 'credit-card', ctaLabel: 'Pagar ahora' }, expect: 'Pagar mi póliza' },
  'molecules/SearchableListField': { props: { label: 'País de residencia', name: 'country', options: ['Ecuador', 'Perú', 'México'], placeholder: 'Selecciona un país' }, expect: 'País de residencia' },
  'molecules/SectionHeading': { props: { eyebrow: 'Testimonios', title: 'Lo que dicen', highlight: 'nuestros miembros', description: 'Historias reales de quienes confían en nosotros.' }, expect: 'nuestros miembros' },
  'molecules/TestimonialCard': { props: { quote: 'El servicio fue rápido y humano cuando más lo necesitaba.', author: 'María Pérez', role: 'Miembro desde 2019', image, imageAlt: 'María Pérez', locale: 'es', site }, expect: 'María Pérez' },
  'molecules/YouTubeVideoFacade': { props: { videoId: 'aqz-KE-bpKQ', title: 'Video de muestra', posterUrl: image }, expect: 'Video de muestra' },

  'organisms/AlertBar': { props: section({ enabled: true, message: 'Aviso de muestra para todos los asegurados', href: '#', linkLabel: 'Más información' }), expect: 'Aviso de muestra' },
  'organisms/AudienceSelectorSection': { props: section({ heading: 'Soluciones para cada audiencia', description: 'Elige el perfil que mejor se ajusta a ti.', audiences: [{ title: 'Personas', subtitle: 'Individual', description: 'Planes de salud para ti.', imageUrl: image, imageAlt: 'Persona', cta: link, audienceKey: 'individual' }, { title: 'Empresas', subtitle: 'Corporativo', description: 'Beneficios para tu equipo.', imageUrl: image, imageAlt: 'Equipo', cta: link, audienceKey: 'company' }] }), expect: 'Soluciones para cada audiencia' },
  'organisms/BackToTopWidget': { props: section({ enabled: true, position: 'right', offsetX: 24, offsetY: 24, size: 56, showAfter: 0 }), expect: 'experience-back-to-top', prepare: scrolledPage },
  'organisms/BlogListingSection': { props: catalogSample('BlogListing'), expect: 'Latest articles' },
  'organisms/BlogPostDetail': { props: section({ heading: 'Cómo preparar tu primera consulta', description: 'Consejos prácticos.', category: 'Salud', author: 'Equipo editorial', publishedAt: '28 de julio de 2026', imageUrl: image, imageAlt: 'Consulta', content: '<p>Anota tus síntomas y lleva tus estudios previos.</p>', backLabel: 'Volver al blog', backHref: '#' }), expect: 'Cómo preparar tu primera consulta' },
  'organisms/CardGridSection': { props: section({ eyebrow: 'Servicios', heading: 'Todo lo que necesitas', description: 'Accesos directos a tus gestiones.', columns: '3', cards: [{ heading: 'Telemedicina', description: 'Consulta con especialistas desde casa.', icon: 'phone', url: '#', linkLabel: 'Conocer más' }, { heading: 'Autorizaciones', description: 'Gestiona tus autorizaciones en línea.', icon: 'mail', url: '#', linkLabel: 'Conocer más' }, { heading: 'Reembolsos', description: 'Seguimiento claro de cada solicitud.', icon: 'message-square', url: '#', linkLabel: 'Conocer más' }] }), expect: 'Todo lo que necesitas' },
  'organisms/CompanyImpactMetrics': { props: catalogSample('CompanyImpactMetrics'), expect: 'paid last fiscal year' },
  'organisms/ContainerSection': { props: section({ gap: 16, columns: [{ id: 'c1', width: 50, children: [{ componentCode: 'text', props: { text: 'Columna izquierda' } }] }, { id: 'c2', width: 50, children: [{ componentCode: 'text', props: { text: 'Columna derecha' } }] }] }), expect: 'Columna derecha' },
  'organisms/ExperienceCardSection': { props: section({ heading: 'Una experiencia pensada para', headingHighlight: 'ti', cardHeading: 'Atención sin fronteras', description: 'Te acompañamos antes, durante y después de cada consulta.', imageUrl: image, imageAlt: 'Experiencia', cta: { label: 'Descubre cómo', linkType: 'external', url: '#' } }), expect: 'Atención sin fronteras' },
  'organisms/FallbackSection': { props: {}, expect: 'no es compatible' },
  'organisms/FAQSection': { props: section({ heading: 'Preguntas frecuentes', items: [{ question: '¿Cómo solicito una autorización?', answer: '<p>Desde el portal o llamando a la línea 24/7.</p>' }, { question: '¿Cuánto tarda un reembolso?', answer: '<p>Depende de la documentación enviada.</p>' }] }), expect: '¿Cómo solicito una autorización?' },
  'organisms/FeaturesSection': { props: section({ heading: 'Beneficios destacados', description: 'Lo esencial de tu cobertura.', columns: '3', features: [{ heading: 'Cobertura mundial', description: 'Atención en cualquier país.', iconName: 'heart' }, { heading: 'Telemedicina', description: 'Consultas a cualquier hora.', iconName: 'phone' }, { heading: 'Segunda opinión', description: 'Revisión por especialistas.', iconName: 'search' }] }), expect: 'Beneficios destacados' },
  'organisms/FirstAidGuideTabs': { props: { locale: 'es', site, tabs: [{ label: 'Emergencias', heading: '¿Qué debo hacer en caso de una emergencia médica?', description: 'Dirígete al centro médico más cercano y comunícate con nosotros.' }, { label: 'Cobertura', heading: '¿Qué cobertura se brinda?', description: 'Atención de urgencia según tu plan.' }] }, expect: 'Emergencias' },
  'organisms/FirstAidScheduledAppointments': { props: { locale: 'es', tabs: [{ label: 'Citas programadas', heading: '¿Cómo puedo programar una cita?', description: 'Solicita tu cita con anticipación.', items: [{ label: 'Elige un proveedor de la red' }, { label: 'Solicita la autorización' }] }] }, expect: 'Citas programadas' },
  'organisms/FloatingChat': { props: section({ enabled: true, provider: 'whatsapp', phone: '+13055550100' }), expect: 'wa.me' },
  'organisms/Form': { props: { ...section({ heading: 'Contáctanos', description: 'Déjanos tus datos y te responderemos.', ctaLabel: 'Enviar', fields: [{ name: 'fullName', label: 'Nombre completo', type: 'text', required: true }, { name: 'email', label: 'Correo electrónico', type: 'email', required: true }, { name: 'message', label: 'Mensaje', type: 'textarea', fullWidth: true }] }), instanceId: 'muestra' }, expect: 'Nombre completo' },
  'organisms/GlobalCareStatement': { props: catalogSample('GlobalCareStatement'), expect: 'care that never sleeps' },
  'organisms/Hero': { props: catalogSample('Hero'), expect: 'Building accessible' },
  'organisms/InsuranceBenefitsGrid': { props: catalogSample('InsuranceBenefitsGrid'), expect: 'Worldwide coverage' },
  'organisms/LegacyUtilityHeader': { props: { locale: 'es', siteSlug: 'home', value: { flagEmoji: 'US', actions: [{ icon: 'phone', label: 'Línea 24/7', value: '+1 305 555 0100', href: 'tel:+13055550100' }], languages: [{ code: 'es', label: 'Español', href: '#', active: true }], portalLinks: [{ label: 'Portal de asegurados', href: '#' }] } }, expect: 'Línea 24/7' },
  'organisms/MobileNavigation': { props: { items: [{ id: 1, label: 'Planes', href: '#' }, { id: 2, label: 'Soporte', href: '#' }], languages, locale: 'es', logoAlt: 'Logotipo', logoURL: '/favicon.svg', onClose: () => {}, open: true, siteName: 'Sitio de muestra' }, expect: 'Planes' },
  'organisms/PlanAudienceCards': { props: catalogSample('PlanAudienceCards'), expect: 'Individuals &amp; families' },
  'organisms/PlanComparisonSection': { props: catalogSample('PlanComparison'), expect: 'Compare our plans' },
  'organisms/PlansShowcaseSection': { props: catalogSample('PlanShowcase'), expect: 'Medical Elite' },
  'organisms/ProvidersCarousel': { props: { locale: 'es', content: { heading: 'Red de proveedores', cards: [{ heading: 'Hospital General', description: 'Atención integral', imageUrl: image }, { heading: 'Clínica del Valle', description: 'Especialidades', imageUrl: image }] } }, expect: 'Red de proveedores' },
  'organisms/QuickActionsSection': { props: section({ heading: 'Gestiones frecuentes', actions: [{ icon: 'phone', label: 'Solicitar una autorización', description: 'En línea, 24/7.', linkType: 'external', url: '#' }, { icon: 'mail', label: 'Enviar un reembolso', description: 'Sube tus documentos.', linkType: 'external', url: '#' }] }), expect: 'Gestiones frecuentes' },
  'organisms/RelatedPlansCarousel': { props: { locale: 'es', content: { heading: 'Planes relacionados', cards: [{ heading: 'Plan Esencial', description: 'Cobertura base', imageUrl: image, url: '#' }, { heading: 'Plan Integral', description: 'Cobertura ampliada', imageUrl: image, url: '#' }] } }, expect: 'Planes relacionados' },
  'organisms/RichContentSection': { props: section({ eyebrow: 'Nuestra historia', heading: 'Más de 35 años cuidando de ti', description: 'Combinamos acceso médico global y atención cercana.', imageUrl: image, imageAlt: 'Equipo', cta: { label: 'Conócenos', linkType: 'external', url: '#' } }), expect: 'Más de 35 años cuidando de ti' },
  'organisms/SearchModal': { props: { locale: 'es', onClose: () => {}, open: true, siteSlug: 'home' }, expect: 'input' },
  'organisms/SearchResultsSection': { props: section({ background: 'white' }), expect: 'input' },
  'organisms/SectionCTA': { props: section({ heading: 'Empieza a proteger tu salud', description: 'Cotiza en minutos y recibe asesoría personalizada.', variant: 'banner', primaryCTA: { label: 'Cotizar ahora', linkType: 'external', url: '#' }, secondaryCTA: { label: 'Hablar con un asesor', linkType: 'external', url: '#', variant: 'outline' } }), expect: 'Empieza a proteger tu salud' },
  'organisms/ServiceActionGrid': { props: catalogSample('ServiceActionGrid'), expect: 'How can we help you today?' },
  'organisms/ServiceTabsSection': { props: { heading: 'Servicios', highlight: 'que te acompañan', description: 'Conoce el soporte incluido en tu plan.', services: [{ heading: 'Telemedicina', description: 'Consultas por video con especialistas.', imageUrl: image }, { heading: 'Segunda opinión', description: 'Revisión de diagnósticos complejos.', imageUrl: image }] }, expect: 'Telemedicina' },
  'organisms/SiteFooter': { props: section({ description: 'Seguros de salud internacionales.', copyright: '© 2026 Sitio de muestra', columns: [{ heading: 'Compañía', links: [{ label: 'Quiénes somos', linkType: 'external', url: '#' }] }, { heading: 'Soporte', links: [{ label: 'Contacto', linkType: 'external', url: '#' }] }], contacts, social: [{ id: 1, label: 'LinkedIn', href: '#', icon: 'linkedin' }] }), expect: 'Quiénes somos' },
  'organisms/SiteHeader': { props: section({ navigation, languages, localePaths: { es: '/es', en: '/en' }, portals: [{ id: 1, label: 'Asegurados', href: '#' }], portalButtonText: 'Portales', logo: { url: '/favicon.svg', alt: 'Logotipo' } }), expect: 'Planes' },
  'organisms/TestimonialsSection': { props: section({ heading: 'Lo que dicen', headingHighlight: 'nuestros miembros', source: 'manual', displayMode: 'grid', testimonials: [{ personName: 'María Pérez', quote: 'El servicio fue rápido y humano.', role: 'Miembro', imageUrl: image }, { personName: 'Carlos Ruiz', quote: 'Me acompañaron en todo el proceso.', role: 'Miembro', imageUrl: image }] }), expect: 'María Pérez' },
  'organisms/TrustMetricsSection': { props: section({ heading: 'Confianza que se mide', animateNumbers: false, stats: [{ value: 36, suffix: '+', label: 'años de experiencia' }, { value: 92, suffix: '%', label: 'satisfacción' }] }), expect: 'años de experiencia' },
  'organisms/TrustStoryCollage': { props: catalogSample('TrustStoryCollage'), expect: 'built on trust' },
}
