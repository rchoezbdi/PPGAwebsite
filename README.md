# PPGA public site

Standalone Next.js app for the PPGA public site. It reads published content from the DXP and keeps its own source, runtime configuration, and deployment lifecycle, separate from BDIL.

## Local development

1. Install the Node version specified in `package.json` and run `npm ci`.
2. Copy `.env.example` to `.env.local` if needed. It points to the shared DXP API and selects `SITE_APP=ppga`.
3. Run `npm run dev` and open `http://localhost:3002/`. A local DXP checkout is not required; the configured DXP API must be reachable. PPGA is Spanish-only, so it uses the root path rather than `/es` or `/PPGA`.

This is an independent Git repository with its own GitHub remote, separate from BDIL.
