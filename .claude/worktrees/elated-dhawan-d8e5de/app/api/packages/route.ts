import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { v4 as uuidv4 } from 'uuid'

export async function GET() {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const packages = await prisma.package.findMany({
    where: { agentId: session.agentId },
    include: {
      signers: { select: { id: true, name: true, email: true, role: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  return Response.json({ packages })
}

export async function POST(request: Request) {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { propertyAddress, formsSelected, signers, agentData } = await request.json()

    if (!propertyAddress?.trim()) {
      return Response.json({ error: 'Property address required' }, { status: 400 })
    }
    if (!formsSelected?.length) {
      return Response.json({ error: 'At least one form required' }, { status: 400 })
    }

    const token = uuidv4()
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

    const pkg = await prisma.package.create({
      data: {
        agentId: session.agentId,
        propertyAddress: propertyAddress.trim(),
        formsSelected: JSON.stringify(formsSelected),
        agentData: JSON.stringify(agentData ?? {}),
        clientLinkToken: token,
        clientLinkExpiresAt: expiresAt,
        status: 'link_sent',
        signers:
          signers?.length > 0
            ? {
                create: signers.map((s: { name: string; email: string; phone?: string; role: string }) => ({
                  name: s.name,
                  email: s.email,
                  phone: s.phone ?? null,
                  role: s.role,
                })),
              }
            : undefined,
      },
      include: { signers: true },
    })

    return Response.json({ package: pkg }, { status: 201 })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return Response.json({ error: `Failed to create package: ${message}` }, { status: 500 })
  }
}
