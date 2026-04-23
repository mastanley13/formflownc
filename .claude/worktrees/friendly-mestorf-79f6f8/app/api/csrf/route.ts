import { getSession } from '@/lib/auth'
import { generateCsrfToken } from '@/lib/csrf'

export async function GET() {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Not authenticated.' }, { status: 401 })
  const token = generateCsrfToken(session.agentId)
  return Response.json({ token })
}
