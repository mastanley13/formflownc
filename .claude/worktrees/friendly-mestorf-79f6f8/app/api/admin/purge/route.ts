// POST /api/admin/purge
// Manually triggers the expired-package purge job for the authenticated agent.
// Agent-only — verifies session.

import { getSession } from '@/lib/auth'
import { verifyCsrfToken } from '@/lib/csrf'
import { purgeExpiredPackages } from '@/lib/purge'

export async function POST(request: Request) {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Not authenticated.' }, { status: 401 })

  const csrfToken = request.headers.get('x-csrf-token') ?? ''
  if (!verifyCsrfToken(csrfToken, session.agentId)) {
    return Response.json({ error: 'Invalid CSRF token.' }, { status: 403 })
  }

  const result = await purgeExpiredPackages(session.agentId)
  return Response.json({ ok: true, ...result })
}
