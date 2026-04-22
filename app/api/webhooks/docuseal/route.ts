// POST /api/webhooks/docuseal
// Receives DocuSeal webhook events for submission completion.
// Configure in DocuSeal admin: Settings → Webhooks → add this URL.
//
// To verify authenticity, DocuSeal sends an X-DocuSeal-Signature header
// (HMAC-SHA256 of the raw body with DOCUSEAL_WEBHOOK_SECRET).

import prisma from '@/lib/db'
import type { DocuSealWebhookEvent } from '@/lib/docuseal'
import crypto from 'crypto'

function verifySignature(body: string, signature: string | null): boolean {
  const secret = process.env.DOCUSEAL_WEBHOOK_SECRET
  if (!secret || !signature) return !secret // skip verification if secret not configured
  const expected = crypto.createHmac('sha256', secret).update(body).digest('hex')
  return crypto.timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(signature, 'hex'))
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

  // Only handle full submission completion
  if (event.event_type === 'submission.completed') {
    const submissionId = String(event.data.id)

    // Find the signer record with this submission ID
    const signer = await prisma.packageSigner.findFirst({
      where: { docusealSubmissionId: submissionId },
      select: { packageId: true },
    })

    if (signer) {
      // Mark all signers on this submission as signed
      await prisma.packageSigner.updateMany({
        where: { docusealSubmissionId: submissionId },
        data: { signedAt: new Date() },
      })

      // Check if ALL signers for this package have signed
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
      }
    }
  }

  if (event.event_type === 'submitter.completed') {
    const submissionId = String(event.data.id)
    const completedEmail = event.data.submitters.find((s) => s.status === 'completed')?.email

    if (completedEmail) {
      await prisma.packageSigner.updateMany({
        where: { docusealSubmissionId: submissionId, email: completedEmail },
        data: { signedAt: new Date() },
      })
    }
  }

  return Response.json({ received: true })
}
