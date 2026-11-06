/**
 * Defense-in-depth character/pattern check for classic SQL-injection payloads in contact-form
 * free text. Explicit product requirement, not a fix for a real vulnerability: every write on
 * this path already goes through Payload's own ORM with parameterized queries, so a raw SQL
 * string can never reach the database as executable SQL (see the sanitizeText comment in
 * app/(payload)/api/dxp/forms/submit/route.ts). This exists as a second, independent layer that
 * rejects input *shaped* like an injection attempt before it's ever stored or emailed out —
 * same shared-module/client+server precedent as profanityFilter.ts and linkFilter.ts.
 *
 * Flags: a quote/comment breakout (`'`, `--`, `/*`, `;`) sitting next to a SQL keyword, or a
 * classic tautology (`OR 1=1`, `' OR '1'='1`). Deliberately narrow (keyword + metacharacter
 * together, not either alone) so normal prose — "I'd like to update my policy", "select the
 * plan that fits" — never false-positives.
 */
const SQL_KEYWORDS = 'select|insert|update|delete|drop|union|exec|execute|alter|create|truncate|declare|xp_cmdshell|information_schema'
const PATTERNS = [
  // Quote/comment/statement-terminator breakout immediately followed by a SQL keyword (either order).
  new RegExp(`(['";]|--|\\/\\*)\\s*(${SQL_KEYWORDS})\\b`, 'i'),
  new RegExp(`\\b(${SQL_KEYWORDS})\\b\\s*(['";]|--|\\*\\/)`, 'i'),
  // Classic boolean tautology used to bypass a WHERE clause.
  /(\bor\b|\band\b)\s+['"]?\s*\d+\s*=\s*\d+/i,
  /'\s*or\s*'?\d*'?\s*=\s*'?\d*'?/i,
  // Inline SQL comment sequences on their own are still a strong signal.
  /--\s*$/,
  /\/\*.*\*\//,
  // Multi-keyword SQL phrases, flagged without needing an adjacent quote/comment: each of these
  // exact word pairs is common in an injection payload and essentially never appears together in
  // genuine contact-form prose (unlike a lone "select"/"update", which are ordinary English verbs
  // and would false-positive if flagged alone — see the metacharacter-gated patterns above).
  /\bunion\s+(all\s+)?select\b/i,
  // "insert into"/"delete from" alone read as plausible English too ("insert into my policy",
  // "delete from the list") — only flagged when followed directly by a bare identifier-looking
  // word (no article), the shape a real table name takes and an English sentence usually doesn't.
  /\binsert\s+into\s+(?!the\b|my\b|a\b|an\b|your\b|our\b|this\b|that\b)\w+/i,
  /\bdelete\s+from\s+(?!the\b|my\b|a\b|an\b|your\b|our\b|this\b|that\b)\w+/i,
  /\bdrop\s+(table|database)\b/i,
  /\bupdate\s+\w+\s+set\b/i,
]

/** Returns the matched suspicious substring, or null if the text is clean. */
export function findSqlInjection(value: string): string | null {
  if (!value) return null
  for (const pattern of PATTERNS) {
    const match = value.match(pattern)
    if (match) return match[0]
  }
  return null
}

export function hasSqlInjection(value: string): boolean {
  return findSqlInjection(value) !== null
}
