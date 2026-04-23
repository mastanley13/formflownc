import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/db'
import Link from 'next/link'
import { redirect } from 'next/navigation'

const STATUS_LABELS: Record<string, string> = {
  draft: 'Draft',
  link_sent: 'Link Sent',
  client_opened: 'Client Opened',
  client_completed: 'Client Completed',
  signatures_pending: 'Signatures Pending',
  completed: 'Completed',
  expired: 'Expired',
}

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-slate-100 text-slate-700',
  link_sent: 'bg-blue-100 text-blue-700',
  client_opened: 'bg-indigo-100 text-indigo-700',
  client_completed: 'bg-amber-100 text-amber-700',
  signatures_pending: 'bg-orange-100 text-orange-700',
  completed: 'bg-green-100 text-green-700',
  expired: 'bg-red-100 text-red-700',
}

export default async function DashboardPage() {
  const session = await getSession()
  if (!session) redirect('/login')

  const packages = await prisma.package.findMany({
    where: { agentId: session.agentId },
    include: {
      signers: { select: { id: true, name: true, role: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Packages</h1>
          <p className="text-slate-500 text-sm mt-1">
            {packages.length} package{packages.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Link
          href="/dashboard/new"
          className="bg-teal-600 hover:bg-teal-700 text-white font-semibold px-4 py-2 rounded-lg transition-colors text-sm"
        >
          + New Package
        </Link>
      </div>

      {packages.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
          <p className="text-slate-400 text-lg mb-4">No packages yet</p>
          <Link
            href="/dashboard/new"
            className="bg-teal-600 hover:bg-teal-700 text-white font-semibold px-6 py-2.5 rounded-lg transition-colors inline-block"
          >
            Create Your First Package
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {packages.map((pkg) => (
            <div
              key={pkg.id}
              className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 hover:border-teal-300 transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold text-slate-900 truncate">{pkg.propertyAddress}</p>
                  <p className="text-slate-500 text-sm mt-1">
                    {new Date(pkg.createdAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                    {pkg.signers.length > 0 &&
                      ` · ${pkg.signers.length} signer${pkg.signers.length !== 1 ? 's' : ''}`}
                  </p>
                </div>
                <span
                  className={`shrink-0 px-2.5 py-1 rounded-full text-xs font-medium ${
                    STATUS_COLORS[pkg.status] ?? 'bg-slate-100 text-slate-700'
                  }`}
                >
                  {STATUS_LABELS[pkg.status] ?? pkg.status}
                </span>
              </div>
              {pkg.signers.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {pkg.signers.map((s) => (
                    <span
                      key={s.id}
                      className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full capitalize"
                    >
                      {s.name} · {s.role.replace('_', ' ')}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
