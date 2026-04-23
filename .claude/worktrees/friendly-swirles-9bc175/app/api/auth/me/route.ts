import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET() {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const agent = await prisma.agent.findUnique({
    where: { id: session.agentId },
    select: { id: true, email: true, name: true, firmName: true, licenseNumber: true, phone: true },
  })

  if (!agent) {
    return NextResponse.json({ error: 'Agent not found' }, { status: 404 })
  }

  return NextResponse.json(agent)
}
