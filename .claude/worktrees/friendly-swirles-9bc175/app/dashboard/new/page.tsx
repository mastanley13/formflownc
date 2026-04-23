import { getSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import NewPackageWizard from './wizard'

export default async function NewPackagePage() {
  const session = await getSession()
  if (!session) redirect('/login')

  const formTemplates = await prisma.formTemplate.findMany({
    where: { isActive: true },
    select: { id: true, formNumber: true, formName: true, category: true },
    orderBy: { formNumber: 'asc' },
  })

  return (
    <NewPackageWizard
      formTemplates={formTemplates.map(t => ({
        ...t,
        categories: JSON.parse(t.category as string) as string[],
      }))}
    />
  )
}
