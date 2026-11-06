/**
 * Country/City source for the "country"/"city" form field types (Form.tsx). Public API first —
 * countriesnow.space, free, no key, open CORS (`access-control-allow-origin: *`, confirmed
 * directly against the live endpoint before wiring this up) — with a small fixed fallback list
 * covering Best Doctors Insurance's real markets (confirmed against this codebase's own real
 * signals: the RBAC analytics options for Canada/Mexico/Ecuador, Colombia as the company's home
 * market throughout the site's real content, Brazil as a full PT locale) so the field still works
 * if the API is down or blocked. Neither field is a closed list — both render as a plain
 * `<input list>` (SearchableListField), so typing anything not in the list still submits as free
 * text. That's the whole answer to "what if my country/city isn't there": the input never
 * rejects it, no separate "Other" option needed.
 */
export const FALLBACK_COUNTRIES = [
  'Argentina', 'Brazil', 'Canada', 'Chile', 'Colombia', 'Costa Rica', 'Dominican Republic',
  'Ecuador', 'Guatemala', 'Mexico', 'Panama', 'Peru', 'Spain', 'United States',
]

export const FALLBACK_CITIES: Record<string, string[]> = {
  Argentina: ['Buenos Aires', 'Córdoba', 'Rosario'],
  Brazil: ['São Paulo', 'Rio de Janeiro', 'Brasília', 'Belo Horizonte'],
  Canada: ['Toronto', 'Vancouver', 'Montreal'],
  Chile: ['Santiago', 'Valparaíso'],
  Colombia: ['Bogotá', 'Medellín', 'Cali', 'Barranquilla', 'Cartagena', 'Bucaramanga'],
  'Costa Rica': ['San José', 'Alajuela', 'Cartago'],
  'Dominican Republic': ['Santo Domingo', 'Santiago'],
  Ecuador: ['Quito', 'Guayaquil', 'Cuenca'],
  Guatemala: ['Guatemala City', 'Quetzaltenango'],
  Mexico: ['Mexico City', 'Guadalajara', 'Monterrey', 'Cancún', 'Puebla'],
  Panama: ['Panama City', 'Colón', 'David'],
  Peru: ['Lima', 'Arequipa', 'Trujillo'],
  Spain: ['Madrid', 'Barcelona', 'Valencia'],
  'United States': ['Miami', 'New York', 'Los Angeles', 'Houston', 'Chicago', 'Orlando'],
}

const countryCodes = new Map<string, string>()
export function countryFlag(country: string): string {
  const code = countryCodes.get(country) ?? ({ Argentina: 'AR', Brazil: 'BR', Canada: 'CA', Chile: 'CL', Colombia: 'CO', 'Costa Rica': 'CR', 'Dominican Republic': 'DO', Ecuador: 'EC', Guatemala: 'GT', Mexico: 'MX', Panama: 'PA', Peru: 'PE', Spain: 'ES', 'United States': 'US' } as Record<string, string>)[country]
  return code ? String.fromCodePoint(...[...code.toUpperCase()].map((letter) => 127397 + letter.charCodeAt(0))) : '🌐'
}

const REQUEST_TIMEOUT_MS = 6000

export async function fetchCountries(): Promise<string[]> {
  const response = await fetch('https://countriesnow.space/api/v0.1/countries/positions', {
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  })
  if (!response.ok) throw new Error('countries api failed')
  const json = (await response.json()) as { data?: { name?: string; iso2?: string }[] }
  for (const item of json.data ?? []) if (item.name && item.iso2) countryCodes.set(item.name, item.iso2)
  const names = (json.data ?? []).map((item) => item.name).filter((name): name is string => Boolean(name))
  if (!names.length) throw new Error('empty countries response')
  return names.sort((a, b) => a.localeCompare(b))
}

// Direct GET on the redirect target, not the documented POST /countries/cities — that endpoint
// 301-redirects here (confirmed against the live API), and a POST body doesn't survive a redirect
// through `fetch()` the same way a plain GET does.
export async function fetchCities(country: string): Promise<string[]> {
  const response = await fetch(`https://countriesnow.space/api/v0.1/countries/cities/q?country=${encodeURIComponent(country)}`, {
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  })
  if (!response.ok) throw new Error('cities api failed')
  const json = (await response.json()) as { data?: string[] }
  if (!Array.isArray(json.data) || !json.data.length) throw new Error('empty cities response')
  return json.data.slice().sort((a, b) => a.localeCompare(b))
}
