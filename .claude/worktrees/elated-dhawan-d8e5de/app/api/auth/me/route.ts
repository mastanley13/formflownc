import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET() {
  const session = await getSession()
  if (!session) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const agent = await prisma.agent.findUnique({
    where: { id: session.agentId },
    select: {
      id: true,
      email: true,
      name: true,
      phone: true,
      firmName: true,
      licenseNumber: true,
    },
  })

  if (!agent) {
    return Response.json({ error: 'Not found' }, { status: 404 })
  }

  return Response.json({ agent })
}
