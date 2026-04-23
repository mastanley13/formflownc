import { getSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import Link from 'next/link'
import PackageList from './package-list'

export default async function DashboardPage() {
  const session = await getSession()
  if (!session) redirect('/login')

  const packages = await prisma.package.findMany({
    where: { agentId: session.agentId },
    orderBy: { createdAt: 'desc' },
    include: {
      signers: { select: { name: true, role: true } },
    },
  })

  const serialized = packages.map(p => ({
    id: p.id,
    propertyAddress: p.propertyAddress,
    status: p.status,
    clientLinkToken: p.clientLinkToken,
    clientLinkExpiresAt: p.clientLinkExpiresAt.toISOString(),
    createdAt: p.createdAt.toISOString(),
    signers: p.signers,
  }))

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900">My Packages</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            {packages.length === 0 ? 'No packages yet' : `${packages.length} package${packages.length !== 1 ? 's' : ''}`}
          </p>
        </div>
        <Link
          href="/dashboard/new"
          className="inline-flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold px-4 py-2.5 rounded-lg text-sm transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          New Package
        </Link>
      </div>

      <PackageList packages={serialized} />
    </div>
  )
}
