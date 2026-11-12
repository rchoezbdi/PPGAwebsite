import { buildEditingContract } from '@/experience/registry/editingContract'

export const dynamic = 'force-dynamic'

/** Public, read-only description of what the DXP may edit. It contains no content or secrets. */
export function GET() {
  return Response.json(buildEditingContract(), { headers: { 'Cache-Control': 'public, max-age=60, stale-while-revalidate=300' } })
}
