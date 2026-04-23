import { getSession } from '@/lib/auth'
import prisma from '@/lib/db'

export async function GET(_req: Request, ctx: RouteContext<'/api/packages/[id]'>) {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Not authenticated.' }, { status: 401 })

  const { id } = await ctx.params

  const pkg = await prisma.package.findUnique({
    where: { id },
    include: {
      agent: {
        select: { id: true, name: true, email: true, firmName: true, phone: true },
      },
      signers: {
        orderBy: { id: 'asc' },
      },
    },
  })

  if (!pkg) return Response.json({ error: 'Package not found.' }, { status: 404 })
  if (pkg.agentId !== session.agentId) return Response.json({ error: 'Not authorized.' }, { status: 403 })

  const formIds: string[] = JSON.parse(pkg.formsSelected)
  const forms = await prisma.formTemplate.findMany({
    where: { id: { in: formIds } },
    select: { id: true, formNumber: true, formName: true, category: true },
  })

  return Response.json({ package: pkg, forms })
}
