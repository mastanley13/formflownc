import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET() {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const forms = await prisma.formTemplate.findMany({
    where: { isActive: true },
    select: {
      id: true,
      formNumber: true,
      formName: true,
      category: true,
      version: true,
    },
    orderBy: { formNumber: 'asc' },
  })

  return Response.json({ forms })
}
