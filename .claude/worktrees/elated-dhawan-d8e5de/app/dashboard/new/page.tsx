import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { redirect } from 'next/navigation'
import NewPackageWizard from './wizard'

export default async function NewPackagePage() {
  const session = await getSession()
  if (!session) redirect('/login')

  const [forms, agent] = await Promise.all([
    prisma.formTemplate.findMany({
      where: { isActive: true },
      select: { id: true, formNumber: true, formName: true, category: true },
      orderBy: { formNumber: 'asc' },
    }),
    prisma.agent.findUnique({
      where: { id: session.agentId },
      select: {
        name: true,
        email: true,
        phone: true,
        firmName: true,
        licenseNumber: true,
        firmAddress: true,
        firmPhone: true,
        firmLicense: true,
      },
    }),
  ])

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-6">New Package</h1>
      <NewPackageWizard forms={forms} agentProfile={agent} />
    </div>
  )
}
