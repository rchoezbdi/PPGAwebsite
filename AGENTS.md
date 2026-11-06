# Sitio público

- Este proyecto es el frontend independiente. El contenido, permisos y datos pertenecen a la DXP.
- No incorporar Payload, colecciones, código de administración ni variables de base de datos.
- Usar el contrato v1 de `src/contracts/site.ts`; coordinar cambios incompatibles con la DXP.
- `DXP_URL` solo se usa en servidor. El gateway permite exclusivamente las rutas públicas declaradas en `src/lib/publicGateway.ts`.
- Componentes y estilos: `src/experience` y `src/app/styles.css`. Preferir los tokens del Design System.
- Verificar con `npm test`, `npm run build` y `npm run typecheck`.
- Mantener la paridad del Page Builder mediante una entrega revisada de cambios visuales a la DXP, según README.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
