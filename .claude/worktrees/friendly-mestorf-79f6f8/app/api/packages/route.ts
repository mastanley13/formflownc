import { getSession } from '@/lib/auth'
import { verifyCsrfToken } from '@/lib/csrf'
import prisma from '@/lib/db'
import { sendPackageCreatedEmail } from '@/lib/email'
import { v4 as uuidv4 } from 'uuid'

export async function GET() {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Not authenticated.' }, { status: 401 })

  const packages = await prisma.package.findMany({
    where: { agentId: session.agentId },
    include: { signers: true },
    orderBy: { createdAt: 'desc' },
  })

  return Response.json({ packages })
}

export async function POST(request: Request) {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Not authenticated.' }, { status: 401 })

  const csrfToken = request.headers.get('x-csrf-token') ?? ''
  if (!verifyCsrfToken(csrfToken, session.agentId)) {
    return Response.json({ error: 'Invalid CSRF token.' }, { status: 403 })
  }

  try {
    const body = await request.json()
    const { propertyAddress, formsSelected, signers, agentData } = body

    if (!propertyAddress || typeof propertyAddress !== 'string') {
      return Response.json({ error: 'propertyAddress is required.' }, { status: 400 })
    }
    if (!Array.isArray(formsSelected) || formsSelected.length === 0) {
      return Response.json({ error: 'At least one form must be selected.' }, { status: 400 })
    }
    if (!Array.isArray(signers) || signers.length === 0) {
      return Response.json({ error: 'At least one signer is required.' }, { status: 400 })
    }

    const token = uuidv4()
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

    const pkg = await prisma.package.create({
      data: {
        agentId: session.agentId,
        propertyAddress: propertyAddress.trim(),
        status: 'link_sent',
        clientLinkToken: token,
        clientLinkExpiresAt: expiresAt,
        formsSelected: JSON.stringify(formsSelected),
        agentData: JSON.stringify(agentData || {}),
        clientData: JSON.stringify({}),
        signers: {
          create: signers.map((s: { name: string; email: string; phone?: string; role: string }) => ({
            name: s.name.trim(),
            email: s.email.toLowerCase().trim(),
            phone: s.phone?.trim() || null,
            role: s.role,
          })),
        },
      },
      include: { signers: true },
    })

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const clientLink = `${appUrl}/intake/${token}`

    const agent = await prisma.agent.findUnique({
      where: { id: session.agentId },
      select: { name: true, email: true },
    })
    if (agent) {
      sendPackageCreatedEmail({
        agentEmail: agent.email,
        agentName: agent.name,
        propertyAddress: propertyAddress.trim(),
        clientLink,
        expiresAt,
      }).catch((e) => console.error('[email] Package created email failed:', e))
    }

    return Response.json({ package: pkg, clientLink }, { status: 201 })
  } catch (err) {
    console.error('[packages POST] Unexpected error:', err)
    return Response.json({ error: 'Internal server error.' }, { status: 500 })
  }
}
