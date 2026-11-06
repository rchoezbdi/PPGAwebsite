/**
 * Flags raw HTML/script markup typed into a free-text contact-form field (e.g. "<script>").
 * `sanitizeText()` in app/(payload)/api/dxp/forms/submit/route.ts already strips any `<tag>` shape
 * before storage regardless, so this was never a stored-XSS risk — but silently emptying the field
 * on the server looked like a bug to whoever typed it, and the client had no matching check to
 * warn them first. Same shared client+server precedent as profanityFilter.ts/linkFilter.ts/
 * sqlInjectionFilter.ts: reject explicitly instead of silently stripping.
 *
 * Requires a letter (or `!`, for `<!DOCTYPE...>`/comments) right after `<` and a closing `>`, so
 * ordinary prose using bare `<`/`>` ("cost > budget", "5 < 10") never false-positives.
 */
const TAG_PATTERN = /<\/?[a-z!][^>]*>/i
// While the visitor is typing, a dangerous element is often incomplete (for example `<script`
// has no closing `>` yet). Catch those known executable/embedding tags at end-of-input so the
// live validator can warn before the user finishes the tag. Keep this list narrow to avoid
// treating ordinary prose such as "<think" as markup.
const INCOMPLETE_DANGEROUS_TAG_PATTERN = /<\/?(?:script|iframe|object|embed|svg|math|style|link|meta|form|input|img|video|audio)\b[^>]*$/i

/** Returns the matched tag-like substring, or null if the text is clean. */
export function findMarkup(value: string): string | null {
  if (!value) return null
  const match = value.match(TAG_PATTERN) ?? value.match(INCOMPLETE_DANGEROUS_TAG_PATTERN)
  return match ? match[0] : null
}

export function hasMarkup(value: string): boolean {
  return findMarkup(value) !== null
}
