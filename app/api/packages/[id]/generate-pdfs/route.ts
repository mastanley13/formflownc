// POST /api/packages/[id]/generate-pdfs
// Fills all selected form PDFs for a package, saves to uploads/filled/[id]/,
// optionally submits to DocuSeal. Updates package status accordingly.

import { getSession } from '@/lib/auth'
import prisma from '@/lib/db'
import { fillPdf } from '@/lib/pdf-engine'
import type { CollectedData } from '@/lib/pdf-engine'
import { createSubmission } from '@/lib/docuseal'
import type { DocuSealDocument, DocuSealSigner } from '@/lib/docuseal'
import { buildZipFromBuffers } from '@/lib/zip'
import { readFile, writeFile, mkdir } from 'fs/promises'
import path from 'path'

export async function POST(req: Request, ctx: RouteContext<'/api/packages/[id]/generate-pdfs'>) {
  // Accept either an authenticated session or an internal server-to-server token
  const internalToken = req.headers.get('x-internal-token')
  const isInternal = internalToken && internalToken === process.env.INTERNAL_API_TOKEN && internalToken !== ''
  const session = isInternal ? null : await getSession()
  if (!isInternal && !session) return Response.json({ error: 'Not authenticated.' }, { status: 401 })

  const { id } = await ctx.params

  const pkg = await prisma.package.findUnique({
    where: { id },
    include: { agent: true, signers: true },
  })
  if (!pkg) return Response.json({ error: 'Package not found.' }, { status: 404 })
  if (session && pkg.agentId !== session.agentId) return Response.json({ error: 'Not authorized.' }, { status: 403 })

  const formIds: string[] = JSON.parse(pkg.formsSelected)
  const templates = await prisma.formTemplate.findMany({ where: { id: { in: formIds } } })

  const agentData = JSON.parse(pkg.agentData) as CollectedData
  const clientData = JSON.parse(pkg.clientData) as CollectedData
  const mergedData: CollectedData = { ...agentData, ...clientData }

  const outDir = path.join(process.cwd(), 'uploads', 'filled', id)
  await mkdir(outDir, { recursive: true })

  const fillResults: Array<{ formNumber: string; status: string; filledCount: number; filename: string }> = []
  const docusealDocs: DocuSealDocument[] = []

  for (const template of templates) {
    const filename = `form-${template.formNumber}.pdf`
    const outPath = path.join(outDir, filename)

    try {
      const pdfPath = path.resolve(process.cwd(), template.pdfFilePath)
      const pdfBytes = new Uint8Array(await readFile(pdfPath))
      const fieldMapping = JSON.parse(template.fieldMappings) as Record<string, string>

      const { pdfBytes: filledBytes, filledCount } = await fillPdf(pdfBytes, fieldMapping, mergedData, false)
      await writeFile(outPath, Buffer.from(filledBytes))

      docusealDocs.push({ name: `${template.formNumber} - ${template.formName}.pdf`, bytes: Buffer.from(filledBytes) })
      fillResults.push({ formNumber: template.formNumber, status: 'filled', filledCount, filename })
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      fillResults.push({ formNumber: template.formNumber, status: 'skipped', filledCount: 0, filename, })
      console.warn(`[generate-pdfs] Skipped form ${template.formNumber}: ${msg}`)
    }
  }

  const hasFilledDocs = docusealDocs.length > 0
  const docusealConfigured = Boolean(process.env.DOCUSEAL_API_URL && process.env.DOCUSEAL_API_TOKEN)

  let newStatus = 'client_completed'
  let docusealSubmissionId: string | null = null

  if (hasFilledDocs && docusealConfigured) {
    // Submit to DocuSeal for e-signatures
    const docusealSigners: DocuSealSigner[] = pkg.signers.map((s) => ({
      name: s.name,
      email: s.email,
      role: s.role,
      phone: s.phone ?? undefined,
    }))

    try {
      const submission = await createSubmission(docusealDocs, docusealSigners, `Please sign the documents for ${pkg.propertyAddress}`)
      if (submission) {
        docusealSubmissionId = String(submission.id)
        newStatus = 'signing'

        // Update submission IDs on signers
        for (const submitter of submission.submitters) {
          await prisma.packageSigner.updateMany({
            where: { packageId: id, email: submitter.email },
            data: { docusealSubmissionId: String(submission.id) },
          })
        }
      }
    } catch (e) {
      console.error('[generate-pdfs] DocuSeal submission failed:', e)
      // Don't block PDF generation — just skip signing
      newStatus = 'client_completed'
    }
  } else if (hasFilledDocs && !docusealConfigured) {
    // No DocuSeal configured — auto-complete (dev/demo mode)
    newStatus = 'completed'
  }

  await prisma.package.update({
    where: { id },
    data: { status: newStatus },
  })

  // Build zip for immediate download response
  const zipFiles = fillResults
    .filter((r) => r.status === 'filled')
    .map((r) => ({ filename: r.filename, bytes: Buffer.alloc(0) })) // placeholder; client will call /download

  void zipFiles // suppress unused warning

  return Response.json({
    ok: true,
    packageId: id,
    status: newStatus,
    fillResults,
    docusealSubmissionId,
    docusealConfigured,
    downloadUrl: `/api/packages/${id}/download`,
  })
}
