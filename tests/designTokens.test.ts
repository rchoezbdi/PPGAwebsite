import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import breakpointPlugin from '../scripts/postcss-ds-breakpoints.cjs'
import { designTokensToCSS, type DesignTokens } from '@/experience/design-system/DesignSystemRuntime'
import { mediaQueries } from '@/experience/design-system/breakpoints'
import siteTheme from '@/experience/design-system/siteTheme.json'

const { resolveBreakpoints } = breakpointPlugin as unknown as { resolveBreakpoints: (params: string, breakpoints: Record<string, string>) => string }
const stylesheet = readFileSync(join(process.cwd(), 'src/app/styles.css'), 'utf8')
const mediaParams = stylesheet.split('\n').filter((line) => /^\s*@media/.test(line))
const resolve = (breakpoints: Record<string, string>) => mediaParams.map((line) => resolveBreakpoints(line, breakpoints)).join('\n')
const breakpoints = siteTheme.tokens.breakpoints as Record<string, string>

describe('breakpoint tokens', () => {
  it('leaves no unresolved token reference in the generated media queries', () => {
    expect(resolve(breakpoints)).not.toMatch(/bp\(/)
  })

  it('changes the generated CSS when a breakpoint token changes', () => {
    const base = resolve(breakpoints)
    const changed = resolve({ ...breakpoints, mobileMax: '700px', tabletMax: '1100px' })
    expect(base).toContain('(max-width: 640px)')
    expect(base).toContain('(min-width: 641px)')
    expect(changed).toContain('(max-width: 700px)')
    expect(changed).toContain('(min-width: 701px) and (max-width: 1100px)')
    expect(changed).not.toContain('(max-width: 640px)')
  })

  it('fails the build for an unknown token instead of emitting a broken query', () => {
    expect(() => resolveBreakpoints('(max-width: bp(missing))', breakpoints)).toThrow(/missing/)
  })

  it('keeps TypeScript media queries and typography breakpoints on the same tokens', () => {
    expect(mediaQueries.mobile).toBe(`(max-width: ${breakpoints.mobileMax})`)
    expect(mediaQueries.desktop).toBe(`(min-width: ${Number.parseInt(breakpoints.tabletMax) + 1}px)`)
    expect(designTokensToCSS(siteTheme.tokens as DesignTokens)).toContain(`@media (max-width: ${breakpoints.mobileMax})`)
  })
})

describe('spacing, radius and shadow tokens', () => {
  const css = designTokensToCSS(siteTheme.tokens as DesignTokens)

  it('defines every spacing step the stylesheet references', () => {
    const used = new Set([...stylesheet.matchAll(/var\(--space-(\d+)/g)].map((match) => match[1]))
    for (const step of used) expect(css, `--space-${step}`).toContain(`--space-${step}:`)
    for (const step of ['8', '10', '20']) expect(css).toContain(`--space-${step}:`)
  })

  it('defines every radius and shadow token', () => {
    for (const name of Object.keys(siteTheme.tokens.radius)) expect(css).toContain(`--radius-${name}:`)
    for (const name of Object.keys(siteTheme.tokens.shadows)) expect(css).toContain(`--shadow-${name}:`)
  })
})
