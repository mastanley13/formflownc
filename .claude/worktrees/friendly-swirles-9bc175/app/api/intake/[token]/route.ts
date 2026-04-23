import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(
  _request: Request,
  context: { params: Promise<{ token: string }> }
) {
  const { token } = await context.params

  const pkg = await prisma.package.findUnique({
    where: { clientLinkToken: token },
    include: {
      agent: { select: { name: true, firmName: true, email: true, phone: true } },
      signers: { select: { name: true, email: true, role: true } },
    },
  })

  if (!pkg) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  if (new Date() > pkg.clientLinkExpiresAt) {
    return NextResponse.json({ error: 'Link expired' }, { status: 410 })
  }

  if (pkg.status === 'draft') {
    await prisma.package.update({ where: { id: pkg.id }, data: { status: 'client_opened' } })
  }

  return NextResponse.json({
    propertyAddress: pkg.propertyAddress,
    agentName: pkg.agent.name,
    agentFirm: pkg.agent.firmName,
    agentEmail: pkg.agent.email,
    agentPhone: pkg.agent.phone,
    formsSelected: JSON.parse(pkg.formsSelected as string),
    signers: pkg.signers,
    status: pkg.status,
  })
}

export async function POST(
  request: Request,
  context: { params: Promise<{ token: string }> }
) {
  const { token } = await context.params

  const pkg = await prisma.package.findUnique({ where: { clientLinkToken: token } })
  if (!pkg) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  if (new Date() > pkg.clientLinkExpiresAt) {
    return NextResponse.json({ error: 'Link expired' }, { status: 410 })
  }

  const body = await request.json()
  const { clientData } = body

  await prisma.package.update({
    where: { id: pkg.id },
    data: {
      clientData: JSON.stringify(clientData),
      status: 'client_completed',
    },
  })

  return NextResponse.json({ success: true })
}
