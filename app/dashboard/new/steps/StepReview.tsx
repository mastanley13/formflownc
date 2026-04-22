'use client'

import { useEffect, useState } from 'react'
import type { WizardData } from '../page'

type FormInfo = { id: string; formNumber: string; formName: string }

export default function StepReview({
  data, onSubmit, onBack, submitting, error,
}: {
  data: WizardData
  onSubmit: () => void
  onBack: () => void
  submitting: boolean
  error: string
}) {
  const [forms, setForms] = useState<FormInfo[]>([])

  useEffect(() => {
    fetch('/api/forms')
      .then((r) => r.json())
      .then((d) => {
        const selected = (d.forms as FormInfo[]).filter((f) => data.selectedForms.includes(f.id))
        setForms(selected)
      })
      .catch(() => { /* ignore */ })
  }, [data.selectedForms])

  const roleLabel = (role: string) =>
    ({ seller: 'Seller', buyer: 'Buyer', agent: 'Agent', co_agent: 'Co-Agent' })[role] ?? role

  const displayData = Object.entries(data.agentData)
    .filter(([k, v]) => v && !k.startsWith('agent_firm') && !k.startsWith('agent_'))
    .slice(0, 8)

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">Review & Generate Link</h2>
        <p className="text-sm text-slate-500 mt-1">Confirm everything looks right before sending to your client.</p>
      </div>

      {/* Property */}
      <ReviewSection title="Property">
        <p className="font-semibold text-slate-900">{data.propertyAddress}</p>
      </ReviewSection>

      {/* Forms */}
      <ReviewSection title={`Forms (${forms.length})`}>
        <div className="space-y-1.5">
          {forms.map((f) => (
            <div key={f.id} className="flex items-center gap-2">
              <span className="text-xs bg-teal-100 text-teal-700 px-2 py-0.5 rounded-full font-mono font-semibold">{f.formNumber}</span>
              <span className="text-sm text-slate-700">{f.formName}</span>
            </div>
          ))}
        </div>
      </ReviewSection>

      {/* Signers */}
      <ReviewSection title={`Signers (${data.signers.length})`}>
        <div className="space-y-2">
          {data.signers.map((s) => (
            <div key={s.id} className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center text-xs font-bold shrink-0">
                {s.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-medium text-slate-900">{s.name}</p>
                <p className="text-xs text-slate-500">{s.email} · {roleLabel(s.role)}</p>
              </div>
            </div>
          ))}
        </div>
      </ReviewSection>

      {/* Key deal terms */}
      {displayData.length > 0 && (
        <ReviewSection title="Key Deal Terms">
          <dl className="grid grid-cols-2 gap-x-6 gap-y-2">
            {displayData.map(([k, v]) => (
              <div key={k}>
                <dt className="text-xs text-slate-400 capitalize">{k.replace(/_/g, ' ')}</dt>
                <dd className="text-sm font-medium text-slate-800">{String(v)}</dd>
              </div>
            ))}
          </dl>
        </ReviewSection>
      )}

      <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800">
        <strong>What happens next:</strong> A unique 7-day link will be generated for your client. When they complete the intake form, all selected NC REALTOR PDFs will be auto-filled and routed to DocuSeal for e-signatures.
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">{error}</div>
      )}

      <div className="flex items-center justify-between pt-2">
        <button onClick={onBack} disabled={submitting} className="text-sm text-slate-500 hover:text-slate-700 font-medium px-4 py-2.5 rounded-xl hover:bg-slate-100 transition disabled:opacity-50">← Back</button>
        <button
          onClick={onSubmit}
          disabled={submitting}
          className="bg-teal-600 hover:bg-teal-700 disabled:opacity-60 text-white font-bold px-6 py-3 rounded-xl text-sm transition flex items-center gap-2"
        >
          {submitting ? (
            <>
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Generating…
            </>
          ) : (
            '🔗 Generate Client Link'
          )}
        </button>
      </div>
    </div>
  )
}

function ReviewSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border border-slate-200 rounded-xl p-4">
      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">{title}</p>
      {children}
    </div>
  )
}
