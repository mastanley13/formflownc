// POST /api/admin/purge
// Manually triggers the expired-package purge job for the authenticated agent.
// Agent-only — verifies session.

import { getSession } from '@/lib/auth'
import { purgeExpiredPackages } from '@/lib/purge'

export async function POST() {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Not authenticated.' }, { status: 401 })

  const result = await purgeExpiredPackages(session.agentId)
  return Response.json({ ok: true, ...result })
}
