// GET /api/packages/[id]/download
// Returns a zip of all filled PDFs for a package.
// Agent-only — verifies session and package ownership.

import { getSession } from '@/lib/auth'
import prisma from '@/lib/db'
import { buildZipFromDirectory } from '@/lib/zip'
import path from 'path'

export async function GET(_req: Request, ctx: RouteContext<'/api/packages/[id]/download'>) {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Not authenticated.' }, { status: 401 })

  const { id } = await ctx.params

  const pkg = await prisma.package.findUnique({
    where: { id },
    select: { id: true, agentId: true, propertyAddress: true, status: true },
  })
  if (!pkg) return Response.json({ error: 'Package not found.' }, { status: 404 })
  if (pkg.agentId !== session.agentId) return Response.json({ error: 'Not authorized.' }, { status: 403 })

  // Use /tmp on Vercel (read-only filesystem), local dir otherwise
  const baseDir = process.env.VERCEL ? '/tmp' : path.join(process.cwd(), 'uploads', 'filled')
  const filledDir = path.join(baseDir, id)
  const address = pkg.propertyAddress.replace(/[^a-z0-9 ]/gi, '').replace(/\s+/g, '-').toLowerCase()
  const zipFilename = `formflownc-${address}.zip`

  try {
    const zipBuffer = await buildZipFromDirectory(filledDir)

    return new Response(new Uint8Array(zipBuffer), {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${zipFilename}"`,
        'Content-Length': String(zipBuffer.length),
      },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return Response.json({ error: `Download failed: ${message}` }, { status: 500 })
  }
}
