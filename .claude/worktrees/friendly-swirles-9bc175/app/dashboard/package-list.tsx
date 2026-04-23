'use client'

import { useState } from 'react'
import Link from 'next/link'

type PackageSummary = {
  id: string
  propertyAddress: string
  status: string
  clientLinkToken: string
  clientLinkExpiresAt: string
  createdAt: string
  signers: { name: string; role: string }[]
}

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  draft: { label: 'Draft', className: 'bg-slate-100 text-slate-600 border-slate-200' },
  link_sent: { label: 'Link Sent', className: 'bg-blue-50 text-blue-700 border-blue-200' },
  client_opened: { label: 'Client Opened', className: 'bg-amber-50 text-amber-700 border-amber-200' },
  client_completed: { label: 'Client Completed', className: 'bg-teal-50 text-teal-700 border-teal-200' },
  signatures_pending: { label: 'Signatures Pending', className: 'bg-orange-50 text-orange-700 border-orange-200' },
  completed: { label: 'Completed', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  expired: { label: 'Expired', className: 'bg-red-50 text-red-700 border-red-200' },
}

function StatusBadge({ status }: { status: string }) {
  const config = STATUS_CONFIG[status] ?? { label: status, className: 'bg-slate-100 text-slate-600 border-slate-200' }
  return (
    <span className={`inline-flex text-xs font-semibold px-2 py-0.5 rounded-full border ${config.className}`}>
      {config.label}
    </span>
  )
}

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false)

  function copy() {
    navigator.clipboard.writeText(value)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      onClick={copy}
      className="inline-flex items-center gap-1 text-xs text-teal-600 hover:text-teal-700 font-medium"
    >
      {copied ? (
        <>
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          Copied
        </>
      ) : (
        <>
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          Copy link
        </>
      )}
    </button>
  )
}

export default function PackageList({ packages }: { packages: PackageSummary[] }) {
  const [search, setSearch] = useState('')

  const appUrl = typeof window !== 'undefined' ? window.location.origin : ''

  const filtered = packages.filter(pkg => {
    const q = search.toLowerCase()
    const clientNames = pkg.signers.map(s => s.name.toLowerCase()).join(' ')
    return (
      pkg.propertyAddress.toLowerCase().includes(q) ||
      clientNames.includes(q)
    )
  })

  if (packages.length === 0) {
    return (
      <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
        <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-6 h-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <p className="text-slate-900 font-semibold">No packages yet</p>
        <p className="text-slate-500 text-sm mt-1">Create your first client package to get started.</p>
        <Link
          href="/dashboard/new"
          className="inline-flex items-center gap-2 mt-5 bg-teal-600 hover:bg-teal-700 text-white font-semibold px-4 py-2.5 rounded-lg text-sm transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          New Package
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="relative">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="search"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by address or client name…"
          className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-slate-300 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm bg-white"
        />
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-10 text-slate-500 text-sm">No packages match your search.</div>
      )}

      <div className="space-y-2">
        {filtered.map(pkg => {
          const clientLink = `${appUrl}/intake/${pkg.clientLinkToken}`
          const primarySigner = pkg.signers.find(s => s.role === 'seller' || s.role === 'buyer')
          const date = new Date(pkg.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

          return (
            <div key={pkg.id} className="bg-white border border-slate-200 rounded-xl px-5 py-4">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-slate-900 text-sm truncate">{pkg.propertyAddress}</p>
                    <StatusBadge status={pkg.status} />
                  </div>
                  {primarySigner && (
                    <p className="text-slate-500 text-xs mt-0.5">
                      {primarySigner.name} · {primarySigner.role}
                    </p>
                  )}
                  <p className="text-slate-400 text-xs mt-1">{date}</p>
                </div>
                <div className="flex-shrink-0">
                  <CopyButton value={clientLink} />
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
