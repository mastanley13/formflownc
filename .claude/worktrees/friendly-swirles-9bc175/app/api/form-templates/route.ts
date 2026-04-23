import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const templates = await prisma.formTemplate.findMany({
    where: { isActive: true },
    select: { id: true, formNumber: true, formName: true, category: true },
    orderBy: { formNumber: 'asc' },
  })

  return NextResponse.json(templates)
}
