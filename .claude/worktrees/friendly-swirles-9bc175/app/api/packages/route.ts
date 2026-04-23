import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { v4 as uuidv4 } from 'uuid'

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const packages = await prisma.package.findMany({
    where: { agentId: session.agentId },
    orderBy: { createdAt: 'desc' },
    include: {
      signers: { select: { name: true, role: true, email: true } },
    },
  })

  return NextResponse.json(packages)
}

export async function POST(request: Request) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { propertyAddress, formsSelected, signers, agentData } = body

  if (!propertyAddress || !formsSelected?.length) {
    return NextResponse.json({ error: 'Property address and forms required' }, { status: 400 })
  }

  const token = uuidv4()
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

  const pkg = await prisma.package.create({
    data: {
      agentId: session.agentId,
      propertyAddress,
      status: 'link_sent',
      clientLinkToken: token,
      clientLinkExpiresAt: expiresAt,
      formsSelected: JSON.stringify(formsSelected),
      agentData: JSON.stringify(agentData ?? {}),
      signers: {
        create: (signers ?? []).map((s: { name: string; email: string; phone?: string; role: string }) => ({
          name: s.name,
          email: s.email,
          phone: s.phone ?? null,
          role: s.role,
        })),
      },
    },
    include: { signers: true },
  })

  return NextResponse.json({ packageId: pkg.id, clientLinkToken: token }, { status: 201 })
}
