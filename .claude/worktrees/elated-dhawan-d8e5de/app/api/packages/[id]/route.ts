import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const pkg = await prisma.package.findFirst({
    where: { id, agentId: session.agentId },
    include: { signers: true },
  })

  if (!pkg) return Response.json({ error: 'Not found' }, { status: 404 })

  return Response.json({ package: pkg })
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const pkg = await prisma.package.findFirst({ where: { id, agentId: session.agentId } })
  if (!pkg) return Response.json({ error: 'Not found' }, { status: 404 })

  const body = await request.json()
  const updated = await prisma.package.update({
    where: { id },
    data: {
      ...(body.status !== undefined && { status: body.status }),
      ...(body.agentData !== undefined && { agentData: JSON.stringify(body.agentData) }),
    },
  })

  return Response.json({ package: updated })
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const pkg = await prisma.package.findFirst({ where: { id, agentId: session.agentId } })
  if (!pkg) return Response.json({ error: 'Not found' }, { status: 404 })

  await prisma.package.delete({ where: { id } })

  return Response.json({ ok: true })
}
