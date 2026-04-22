import prisma from '@/lib/db'

async function resolvePackage(token: string) {
  return prisma.package.findUnique({
    where: { clientLinkToken: token },
    include: { agent: true, signers: true },
  })
}

export async function GET(_req: Request, ctx: RouteContext<'/api/intake/[token]'>) {
  const { token } = await ctx.params

  const pkg = await resolvePackage(token)
  if (!pkg) return Response.json({ error: 'Link not found.' }, { status: 404 })

  if (new Date() > new Date(pkg.clientLinkExpiresAt)) {
    return Response.json({ error: 'This link has expired.' }, { status: 410 })
  }

  if (pkg.status === 'completed' || pkg.status === 'expired') {
    return Response.json({ error: 'This link is no longer active.' }, { status: 410 })
  }

  // Mark as opened on first access
  if (pkg.status === 'link_sent') {
    await prisma.package.update({
      where: { id: pkg.id },
      data: { status: 'client_opened' },
    })
  }

  const forms = await prisma.formTemplate.findMany({
    where: { id: { in: JSON.parse(pkg.formsSelected) as string[] } },
    select: { id: true, formNumber: true, formName: true, category: true },
  })

  return Response.json({
    propertyAddress: pkg.propertyAddress,
    status: pkg.status === 'link_sent' ? 'client_opened' : pkg.status,
    agent: {
      name: pkg.agent.name,
      firmName: pkg.agent.firmName,
      phone: pkg.agent.phone,
      email: pkg.agent.email,
    },
    forms,
    signers: pkg.signers.map((s) => ({ id: s.id, name: s.name, role: s.role })),
    expiresAt: pkg.clientLinkExpiresAt,
  })
}

export async function POST(request: Request, ctx: RouteContext<'/api/intake/[token]'>) {
  const { token } = await ctx.params

  const pkg = await resolvePackage(token)
  if (!pkg) return Response.json({ error: 'Link not found.' }, { status: 404 })
  if (new Date() > new Date(pkg.clientLinkExpiresAt)) {
    return Response.json({ error: 'This link has expired.' }, { status: 410 })
  }
  if (pkg.status === 'completed' || pkg.status === 'expired') {
    return Response.json({ error: 'This link is no longer active.' }, { status: 410 })
  }
  // Prevent re-submission if already past client_completed
  if (pkg.status === 'signing') {
    return Response.json({ error: 'Documents already submitted for signing.' }, { status: 409 })
  }

  let clientData: Record<string, string>
  try {
    const body = await request.json()
    if (typeof body !== 'object' || body === null || Array.isArray(body)) {
      return Response.json({ error: 'clientData must be an object.' }, { status: 400 })
    }
    // Allow only string values keyed by known canonical field names (basic allowlist check)
    clientData = Object.fromEntries(
      Object.entries(body as Record<string, unknown>)
        .filter(([k, v]) => typeof k === 'string' && k.length <= 64 && typeof v === 'string' && (v as string).length <= 1024)
        .map(([k, v]) => [k, v as string])
        .slice(0, 100)
    )
  } catch {
    return Response.json({ error: 'Invalid JSON body.' }, { status: 400 })
  }

  // Save client data and advance to client_completed
  await prisma.package.update({
    where: { id: pkg.id },
    data: {
      clientData: JSON.stringify(clientData),
      status: 'client_completed',
    },
  })

  // Trigger PDF generation + optional DocuSeal submission via internal API
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000'
    const genRes = await fetch(`${baseUrl}/api/packages/${pkg.id}/generate-pdfs`, {
      method: 'POST',
      headers: { 'x-internal-token': process.env.INTERNAL_API_TOKEN ?? '' },
    })
    if (genRes.ok) {
      const genData = await genRes.json() as { status?: string; fillResults?: unknown }
      return Response.json({ ok: true, fillResults: genData.fillResults, status: genData.status })
    }
  } catch {
    // Non-fatal — client data is saved; agent can regenerate manually
  }

  return Response.json({ ok: true, status: 'client_completed' })
}
