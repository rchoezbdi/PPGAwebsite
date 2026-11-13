# Sitio público

- Este proyecto es el frontend independiente. El contenido, permisos y datos pertenecen a la DXP.
- No incorporar Payload, colecciones, código de administración ni variables de base de datos.
- Usar el contrato v1 de `src/contracts/site.ts`; coordinar cambios incompatibles con la DXP.
- `DXP_URL` solo se usa en servidor. El gateway permite exclusivamente las rutas públicas declaradas en `src/lib/publicGateway.ts`.
- Componentes y estilos: `src/experience` y `src/app/styles.css`. Preferir los tokens del Design System.
- Verificar con `npm test`, `npm run build` y `npm run typecheck`.
- Mantener la paridad del Page Builder mediante una entrega revisada de cambios visuales a la DXP, según README.
- Para trabajar en la integración o añadir bloques editables, consulta `docs/frontend-site-contract.md` en el repositorio ExperienceBDI. No supongas que un `.tsx` nuevo aparece automáticamente en la DXP.
- Una sección requiere componente/renderer, entrada en `src/experience/registry/catalog.ts`, esquema y datos de muestra coherentes, y contrato publicado por `/api/editing-contract`. Mantén estable su `code` y las claves de `content`.
- El inventario de Design System se genera desde los componentes fuente y solo los lista para inspección/preview; no registra por sí mismo una sección insertable.
- Todo campo que el sitio necesite editar en Page Builder debe estar declarado en el contrato. El renderer puede consumir otras claves si ya existen en `content`; no expongas secretos o datos privados como contenido público.
- Coordina con la DXP cualquier cambio al DTO/API, al modelo de bloques guardados o a la definición de componentes que requiere el Page Builder. No subas la versión del contrato sin coordinación.
- El catálogo sigue siendo la fuente de esquemas; un componente puede añadir etiquetas editoriales en un sidecar `*.editorial-contract.ts` junto a su renderer, registrado en `src/experience/components/contracts/index.ts`. Consulta `docs/editing-contract-sync.md`.
- `page.composition` es opcional: solo se renderiza como snapshot publicado cuando el DTO lo incluye; sin él se conserva el orden heredado de DXP. No publiques manifiestos por despliegue.
- La sincronización manual usa `npm run sync:editing-contract`, variables de repositorio `DXP_URL`/`DXP_APP_SLUG` y el secreto `DXP_SITE_API_KEY`; nunca guardes credenciales ni contenido editorial real en el contrato.

## Evidencia GitHub/Copilot GPT Terra

- Se conservan contractVersion 1 y preview protocol 1; `pages` y `page.composition` son opcionales. El renderer aplica solo secciones que coinciden con la composición publicada; sin ella conserva el orden previo.
- Se agregó el sidecar editorial de Hero, se preservaron las variantes funcionales Button desde su módulo fuente y se conectaron GTM/Clarity a `page.integrations` manteniendo el consentimiento.
- Se añadió la sincronización manual y su workflow de despliegue. No se modificaron DXP ni BDIL.
- Validación PPGA: `npm test` (145 pruebas), `npm run typecheck` y `npm run build` completados correctamente.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
