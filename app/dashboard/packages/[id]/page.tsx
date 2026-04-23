'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'

type Signer = {
  id: string
  name: string
  email: string
  phone: string | null
  role: string
  signedAt: string | null
  docusealSubmissionId: string | null
}

type FormInfo = {
  id: string
  formNumber: string
  formName: string
  category: string
}

type PackageDetail = {
  id: string
  propertyAddress: string
  status: string
  clientLinkToken: string
  clientLinkExpiresAt: string
  formsSelected: string
  agentData: string
  clientData: string
  createdAt: string
  signers: Signer[]
  agent: { id: string; name: string; email: string; firmName: string | null }
}

const STATUS_TIMELINE: Record<string, { label: string; color: string; dot: string }> = {
  draft:            { label: 'Draft',              color: 'text-slate-500', dot: 'bg-slate-300' },
  link_sent:        { label: 'Link Sent',           color: 'text-blue-600',  dot: 'bg-blue-400' },
  client_opened:    { label: 'Client Opened',       color: 'text-amber-600', dot: 'bg-amber-400' },
  client_completed: { label: 'Client Completed',    color: 'text-violet-600',dot: 'bg-violet-400' },
  signing:          { label: 'Awaiting Signatures', color: 'text-orange-600',dot: 'bg-orange-400' },
  completed:        { label: 'Completed',           color: 'text-emerald-600',dot: 'bg-emerald-500' },
  expired:          { label: 'Expired',             color: 'text-red-500',   dot: 'bg-red-400' },
}

const STATUS_ORDER = ['draft','link_sent','client_opened','client_completed','signing','completed']

const ROLE_LABEL: Record<string, string> = { seller: 'Seller', buyer: 'Buyer', agent: 'Agent', co_agent: 'Co-Agent' }

function fmt(d: string | null | undefined) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })
}

export default function PackageDetailPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const id = params.id

  const [pkg, setPkg] = useState<PackageDetail | null>(null)
  const [forms, setForms] = useState<FormInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [copyDone, setCopyDone] = useState(false)
  const [resending, setResending] = useState(false)
  const [downloading, setDownloading] = useState(false)

  useEffect(() => {
    fetch(`/api/packages/${id}`)
      .then((r) => r.json())
      .then((d: { package?: PackageDetail; forms?: FormInfo[]; error?: string }) => {
        if (!d.package) { setError(d.error ?? 'Package not found.'); return }
        setPkg(d.package)
        setForms(d.forms ?? [])
      })
      .catch(() => setError('Failed to load package.'))
      .finally(() => setLoading(false))
  }, [id])

  async function copyLink() {
    if (!pkg) return
    const url = `${window.location.origin}/intake/${pkg.clientLinkToken}`
    try {
      await navigator.clipboard.writeText(url)
    } catch {
      const el = document.createElement('textarea')
      el.value = url
      document.body.appendChild(el)
      el.select()
      document.execCommand('copy')
      document.body.removeChild(el)
    }
    setCopyDone(true)
    setTimeout(() => setCopyDone(false), 2500)
  }

  async function downloadZip() {
    setDownloading(true)
    try {
      const res = await fetch(`/api/packages/${id}/download`)
      if (!res.ok) {
        const d = await res.json() as { error?: string }
        alert(d.error ?? 'Download failed.')
        return
      }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `formflownc-package-${id.slice(0, 8)}.zip`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      alert('Download failed. Please try again.')
    } finally {
      setDownloading(false)
    }
  }

  const categoryLabel = (raw: string) => {
    try { const p = JSON.parse(raw); return Array.isArray(p) ? p.join(', ') : raw } catch { return raw }
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 animate-pulse space-y-4">
        <div className="h-8 bg-slate-100 rounded w-1/3" />
        <div className="h-48 bg-slate-100 rounded-2xl" />
        <div className="h-32 bg-slate-100 rounded-2xl" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl p-6 text-center">
          <p className="font-semibold">{error}</p>
          <Link href="/dashboard" className="mt-4 inline-block text-sm text-red-600 hover:underline">← Back to Dashboard</Link>
        </div>
      </div>
    )
  }

  if (!pkg) return null

  const statusConfig = STATUS_TIMELINE[pkg.status] ?? STATUS_TIMELINE.draft
  const currentStatusIndex = STATUS_ORDER.indexOf(pkg.status)
  const isActive = !['completed', 'expired'].includes(pkg.status)
  const isExpired = new Date() > new Date(pkg.clientLinkExpiresAt)
  const allSigned = pkg.signers.length > 0 && pkg.signers.every((s) => s.signedAt)

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
      {/* Back + header */}
      <div className="flex items-start gap-3 mb-6">
        <button onClick={() => router.back()} className="mt-1 text-slate-400 hover:text-slate-600 transition shrink-0">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 truncate">{pkg.propertyAddress}</h1>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span className={`inline-flex items-center gap-1.5 text-xs font-semibold ${statusConfig.color}`}>
              <span className={`w-2 h-2 rounded-full ${statusConfig.dot}`} />
              {statusConfig.label}
            </span>
            <span className="text-xs text-slate-400">Created {fmt(pkg.createdAt)}</span>
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex flex-wrap gap-3 mb-8">
        {['link_sent', 'client_opened'].includes(pkg.status) && !isExpired && (
          <button
            onClick={copyLink}
            className={`flex items-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-xl border transition ${
              copyDone ? 'bg-emerald-50 text-emerald-700 border-emerald-300' : 'bg-white text-teal-700 border-teal-200 hover:bg-teal-50'
            }`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            {copyDone ? 'Copied!' : 'Copy Client Link'}
          </button>
        )}
        <button
          onClick={downloadZip}
          disabled={downloading}
          className="flex items-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition disabled:opacity-50"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          {downloading ? 'Downloading…' : 'Download PDFs'}
        </button>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left: status + signers */}
        <div className="lg:col-span-2 space-y-6">
          {/* Status timeline */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5">
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-4">Status Timeline</h2>
            <div className="space-y-3">
              {STATUS_ORDER.filter((s) => s !== 'expired').map((s, i) => {
                const cfg = STATUS_TIMELINE[s]
                const past = i < currentStatusIndex
                const current = i === currentStatusIndex
                return (
                  <div key={s} className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full shrink-0 ${
                      current ? cfg.dot : past ? 'bg-teal-500' : 'bg-slate-200'
                    }`} />
                    <span className={`text-sm font-medium ${current ? cfg.color : past ? 'text-slate-600' : 'text-slate-300'}`}>
                      {cfg.label}
                    </span>
                    {current && <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full ml-auto">Current</span>}
                    {past && <span className="text-xs text-slate-400 ml-auto">✓</span>}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Signers */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5">
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-4">
              Signers ({pkg.signers.length})
            </h2>
            <div className="space-y-3">
              {pkg.signers.map((s) => (
                <div key={s.id} className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center text-sm font-bold shrink-0">
                    {s.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-900 truncate">{s.name}</p>
                    <p className="text-xs text-slate-400 truncate">{s.email} · {ROLE_LABEL[s.role] ?? s.role}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    {s.signedAt ? (
                      <span className="inline-flex items-center gap-1 text-xs text-emerald-700 font-semibold bg-emerald-50 px-2 py-1 rounded-full">
                        ✓ Signed
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400">Pending</span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {allSigned && (
              <div className="mt-4 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 text-sm text-emerald-800 font-medium">
                ✓ All signatures collected
              </div>
            )}
          </div>
        </div>

        {/* Right: package info */}
        <div className="space-y-6">
          {/* Client link */}
          {isActive && !isExpired && (
            <div className="bg-white border border-slate-200 rounded-2xl p-5">
              <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">Client Link</h2>
              <div className="bg-slate-50 rounded-xl p-3">
                <p className="text-xs font-mono text-slate-500 break-all leading-relaxed">
                  {typeof window !== 'undefined' ? window.location.origin : ''}/intake/{pkg.clientLinkToken}
                </p>
              </div>
              <p className="text-xs text-slate-400 mt-2">
                Expires {fmt(pkg.clientLinkExpiresAt)}
              </p>
            </div>
          )}

          {/* Forms */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5">
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">Forms ({forms.length})</h2>
            <div className="space-y-2">
              {forms.map((f) => (
                <div key={f.id} className="flex items-start gap-2">
                  <span className="text-xs bg-teal-100 text-teal-700 px-2 py-0.5 rounded-full font-mono font-semibold shrink-0 mt-0.5">
                    {f.formNumber}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm text-slate-700 leading-tight">{f.formName}</p>
                    <p className="text-xs text-slate-400">{categoryLabel(f.category)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Package ID */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5">
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">Package Info</h2>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between gap-2">
                <dt className="text-slate-400 shrink-0">ID</dt>
                <dd className="font-mono text-xs text-slate-600 truncate">{pkg.id.slice(0, 16)}…</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-slate-400 shrink-0">Agent</dt>
                <dd className="text-slate-700 text-right">{pkg.agent.name}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-slate-400 shrink-0">Firm</dt>
                <dd className="text-slate-700 text-right truncate">{pkg.agent.firmName ?? '—'}</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </div>
  )
}
