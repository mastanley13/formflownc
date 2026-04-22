'use client'

import { useState, useEffect, FormEvent } from 'react'
import type { WizardData } from '../page'

type FieldDef = { key: string; label: string; placeholder?: string; type?: string; hint?: string }

const LISTING_FIELDS: FieldDef[] = [
  { key: 'listing_price', label: 'Listing Price', placeholder: '$485,000', hint: 'Include $ sign' },
  { key: 'listing_commission_pct', label: 'Listing Commission (%)', placeholder: '3.0' },
  { key: 'selling_commission_pct', label: 'Selling Commission (%)', placeholder: '2.5' },
  { key: 'listing_begin_date', label: 'Listing Period Begin', type: 'date' },
  { key: 'listing_end_date', label: 'Listing Period End', type: 'date' },
]

const BUYER_FIELDS: FieldDef[] = [
  { key: 'purchase_price', label: 'Purchase Price', placeholder: '$465,000' },
  { key: 'earnest_money', label: 'Earnest Money Deposit', placeholder: '$5,000' },
  { key: 'due_diligence_fee', label: 'Due Diligence Fee', placeholder: '$1,000' },
  { key: 'closing_date', label: 'Closing Date', type: 'date' },
  { key: 'due_diligence_deadline', label: 'Due Diligence Deadline', type: 'date' },
]

const ALWAYS_FIELDS: FieldDef[] = [
  { key: 'property_county', label: 'County', placeholder: 'Craven' },
  { key: 'property_tax_parcel', label: 'Tax Parcel ID', placeholder: '0-00-00-000' },
]

export default function StepDetails({
  data, update, onNext, onBack,
}: { data: WizardData; update: (p: Partial<WizardData>) => void; onNext: () => void; onBack: () => void }) {
  const [agentInfo, setAgentInfo] = useState<Record<string, string>>({})
  const [fields, setFields] = useState<Record<string, string>>(data.agentData)
  const [loadingAgent, setLoadingAgent] = useState(true)
  const [agentError, setAgentError] = useState(false)

  // Determine which field sets to show based on selected forms
  const [formNumbers, setFormNumbers] = useState<string[]>([])

  useEffect(() => {
    // Fetch agent profile for pre-fill
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((d) => {
        if (d.agent) {
          setAgentInfo({
            agent_name: d.agent.name || '',
            agent_license_number: d.agent.licenseNumber || '',
            agent_phone: d.agent.phone || '',
            agent_email: d.agent.email || '',
            agent_firm_name: d.agent.firmName || '',
            agent_firm_license: d.agent.firmLicense || '',
            agent_firm_address: d.agent.firmAddress || '',
            agent_firm_phone: d.agent.firmPhone || '',
          })
        }
        setLoadingAgent(false)
      })
      .catch(() => { setLoadingAgent(false); setAgentError(true) })

    // Fetch selected form numbers
    if (data.selectedForms.length > 0) {
      fetch('/api/forms')
        .then((r) => r.json())
        .then((d: { forms: { id: string; formNumber: string }[] }) => {
          const nums = (d.forms || [])
            .filter((f) => data.selectedForms.includes(f.id))
            .map((f) => f.formNumber)
          setFormNumbers(nums)
        })
        .catch(() => { /* form numbers are optional — falls back to showing all field sections */ })
    }
  }, [data.selectedForms])

  const hasListing = formNumbers.some((n) => ['101', '110', '140', '141'].includes(n))
  const hasBuyer = formNumbers.some((n) => ['161', '2-T'].includes(n))

  function setField(key: string, value: string) {
    setFields((prev) => ({ ...prev, [key]: value }))
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    // Merge agent info (pre-filled) with manually entered fields
    update({ agentData: { ...agentInfo, ...fields, property_address: data.propertyAddress } })
    onNext()
  }

  const renderField = (f: FieldDef) => (
    <div key={f.key}>
      <label className="block text-sm font-medium text-slate-700 mb-1.5" htmlFor={f.key}>
        {f.label}
      </label>
      <input
        id={f.key}
        type={f.type || 'text'}
        placeholder={f.placeholder}
        value={fields[f.key] ?? ''}
        onChange={(e) => setField(f.key, e.target.value)}
        className="w-full border border-slate-300 rounded-xl px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition"
      />
      {f.hint && <p className="text-xs text-slate-400 mt-1">{f.hint}</p>}
    </div>
  )

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">Deal Details</h2>
        <p className="text-sm text-slate-500 mt-1">Enter the deal terms. Your agent info is pre-filled from your profile.</p>
      </div>

      {/* Agent info (pre-filled, read-only) */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Agent Info (pre-filled)</p>
        {loadingAgent ? (
          <p className="text-sm text-slate-400">Loading profile…</p>
        ) : agentError ? (
          <p className="text-sm text-red-500">Could not load agent profile. Fields will not be pre-filled.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-2 text-sm">
            {Object.entries(agentInfo).filter(([, v]) => v).map(([k, v]) => (
              <div key={k} className="truncate">
                <span className="text-slate-400 text-xs capitalize">{k.replace(/_/g, ' ')}</span>
                <p className="text-slate-700 font-medium truncate">{v}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Property extras */}
      <div>
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Property</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {ALWAYS_FIELDS.map(renderField)}
        </div>
      </div>

      {/* Listing terms */}
      {hasListing && (
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Listing Terms</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {LISTING_FIELDS.map(renderField)}
          </div>
        </div>
      )}

      {/* Buyer / Offer terms */}
      {hasBuyer && (
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Offer Terms</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {BUYER_FIELDS.map(renderField)}
          </div>
        </div>
      )}

      <div className="bg-teal-50 border border-teal-200 rounded-xl px-4 py-3 text-xs text-teal-700">
        Fields left blank here can still be completed in DocuSeal before sending for signatures.
      </div>

      <div className="flex items-center justify-between pt-2">
        <button type="button" onClick={onBack} className="text-sm text-slate-500 hover:text-slate-700 font-medium px-4 py-2.5 rounded-xl hover:bg-slate-100 transition">← Back</button>
        <button type="submit" className="bg-teal-600 hover:bg-teal-700 text-white font-semibold px-6 py-2.5 rounded-xl text-sm transition">Continue →</button>
      </div>
    </form>
  )
}
