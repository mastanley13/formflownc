import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await context.params

  const pkg = await prisma.package.findFirst({
    where: { id, agentId: session.agentId },
    include: { signers: true },
  })

  if (!pkg) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  return NextResponse.json(pkg)
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await context.params
  const body = await request.json()

  const pkg = await prisma.package.findFirst({ where: { id, agentId: session.agentId } })
  if (!pkg) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const updated = await prisma.package.update({
    where: { id },
    data: {
      ...(body.status && { status: body.status }),
      ...(body.agentData && { agentData: JSON.stringify(body.agentData) }),
      ...(body.clientData && { clientData: JSON.stringify(body.clientData) }),
    },
  })

  return NextResponse.json(updated)
}
