const { readFileSync } = require('node:fs')
const { join } = require('node:path')

/**
 * Media queries cannot read CSS custom properties, so the site's breakpoint tokens are resolved at
 * build time. styles.css writes `bp(mobileMax)` or `bp(mobileMax+1)` inside `@media` and this plugin
 * replaces them with the values of `siteTheme.json` -> `tokens.breakpoints`.
 * CommonJS because Next loads PostCSS plugins named in postcss.config with require().
 */
const REFERENCE = /bp\(\s*([A-Za-z][\w-]*)\s*(?:\+\s*(\d+)\s*)?\)/g

function resolveBreakpoints(params, breakpoints) {
  return params.replace(REFERENCE, (_match, name, offset) => {
    const value = Number.parseFloat(String((breakpoints || {})[name] ?? ''))
    if (!Number.isFinite(value)) throw new Error(`Breakpoint token "${name}" is missing from siteTheme.json tokens.breakpoints`)
    return `${value + Number(offset ?? 0)}px`
  })
}

const themePath = join(__dirname, '..', 'src', 'experience', 'design-system', 'siteTheme.json')

const plugin = (options = {}) => {
  const breakpoints = options.breakpoints || JSON.parse(readFileSync(themePath, 'utf8')).tokens.breakpoints
  return {
    postcssPlugin: 'ds-breakpoints',
    AtRule: { media(rule) { if (rule.params.includes('bp(')) rule.params = resolveBreakpoints(rule.params, breakpoints) } },
  }
}
plugin.postcss = true

module.exports = plugin
module.exports.resolveBreakpoints = resolveBreakpoints
