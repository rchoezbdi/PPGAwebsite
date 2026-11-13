# Editing contract and DXP sync

The public site's `/api/editing-contract` endpoint remains on contract version 1 and preview protocol 1. Additions are optional so older DXP pages and previews continue to work.

## Component-adjacent editorial contracts

The component catalog in `src/experience/registry/catalog.ts` remains the source of field types, options, constraints, and sample props. Existing catalog-only declarations continue to work unchanged. A component may add a `*.editorial-contract.ts` sidecar next to its renderer; the sidecar is registered in `src/experience/components/contracts/index.ts` and may provide editorial labels for catalog field paths. The current Hero sidecar demonstrates this with `slides.headingHighlight`. Sidecars do not introduce new schema fields, arbitrary code, or design controls.

Functional Button `variant` fields remain editable inside Button groups. Their allowed values come only from `src/experience/components/atoms/buttonVariants.ts`; other presentation variants remain filtered from the editing contract.

## Page and composition data

`SiteEditingContract.pages` is optional and contains only page identity, path, version, section identity/code, and optional `initialContent` records. The public site does not own DXP page enumeration and does not populate this property with editorial content. Never add credentials, private data, or real editorial copy to `initialContent`.

The site DTO's optional `page.composition` is a published snapshot reference: `manifestId`, `version`, and ordered `{ instanceId, code, position }` sections. When present, the renderer displays only matching page components from that snapshot, in its order. Without it, the renderer retains legacy position-based DXP ordering. Deployment does not publish or expose a manifest by itself; the DXP must explicitly include a published composition in the page DTO.

## Manual synchronization

Configure `DXP_URL` and `DXP_APP_SLUG` as repository variables and `DXP_SITE_API_KEY` as a repository secret. `DXP_APP_SLUG` defaults to `ppga`. The key must be the server-only site credential accepted by the DXP; never use a `NEXT_PUBLIC_*` variable or commit credentials.

Run `npm run sync:editing-contract` to request synchronization. The script sends a bodyless `POST /api/dxp/site-contract/sync?app=<slug>` with `Authorization: Bearer …` and `x-dxp-app`; it does not transmit the editing contract or print the credential. The **Sync DXP editing contract** workflow runs after a successful GitHub deployment and can be retried with `workflow_dispatch`.
