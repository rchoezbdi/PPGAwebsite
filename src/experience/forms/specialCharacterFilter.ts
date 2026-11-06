/**
 * Reject code/operator punctuation in free-text form fields while preserving characters people
 * need for real names and readable messages (Unicode letters, digits, spaces, accents and basic
 * sentence punctuation). Email and phone fields have their own syntax and are exempt.
 */
const DISALLOWED_TEXT_CHARACTERS = /[^\p{L}\p{N}\s.,!?¿¡"'()\-]/u
const DISALLOWED_NAME_CHARACTERS = /[^\p{L}\s.'’\-]/u

export function findDisallowedCharacters(value: string, fieldType?: string, fieldName?: string): string | null {
  if (!value || fieldType === 'email' || fieldType === 'tel' || fieldType === 'number' || fieldType === 'date' || fieldType === 'time') return null
  const pattern = fieldName?.toLowerCase() === 'name' ? DISALLOWED_NAME_CHARACTERS : DISALLOWED_TEXT_CHARACTERS
  const match = value.match(pattern)
  return match ? match[0] : null
}
