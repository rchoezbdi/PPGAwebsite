/**
 * Baseline profanity blocklist for the site's 3 public locales (EN/ES/PT). Deliberately a small,
 * curated starting set rather than a pulled-in third-party word list — those vary wildly in
 * quality/licensing and can both over-block legitimate words and miss local slang. Meant as a
 * first line of defense on contact-form free text, not a moderation system; extend the arrays
 * below as real false negatives/positives turn up. Shared between the client (inline red-field
 * feedback in Form.tsx) and the server (the actual enforcement point in
 * app/(payload)/api/dxp/forms/submit/route.ts) so both sides agree on what counts as blocked.
 */
const BLOCKLIST = [
  // EN
  'fuck', 'shit', 'asshole', 'bitch', 'bastard', 'cunt', 'dick', 'piss', 'whore', 'slut', 'motherfucker',
  // ES
  'mierda', 'puta', 'puto', 'pendejo', 'pendeja', 'cabron', 'gilipollas', 'coño', 'joder', 'maricon',
  'verga', 'chingar', 'culero', 'pelotudo', 'boludo', 'hijueputa', 'hijodeputa', 'malparido', 'concha de tu madre',
  // PT
  'merda', 'porra', 'caralho', 'viado', 'babaca', 'corno', 'desgracado', 'vadia', 'buceta', 'cacete', 'filho da puta',
]

const normalize = (value: string): string => value
  .toLowerCase()
  .normalize('NFD')
  .replace(/[̀-ͯ]/g, '') // strip accents so "cabrón"/"cabron" match the same entry

const escapeRegExp = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/** Returns the matched blocklist entry, or null if the text is clean. Word-boundary matched
 * (accent/case-insensitive) so it doesn't flag substrings inside unrelated longer words. */
export function findProfanity(value: string): string | null {
  if (!value) return null
  const normalized = normalize(value)
  for (const word of BLOCKLIST) {
    const pattern = new RegExp(`(^|[^a-z0-9])${escapeRegExp(normalize(word))}([^a-z0-9]|$)`, 'i')
    if (pattern.test(normalized)) return word
  }
  return null
}

export function hasProfanity(value: string): boolean {
  return findProfanity(value) !== null
}
