// POST /api/packages/[id]/generate-pdfs
// Fills all selected form PDFs for a package, saves to uploads/filled/[id]/,
// optionally submits to DocuSeal. Updates package status accordingly.
//
// This route is kept for manual triggers from the dashboard.
// The intake POST handler calls generatePackagePdfs() directly.

import { getSession } from '@/lib/auth'
import prisma from '@/lib/db'
import { generatePackagePdfs } from '@/lib/generate-package-pdfs'

export async function POST(req: Request, ctx: RouteContext<'/api/packages/[id]/generate-pdfs'>) {
  const INTERNAL_API_TOKEN = process.env.INTERNAL_API_TOKEN
  if (!INTERNAL_API_TOKEN) {
    console.error('[generate-pdfs] INTERNAL_API_TOKEN is not set')
    return Response.json({ error: 'Server misconfiguration.' }, { status: 500 })
  }

  // Accept either an authenticated session or an internal server-to-server token
  const internalToken = req.headers.get('x-internal-token')
  const isInternal = Boolean(internalToken && internalToken === INTERNAL_API_TOKEN)
  const session = isInternal ? null : await getSession()
  if (!isInternal && !session) return Response.json({ error: 'Not authenticated.' }, { status: 401 })

  const { id } = await ctx.params

  // Authorization check: verify agent owns this package
  if (session) {
    const pkg = await prisma.package.findUnique({ where: { id }, select: { agentId: true } })
    if (!pkg) return Response.json({ error: 'Package not found.' }, { status: 404 })
    if (pkg.agentId !== session.agentId) return Response.json({ error: 'Not authorized.' }, { status: 403 })
  }

  try {
    const result = await generatePackagePdfs(id)
    return Response.json(result)
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error('[generate-pdfs] Failed:', msg)
    return Response.json({ error: msg }, { status: 500 })
  }
}
