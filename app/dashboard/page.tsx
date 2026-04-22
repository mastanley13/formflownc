import { getSession } from '@/lib/auth'
import prisma from '@/lib/db'
import Link from 'next/link'

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  draft:            { label: 'Draft',              color: 'bg-slate-100 text-slate-600 border-slate-200' },
  link_sent:        { label: 'Link Sent',           color: 'bg-blue-50 text-blue-700 border-blue-200' },
  client_opened:    { label: 'Client Opened',       color: 'bg-amber-50 text-amber-700 border-amber-200' },
  client_completed: { label: 'Client Completed',    color: 'bg-violet-50 text-violet-700 border-violet-200' },
  signing:          { label: 'Signatures Pending',  color: 'bg-orange-50 text-orange-700 border-orange-200' },
  completed:        { label: 'Completed',           color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  expired:          { label: 'Expired',             color: 'bg-red-50 text-red-600 border-red-200' },
}

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? { label: status, color: 'bg-slate-100 text-slate-600 border-slate-200' }
  return (
    <span className={`inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full border ${cfg.color}`}>
      {cfg.label}
    </span>
  )
}

function formatDate(d: Date | string) {
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default async function DashboardPage() {
  const session = await getSession()

  const packages = await prisma.package.findMany({
    where: { agentId: session!.agentId },
    include: { signers: { take: 2 } },
    orderBy: { createdAt: 'desc' },
  })

  const stats = {
    total: packages.length,
    active: packages.filter((p) => !['completed', 'expired', 'draft'].includes(p.status)).length,
    completed: packages.filter((p) => p.status === 'completed').length,
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Packages</h1>
          <p className="text-sm text-slate-500 mt-0.5">Transaction document packages</p>
        </div>
        <Link
          href="/dashboard/new"
          className="inline-flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
          </svg>
          New Package
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total', value: stats.total, color: 'text-slate-900' },
          { label: 'Active', value: stats.active, color: 'text-blue-700' },
          { label: 'Completed', value: stats.completed, color: 'text-emerald-700' },
        ].map((s) => (
          <div key={s.label} className="bg-white border border-slate-200 rounded-xl p-4 text-center shadow-sm">
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Package list */}
      {packages.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-16 text-center shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <p className="font-semibold text-slate-700">No packages yet</p>
          <p className="text-sm text-slate-400 mt-1">Create your first package to get started.</p>
          <Link href="/dashboard/new" className="inline-block mt-5 bg-teal-600 text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-teal-700 transition">
            Create Package
          </Link>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="divide-y divide-slate-100">
            {packages.map((pkg) => {
              const signerNames = pkg.signers.map((s) => s.name).join(', ')
              const isExpired = new Date() > new Date(pkg.clientLinkExpiresAt)
              const displayStatus = isExpired && !['completed'].includes(pkg.status) ? 'expired' : pkg.status

              return (
                <div key={pkg.id} className="flex items-start gap-4 px-6 py-4 hover:bg-slate-50 transition group">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap">
                      <p className="font-semibold text-slate-900 truncate">{pkg.propertyAddress}</p>
                      <StatusBadge status={displayStatus} />
                    </div>
                    {signerNames && (
                      <p className="text-sm text-slate-500 mt-0.5 truncate">{signerNames}</p>
                    )}
                    <p className="text-xs text-slate-400 mt-1">Created {formatDate(pkg.createdAt)}</p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 opacity-0 group-hover:opacity-100 transition">
                    {pkg.status === 'link_sent' || pkg.status === 'draft' ? (
                      <button
                        onClick={async () => {
                          await navigator.clipboard.writeText(
                            `${window.location.origin}/intake/${pkg.clientLinkToken}`
                          )
                        }}
                        className="text-xs text-teal-600 hover:text-teal-700 font-medium px-3 py-1.5 rounded-lg border border-teal-200 hover:bg-teal-50 transition"
                        title="Copy client link"
                      >
                        Copy Link
                      </button>
                    ) : null}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
