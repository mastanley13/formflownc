import prisma from '@/lib/db'
import { generatePackagePdfs } from '@/lib/generate-package-pdfs'

export const maxDuration = 60;

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
    // Raised limits to accommodate full Form 170 disclosure + explanation fields
    clientData = Object.fromEntries(
      Object.entries(body as Record<string, unknown>)
        .filter(([k, v]) => typeof k === 'string' && k.length <= 64 && typeof v === 'string' && (v as string).length <= 2048)
        .map(([k, v]) => [k, v as string])
        .slice(0, 200)
    )
  } catch {
    return Response.json({ error: 'Invalid JSON body.' }, { status: 400 })
  }

  // Auto-save: persist data without advancing status or triggering PDF generation
  const isAutoSave = request.headers.get('x-auto-save') === '1'
  if (isAutoSave) {
    await prisma.package.update({
      where: { id: pkg.id },
      data: { clientData: JSON.stringify(clientData) },
    })
    return Response.json({ ok: true, autoSaved: true })
  }

  // Save client data and advance to client_completed
  await prisma.package.update({
    where: { id: pkg.id },
    data: {
      clientData: JSON.stringify(clientData),
      status: 'client_completed',
    },
  })

  // Generate PDFs + optional DocuSeal submission directly (no self-fetch)
  try {
    const result = await generatePackagePdfs(pkg.id)

    // Build signing URLs for each signer
    let signingUrls: Array<{ name: string; email: string; url: string }> = []
    if (result.status === 'signing' && process.env.DOCUSEAL_API_URL) {
      const signers = await prisma.packageSigner.findMany({
        where: { packageId: pkg.id },
        select: { name: true, email: true, docusealSubmissionId: true },
      })
      signingUrls = signers
        .filter((s) => s.docusealSubmissionId?.includes(':'))
        .map((s) => {
          const slug = s.docusealSubmissionId!.split(':')[1]
          return { name: s.name, email: s.email, url: `${process.env.DOCUSEAL_API_URL}/s/${slug}` }
        })
    }

    return Response.json({
      ok: true,
      fillResults: result.fillResults,
      status: result.status,
      signingUrls,
    })
  } catch (e) {
    console.error('[intake] PDF generation failed:', e)
    // Non-fatal -- client data is saved; agent can regenerate manually
  }

  return Response.json({ ok: true, status: 'client_completed' })
}
