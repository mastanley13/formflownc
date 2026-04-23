import { getSession } from '@/lib/auth'
import prisma from '@/lib/db'

export async function GET() {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Not authenticated.' }, { status: 401 })

  const forms = await prisma.formTemplate.findMany({
    where: { isActive: true },
    orderBy: { formNumber: 'asc' },
    select: { id: true, formNumber: true, formName: true, category: true, version: true },
  })

  return Response.json({ forms })
}
