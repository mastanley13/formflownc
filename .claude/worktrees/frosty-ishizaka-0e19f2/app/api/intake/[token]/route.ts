import prisma from '@/lib/db'
import { fillPdf } from '@/lib/pdf-engine'
import { getMappingForForm } from '@/lib/pdf-engine'
import type { CollectedData } from '@/lib/pdf-engine'
import { readFile } from 'fs/promises'
import path from 'path'

async function resolvePackage(token: string) {
  const pkg = await prisma.package.findUnique({
    where: { clientLinkToken: token },
    include: { agent: true, signers: true },
  })
  return pkg
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

  const forms = await prisma.formTemplate.findMany({
    where: { id: { in: JSON.parse(pkg.formsSelected) as string[] } },
    select: { id: true, formNumber: true, formName: true, category: true },
  })

  return Response.json({
    propertyAddress: pkg.propertyAddress,
    status: pkg.status,
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

  const clientData = await request.json()

  await prisma.package.update({
    where: { id: pkg.id },
    data: {
      clientData: JSON.stringify(clientData),
      status: 'signing',
    },
  })

  // Merge agent + client data for PDF fill
  const agentData = JSON.parse(pkg.agentData) as CollectedData
  const mergedData: CollectedData = { ...agentData, ...clientData }

  const formIds: string[] = JSON.parse(pkg.formsSelected)
  const templates = await prisma.formTemplate.findMany({ where: { id: { in: formIds } } })

  const fillResults: Array<{ formNumber: string; status: string; filledCount: number }> = []

  for (const template of templates) {
    try {
      const pdfPath = path.resolve(process.cwd(), template.pdfFilePath)
      const pdfBytes = new Uint8Array(await readFile(pdfPath))
      const fieldMapping = JSON.parse(template.fieldMappings) as Record<string, string>
      const { filledCount } = await fillPdf(pdfBytes, fieldMapping, mergedData, false)
      fillResults.push({ formNumber: template.formNumber, status: 'filled', filledCount })
    } catch {
      // Real PDFs may not exist yet in dev — record the attempt
      fillResults.push({ formNumber: template.formNumber, status: 'skipped_no_pdf', filledCount: 0 })
    }
  }

  // Stub: DocuSeal submission would happen here
  // await submitToDocuSeal(pkg, filledPdfs, pkg.signers)

  return Response.json({ ok: true, fillResults, status: 'signing' })
}
