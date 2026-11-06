# PPGA public site

Standalone Next.js app for the PPGA public site. It reads published content from the DXP and keeps its own source, runtime configuration, and deployment lifecycle, separate from BDIL.

## Local development

1. Install the Node version specified in `package.json` and run `npm ci`.
2. Copy `.env.example` to `.env.local` if needed. The local defaults point to the DXP at `http://localhost:3000` and select `SITE_APP=ppga`.
3. Start the DXP locally on port 3000.
4. Run `npm run dev` and open `http://localhost:3002/`. PPGA is Spanish-only, so it uses the root path rather than `/es` or `/PPGA`.

This folder is an independent Git repository. Configure its own GitHub remote when the PPGA repository is created. Do not push it to the BDIL repository.
