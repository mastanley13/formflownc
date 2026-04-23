// POST /api/webhooks/docuseal
// Receives DocuSeal webhook events for submission completion.
// Configure in DocuSeal admin: Settings → Webhooks → add this URL.
//
// To verify authenticity, DocuSeal sends an X-DocuSeal-Signature header
// (HMAC-SHA256 of the raw body with DOCUSEAL_WEBHOOK_SECRET).

import prisma from '@/lib/db'
import type { DocuSealWebhookEvent } from '@/lib/docuseal'
import { sendAgentCompletionEmail, sendSignerCompletionEmail } from '@/lib/email'
import { readFile } from 'fs/promises'
import path from 'path'
import crypto from 'crypto'

function verifySignature(body: string, signature: string | null): boolean {
  const secret = process.env.DOCUSEAL_WEBHOOK_SECRET
  if (!secret || !signature) return !secret // skip verification if secret not configured
  const expected = crypto.createHmac('sha256', secret).update(body).digest('hex')
  // Both must be the same hex length before timingSafeEqual
  if (expected.length !== signature.length) return false
  try {
    return crypto.timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(signature, 'hex'))
  } catch {
    return false
  }
}

export async function POST(request: Request) {
  const rawBody = await request.text()
  const signature = request.headers.get('x-docuseal-signature')

  if (!verifySignature(rawBody, signature)) {
    return Response.json({ error: 'Invalid webhook signature.' }, { status: 401 })
  }

  let event: DocuSealWebhookEvent
  try {
    event = JSON.parse(rawBody) as DocuSealWebhookEvent
  } catch {
    return Response.json({ error: 'Invalid JSON payload.' }, { status: 400 })
  }

  // Individual signer completed
  if (event.event_type === 'submitter.completed') {
    // submission_id is the parent submission; data.id is the submitter record ID
    const submissionId = String(event.data.submission_id ?? event.data.id)
    const signerEmail = event.data.email ?? event.data.submitters.find((s) => s.status === 'completed')?.email
    if (signerEmail) {
      await prisma.packageSigner.updateMany({
        where: { docusealSubmissionId: submissionId, email: signerEmail },
        data: { signedAt: new Date() },
      })

      const signer = await prisma.packageSigner.findFirst({
        where: { docusealSubmissionId: submissionId, email: signerEmail },
        include: { package: { include: { agent: true } } },
      })
      if (signer) {
        sendSignerCompletionEmail({
          signerEmail: signer.email,
          signerName: signer.name,
          propertyAddress: signer.package.propertyAddress,
          agentName: signer.package.agent.name,
        }).catch((e) => console.error('[email] Signer completion email failed:', e))
      }
    }
  }

  // Full submission completed — all parties have signed
  if (event.event_type === 'submission.completed') {
    const submissionId = String(event.data.id)

    const signer = await prisma.packageSigner.findFirst({
      where: { docusealSubmissionId: submissionId },
      select: { packageId: true },
    })

    if (signer) {
      await prisma.packageSigner.updateMany({
        where: { docusealSubmissionId: submissionId },
        data: { signedAt: new Date() },
      })

      const packageSigners = await prisma.packageSigner.findMany({
        where: { packageId: signer.packageId },
        select: { signedAt: true },
      })

      const allSigned = packageSigners.every((s) => s.signedAt !== null)
      if (allSigned) {
        await prisma.package.update({
          where: { id: signer.packageId },
          data: { status: 'completed' },
        })

        // Send all signed PDFs to the agent
        const pkg = await prisma.package.findUnique({
          where: { id: signer.packageId },
          include: { agent: true },
        })
        if (pkg) {
          const filledDir = path.join(process.cwd(), 'uploads', 'filled', pkg.id)
          const attachments: Array<{ filename: string; content: Buffer }> = []
          try {
            const { readdir } = await import('fs/promises')
            const files = await readdir(filledDir)
            for (const f of files.filter((n) => n.endsWith('.pdf'))) {
              const buf = await readFile(path.join(filledDir, f))
              attachments.push({ filename: f, content: buf })
            }
          } catch {
            // Filled directory may not exist — skip attachments
          }

          sendAgentCompletionEmail({
            agentEmail: pkg.agent.email,
            agentName: pkg.agent.name,
            propertyAddress: pkg.propertyAddress,
            attachments,
          }).catch((e) => console.error('[email] Agent completion email failed:', e))
        }
      }
    }
  }

  return Response.json({ received: true })
}
