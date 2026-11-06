/**
 * Blocks links/URLs pasted into free-text contact-form fields (explicit product requirement:
 * visitors must not be able to drop a URL into a Message/Name/etc. field — a common spam vector
 * on public contact forms). Same shape and precedent as profanityFilter.ts: one shared matcher,
 * used by the client (inline red-field feedback in Form.tsx) and the server (the actual
 * enforcement point in app/(payload)/api/dxp/forms/submit/route.ts), so both sides agree on what
 * counts as blocked.
 *
 * Matches, in order: a scheme (http://, https://, ftp://, javascript:, data:, vbscript:), a bare "www." host, or a bare
 * "word.tld" domain (e.g. "example.com", "bestdoctorsinsurance.com") including one embedded in a
 * longer sentence. Deliberately does NOT flag an email address (already a separate field type
 * with its own `type="email"` validation) or a decimal number like "3.5" (requires a letter
 * right after the dot, so "3.5" and "v2.0" don't match but "site.com" does).
 */
const URL_PATTERN = /\b(?:[a-z][a-z0-9+.-]*:\/\/|(?:javascript|data|vbscript):|www\.)\S*/i
const BARE_DOMAIN_PATTERN = /\b[a-z0-9-]+(?:\.[a-z0-9-]+)*\.[a-z]{2,}(?:\/\S*)?\b/i
const EMAIL_PATTERN = /\b[^\s@]+@[^\s@]+\.[^\s@]+\b/gi

/** Returns the matched link/URL substring, or null if the text is clean. */
export function findLink(value: string): string | null {
  if (!value) return null
  const scheme = value.match(URL_PATTERN)
  if (scheme) return scheme[0]
  // Find bare domains in prose while preserving email addresses as valid contact details.
  const withoutEmails = value.replace(EMAIL_PATTERN, ' ')
  const match = withoutEmails.match(BARE_DOMAIN_PATTERN)
  if (match) return match[0]
  return null
}

export function hasLink(value: string): boolean {
  return findLink(value) !== null
}
