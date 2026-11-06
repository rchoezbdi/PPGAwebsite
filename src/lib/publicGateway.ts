/** Only visitor-facing operations can reach the DXP through the public site. */
export function allowedPublicPath(path: string, method: string): boolean {
  if (method === 'POST') return path === 'dxp/forms/submit'
  if (!['GET', 'HEAD'].includes(method)) return false
  return /^site-blog(?:\/[^/]+)?$/.test(path) || path === 'site-search' || /^media\/file\/[^/]+$/.test(path) || /^media\/\d+$/.test(path) || /^dxp\/documents\/(?:download|preview)$/.test(path)
}
