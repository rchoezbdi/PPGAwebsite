const aliases: Record<string, Record<string, string>> = {
  en: { 'plan-comparsion': 'plan-comparison' },
  es: { 'our-plans': 'nuestros-planes', support: 'soporte', 'who-we-are': 'quienes-somos' },
  pt: { 'our-plans': 'nossos-planos', support: 'suporte', 'who-we-are': 'quem-nos-somos' },
}
export function canonicalPublicPath(path: string, locale: string) {
  const segments = path.split('/').filter(Boolean)
  if (segments[0] && aliases[locale]?.[segments[0]]) segments[0] = aliases[locale][segments[0]]
  return `/${segments.join('/')}`
}
