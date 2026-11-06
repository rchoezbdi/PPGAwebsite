import { NextResponse, type NextRequest } from 'next/server'
import { dxpURL, siteRoute } from '@/lib/dxp'
import { canonicalPublicPath } from '@/lib/publicRoutes'

export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname
  if (/^\/(?:share|preview|preview-canvas|preview-opening|set-password|reset-password|login)(?:\/|$)/.test(path)) return NextResponse.redirect(dxpURL(`${path}${request.nextUrl.search}`))
  if (path.startsWith('/site-render/')) return new NextResponse('Not found', { status: 404 })
  if (/\.[a-z0-9]+$/i.test(path)) return NextResponse.next()
  const route = await siteRoute(request.headers.get('host') ?? '', path)
  if (!route) return new NextResponse('Site not configured', { status: 404 })
  const publicPath = path.slice(route.basePath.length) || '/'
  const localized = /^\/(en|es|pt)(\/.*)?$/.exec(publicPath)
  const locale = localized?.[1] ?? route.defaultLocale
  if (route.hasLocalePrefix && !localized) {
    const destination = request.nextUrl.clone()
    destination.pathname = `${route.basePath}/${locale}${publicPath === '/' ? '' : publicPath}`
    return NextResponse.redirect(destination)
  }
  if (!route.hasLocalePrefix && localized) {
    const destination = request.nextUrl.clone()
    destination.pathname = `${route.basePath}${localized[2] || '/'}`
    return NextResponse.redirect(destination)
  }
  const suffix = localized ? localized[2] || '/' : publicPath
  const canonical = canonicalPublicPath(suffix, locale)
  if (canonical !== suffix && !(canonical === '/' && suffix === '')) {
    const destination = request.nextUrl.clone()
    destination.pathname = `${route.basePath}${route.hasLocalePrefix ? `/${locale}` : ''}${canonical === '/' ? '' : canonical}` || '/'
    return NextResponse.redirect(destination)
  }
  const destination = request.nextUrl.clone()
  destination.pathname = `/site-render/${route.appSlug}${suffix === '/' ? '' : suffix}`
  destination.searchParams.set('locale', locale)
  const forwardedHeaders = new Headers(request.headers)
  forwardedHeaders.set('x-site-locale', locale)
  return NextResponse.rewrite(destination, { request: { headers: forwardedHeaders } })
}
export const config = { matcher: ['/((?!api(?:/|$)|_next(?:/|$)|sitemap.xml|robots.txt|favicon.ico).*)'] }
