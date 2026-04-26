// Shared PDF generation logic used by both:
// - POST /api/intake/[token] (inline, after client submits data)
// - POST /api/packages/[id]/generate-pdfs (manual trigger from dashboard)

import prisma from '@/lib/db'
import { fillPdf } from '@/lib/pdf-engine'
import type { CollectedData } from '@/lib/pdf-engine'
import { createSubmission } from '@/lib/docuseal'
import type { DocuSealDocument, DocuSealSigner } from '@/lib/docuseal'
import { readFile, writeFile, mkdir } from 'fs/promises'
import path from 'path'

export type GenerateResult = {
  ok: boolean
  packageId: string
  status: string
  fillResults: Array<{ formNumber: string; status: string; filledCount: number; filename: string }>
  docusealSubmissionId: string | null
  docusealConfigured: boolean
  downloadUrl: string
}

/**
 * Fill all selected form PDFs for a package, save to uploads/filled/[id]/,
 * optionally submit to DocuSeal for e-signatures, and update package status.
 */
export async function generatePackagePdfs(packageId: string): Promise<GenerateResult> {
  const pkg = await prisma.package.findUnique({
    where: { id: packageId },
    include: { agent: true, signers: true },
  })
  if (!pkg) throw new Error('Package not found')

  let formIds: string[]
  let agentData: CollectedData
  let clientData: CollectedData
  try {
    formIds = JSON.parse(pkg.formsSelected) as string[]
    agentData = JSON.parse(pkg.agentData) as CollectedData
    clientData = JSON.parse(pkg.clientData) as CollectedData
  } catch {
    throw new Error('Package data is corrupt')
  }

  const templates = await prisma.formTemplate.findMany({ where: { id: { in: formIds } } })
  const mergedData: CollectedData = { ...agentData, ...clientData }

  // Use /tmp on Vercel (read-only filesystem), local dir otherwise
  const baseDir = process.env.VERCEL ? '/tmp' : path.join(process.cwd(), 'uploads', 'filled')
  const outDir = path.join(baseDir, packageId)
  await mkdir(outDir, { recursive: true })

  const fillResults: GenerateResult['fillResults'] = []
  const docusealDocs: DocuSealDocument[] = []
  const filledDocsMap: Record<string, string> = {} // formNumber -> base64

  for (const template of templates) {
    const filename = `form-${template.formNumber}.pdf`
    const outPath = path.join(outDir, filename)

    try {
      const pdfPath = path.resolve(process.cwd(), template.pdfFilePath)
      const pdfBytes = new Uint8Array(await readFile(pdfPath))
      const fieldMapping = JSON.parse(template.fieldMappings) as Record<string, string>

      const { pdfBytes: filledBytes, filledCount } = await fillPdf(pdfBytes, fieldMapping, mergedData, false)
      await writeFile(outPath, Buffer.from(filledBytes))

      const filledBuffer = Buffer.from(filledBytes)
      docusealDocs.push({ name: `${template.formNumber} - ${template.formName}.pdf`, bytes: filledBuffer })
      filledDocsMap[template.formNumber] = filledBuffer.toString('base64')
      fillResults.push({ formNumber: template.formNumber, status: 'filled', filledCount, filename })
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      fillResults.push({ formNumber: template.formNumber, status: 'skipped', filledCount: 0, filename })
      console.warn(`[generate-pdfs] Skipped form ${template.formNumber}: ${msg}`)
    }
  }

  // Persist filled PDFs to database so they survive across serverless invocations
  if (Object.keys(filledDocsMap).length > 0) {
    await prisma.package.update({
      where: { id: packageId },
      data: { filledDocuments: JSON.stringify(filledDocsMap) },
    })
  }

  const hasFilledDocs = docusealDocs.length > 0
  const docusealConfigured = Boolean(process.env.DOCUSEAL_API_URL && process.env.DOCUSEAL_API_TOKEN)

  let newStatus = 'client_completed'
  let docusealSubmissionId: string | null = null

  if (hasFilledDocs && docusealConfigured) {
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

        for (const submitter of submission.submitters) {
          // Store "submissionId:slug" so we can construct signing URLs later
          const signerRef = `${submission.id}:${submitter.slug}`
          await prisma.packageSigner.updateMany({
            where: { packageId, email: submitter.email },
            data: { docusealSubmissionId: signerRef },
          })
        }
      }
    } catch (e) {
      const errMsg = e instanceof Error ? e.stack || e.message : String(e)
      console.error('[generate-pdfs] DocuSeal submission failed:', errMsg)
      newStatus = 'client_completed'
    }
  } else if (hasFilledDocs && !docusealConfigured) {
    newStatus = 'completed'
  }

  await prisma.package.update({
    where: { id: packageId },
    data: { status: newStatus },
  })

  return {
    ok: true,
    packageId,
    status: newStatus,
    fillResults,
    docusealSubmissionId,
    docusealConfigured,
    downloadUrl: `/api/packages/${packageId}/download`,
  }
}
