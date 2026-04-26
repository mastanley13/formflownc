// GET /api/intake/[token]/documents?form=140
// Public endpoint — serves individual filled PDFs using the intake token for auth.
// Reads from the filledDocuments JSON column (base64-encoded PDFs stored in DB).

import prisma from '@/lib/db'

export async function GET(req: Request, ctx: RouteContext<'/api/intake/[token]/documents'>) {
  const { token } = await ctx.params
  const url = new URL(req.url)
  const formNumber = url.searchParams.get('form')

  if (!formNumber) {
    return Response.json({ error: 'Missing ?form= parameter' }, { status: 400 })
  }

  const pkg = await prisma.package.findUnique({
    where: { clientLinkToken: token },
    select: { id: true, status: true, clientLinkExpiresAt: true, filledDocuments: true },
  })

  if (!pkg) return Response.json({ error: 'Not found' }, { status: 404 })
  if (new Date() > new Date(pkg.clientLinkExpiresAt)) {
    return Response.json({ error: 'Link expired' }, { status: 410 })
  }

  // Only serve documents after client has completed intake
  if (!['client_completed', 'signing', 'completed'].includes(pkg.status)) {
    return Response.json({ error: 'Documents not yet available' }, { status: 404 })
  }

  try {
    const docs = JSON.parse(pkg.filledDocuments) as Record<string, string>
    const base64 = docs[formNumber]
    if (!base64) {
      return Response.json({ error: 'Document not found' }, { status: 404 })
    }

    const pdfBytes = Buffer.from(base64, 'base64')
    return new Response(pdfBytes, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="Form-${formNumber}.pdf"`,
        'Cache-Control': 'private, max-age=3600',
      },
    })
  } catch {
    return Response.json({ error: 'Document not found' }, { status: 404 })
  }
}
