import { prisma } from '@/lib/db'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params

  const pkg = await prisma.package.findUnique({
    where: { clientLinkToken: token },
    include: {
      signers: { select: { id: true, name: true, email: true, role: true } },
    },
  })

  if (!pkg) return Response.json({ error: 'Not found' }, { status: 404 })

  if (new Date(pkg.clientLinkExpiresAt) < new Date()) {
    if (pkg.status !== 'expired') {
      await prisma.package.update({ where: { id: pkg.id }, data: { status: 'expired' } })
    }
    return Response.json({ error: 'Link expired' }, { status: 410 })
  }

  if (pkg.status === 'draft' || pkg.status === 'link_sent') {
    await prisma.package.update({ where: { id: pkg.id }, data: { status: 'client_opened' } })
  }

  return Response.json({
    package: {
      id: pkg.id,
      propertyAddress: pkg.propertyAddress,
      status: pkg.status,
      formsSelected: JSON.parse(pkg.formsSelected),
      clientData: JSON.parse(pkg.clientData),
      signers: pkg.signers,
    },
  })
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params

  const pkg = await prisma.package.findUnique({ where: { clientLinkToken: token } })
  if (!pkg) return Response.json({ error: 'Not found' }, { status: 404 })

  if (new Date(pkg.clientLinkExpiresAt) < new Date()) {
    return Response.json({ error: 'Link expired' }, { status: 410 })
  }

  if (['client_completed', 'signatures_pending', 'completed'].includes(pkg.status)) {
    return Response.json({ error: 'Already submitted' }, { status: 409 })
  }

  const { clientData } = await request.json()

  await prisma.package.update({
    where: { id: pkg.id },
    data: {
      clientData: JSON.stringify(clientData ?? {}),
      status: 'client_completed',
    },
  })

  return Response.json({ ok: true })
}
