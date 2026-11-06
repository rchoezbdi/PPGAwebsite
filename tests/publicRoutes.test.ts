import { describe, expect, it } from 'vitest'
import { canonicalPublicPath } from '../src/lib/publicRoutes'
describe('Published locale route aliases', () => {
  it.each([
    ['en', '/plan-comparsion', '/plan-comparison'],
    ['es', '/support', '/soporte'], ['pt', '/support', '/suporte'],
    ['es', '/our-plans', '/nuestros-planes'], ['pt', '/who-we-are', '/quem-nos-somos'],
    ['en', '/blog', '/blog'], ['es', '/', '/'],
  ])('%s canonicalizes %s', (locale, from, to) => expect(canonicalPublicPath(from, locale)).toBe(to))
})
