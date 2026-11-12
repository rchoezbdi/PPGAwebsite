import { dxpHeaders, dxpURL } from '@/lib/dxp'
import { allowedPublicPath } from '@/lib/publicGateway'

export const dynamic = 'force-dynamic'
async function forward(request: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const segments = (await params).path
  if (segments.some(part => /[\\/]|^\.{1,2}$/.test(part))) return Response.json({ error: 'Invalid path' }, { status: 400 })
  const path = segments.join('/')
  if (!allowedPublicPath(path, request.method)) return Response.json({ error: 'Not found' }, { status: 404 })
  const url = dxpURL(`/api/${segments.map(encodeURIComponent).join('/')}`)
  url.search = new URL(request.url).search
  if (/^media\/\d+$/.test(path)) {
    url.pathname = '/api/site-runtime'
    url.search = new URLSearchParams({ resource: 'media', id: segments[1] }).toString()
  }
  const headers = dxpHeaders()
  for (const key of ['accept', 'content-type', 'range', 'if-none-match', 'x-forwarded-for']) {
    const value = request.headers.get(key)
    if (value) headers.set(key, value)
  }
  if (Number(request.headers.get('content-length')) > 20 * 1024 * 1024) return new Response('Payload too large', { status: 413 })
  const body = request.method === 'POST' ? await request.arrayBuffer() : undefined
  if (body && body.byteLength > 20 * 1024 * 1024) return new Response('Payload too large', { status: 413 })
  try {
    const upstream = await fetch(url, { method: request.method, headers, body, cache: 'no-store', redirect: 'manual', signal: AbortSignal.timeout(30000) })
    const responseHeaders = new Headers()
    for (const key of ['content-type', 'content-disposition', 'content-length', 'content-range', 'accept-ranges', 'cache-control', 'etag', 'location']) {
      const value = upstream.headers.get(key)
      if (value) responseHeaders.set(key, value)
    }
    responseHeaders.set('x-content-type-options', 'nosniff')
    return new Response(upstream.body, { status: upstream.status, headers: responseHeaders })
  } catch { return Response.json({ error: 'The DXP service is temporarily unavailable.' }, { status: 502 }) }
}
export { forward as GET, forward as HEAD, forward as POST }
