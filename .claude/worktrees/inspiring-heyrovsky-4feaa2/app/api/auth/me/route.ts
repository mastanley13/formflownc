import { getSession } from '@/lib/auth'
import prisma from '@/lib/db'

export async function GET() {
  const session = await getSession()
  if (!session) {
    return Response.json({ error: 'Not authenticated.' }, { status: 401 })
  }

  const agent = await prisma.agent.findUnique({
    where: { id: session.agentId },
    select: {
      id: true,
      email: true,
      name: true,
      phone: true,
      licenseNumber: true,
      firmName: true,
      firmAddress: true,
      firmPhone: true,
      firmLicense: true,
      createdAt: true,
    },
  })

  if (!agent) {
    return Response.json({ error: 'Agent not found.' }, { status: 404 })
  }

  return Response.json({ agent })
}
