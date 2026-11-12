import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const projectRoot = dirname(fileURLToPath(import.meta.url))

const contentSecurityPolicy = (frameAncestors) => `default-src 'self'; img-src 'self' data: blob: https://bestdoctorsinsurance.com https://www.bestdoctorsinsurance.com https://cs.iubenda.com https://cdn.iubenda.com https://us-central.dx.dialpad.com; media-src 'self' blob: https://player.vimeo.com https://*.vimeocdn.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.jsdelivr.net https://rsms.me https://cdn.iubenda.com https://us-central.dx.dialpad.com; script-src 'self' 'unsafe-eval' 'unsafe-inline' https://cdn.jsdelivr.net https://cs.iubenda.com https://cdn.iubenda.com https://www.iubenda.com/cookie-solution/confs/js/ https://us-central.dx.dialpad.com https://challenges.cloudflare.com; worker-src 'self' blob:; connect-src 'self' https://cdn.jsdelivr.net https://cs.iubenda.com https://cdn.iubenda.com https://cpl.iubenda.com https://idb.iubenda.com https://us-central.dx.dialpad.com https://collector.http.dialpad.com https://lighthouse.dx.dialpad.com https://sr-client-cfg.amplitude.com https://api2.amplitude.com wss://us-central.dx.dialpad.com https://challenges.cloudflare.com https://countriesnow.space; font-src 'self' data: https://fonts.gstatic.com https://*.public.blob.vercel-storage.com https://cdn.jsdelivr.net https://rsms.me https://cdn.iubenda.com https://us-central.dx.dialpad.com; frame-src 'self' https://cdn.iubenda.com https://www.iubenda.com https://challenges.cloudflare.com https://www.youtube-nocookie.com https://www.paycomonline.net; frame-ancestors ${frameAncestors}; base-uri 'self'; form-action 'self'`

const securityHeaders = (frameAncestors) => [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  { key: 'Content-Security-Policy', value: contentSecurityPolicy(frameAncestors) },
]

// Only the DXP origin may embed the editor preview route; every other page stays unframeable.
const dxpFrameAncestor = () => {
  try { return new URL(process.env.DXP_URL ?? '').origin } catch { return "'none'" }
}

const nextConfig = {
  outputFileTracingRoot: projectRoot,
  turbopack: { root: projectRoot },
  experimental: { inlineCss: true },
  images: {
    qualities: [30, 40, 60, 75],
    localPatterns: [{ pathname: '/api/media/file/**' }],
    remotePatterns: [{ protocol: 'https', hostname: 'www.bestdoctorsinsurance.com', pathname: '/wp-content/uploads/**' }],
  },
  poweredByHeader: false,
  async redirects() {
    return [{ source: '/favicon.ico', destination: '/favicon.png', permanent: false }]
  },
  async headers() {
    return [
      { source: '/((?!editor-preview).*)', headers: securityHeaders("'self'") },
      { source: '/editor-preview', headers: securityHeaders(dxpFrameAncestor()) },
    ]
  },
}

export default nextConfig
