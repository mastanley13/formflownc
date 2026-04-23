'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

type FormTemplate = {
  id: string
  formNumber: string
  formName: string
  categories: string[]
}

type Signer = {
  name: string
  email: string
  phone: string
  role: string
}

type AgentData = Record<string, string>

const FORM_CATEGORIES = ['Seller', 'Buyer', 'Agency', 'Misc']

const AGENT_FIELDS: { key: string; label: string; type: string; placeholder: string }[] = [
  { key: 'listing_price', label: 'Listing Price', type: 'text', placeholder: '$350,000' },
  { key: 'listing_commission_pct', label: 'Listing Commission %', type: 'text', placeholder: '3' },
  { key: 'selling_commission_pct', label: 'Selling Commission %', type: 'text', placeholder: '3' },
  { key: 'listing_begin_date', label: 'Listing Begin Date', type: 'date', placeholder: '' },
  { key: 'listing_end_date', label: 'Listing End Date', type: 'date', placeholder: '' },
  { key: 'closing_date', label: 'Target Closing Date', type: 'date', placeholder: '' },
  { key: 'earnest_money', label: 'Earnest Money Deposit', type: 'text', placeholder: '$5,000' },
  { key: 'due_diligence_fee', label: 'Due Diligence Fee', type: 'text', placeholder: '$1,000' },
]

function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-2 mb-8">
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} className="flex items-center gap-2">
          <div
            className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
              i < current
                ? 'bg-teal-600 text-white'
                : i === current
                ? 'bg-teal-600 text-white ring-4 ring-teal-100'
                : 'bg-slate-200 text-slate-500'
            }`}
          >
            {i < current ? (
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              i + 1
            )}
          </div>
          {i < total - 1 && (
            <div className={`h-0.5 w-6 transition-colors ${i < current ? 'bg-teal-600' : 'bg-slate-200'}`} />
          )}
        </div>
      ))}
    </div>
  )
}

// Step 1: Property Address
function Step1({
  value,
  onChange,
}: {
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div>
      <h2 className="text-lg font-bold text-slate-900 mb-1">Property Address</h2>
      <p className="text-slate-500 text-sm mb-6">Enter the full street address of the property.</p>
      <label className="block text-sm font-medium text-slate-700 mb-1.5">Street Address</label>
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full px-3 py-2.5 rounded-lg border border-slate-300 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
        placeholder="123 Main St, New Bern, NC 28560"
        required
      />
    </div>
  )
}

// Step 2: Form Selection
function Step2({
  templates,
  selected,
  onToggle,
}: {
  templates: FormTemplate[]
  selected: string[]
  onToggle: (id: string) => void
}) {
  const [activeTab, setActiveTab] = useState('Seller')

  const tabForms = templates.filter(t => t.categories.includes(activeTab))
  const allTabForms = templates.filter(t => !FORM_CATEGORIES.some(cat => t.categories.includes(cat)))

  return (
    <div>
      <h2 className="text-lg font-bold text-slate-900 mb-1">Select Forms</h2>
      <p className="text-slate-500 text-sm mb-4">Choose the NC REALTOR forms for this transaction.</p>

      <div className="flex gap-1 mb-4 bg-slate-100 rounded-lg p-1 flex-wrap">
        {FORM_CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveTab(cat)}
            className={`flex-1 px-3 py-1.5 text-xs font-semibold rounded-md transition-colors min-w-[60px] ${
              activeTab === cat
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {(activeTab === 'Misc' ? allTabForms : tabForms).map(t => (
          <label
            key={t.id}
            className={`flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer transition-colors ${
              selected.includes(t.id)
                ? 'border-teal-400 bg-teal-50'
                : 'border-slate-200 bg-white hover:border-slate-300'
            }`}
          >
            <input
              type="checkbox"
              checked={selected.includes(t.id)}
              onChange={() => onToggle(t.id)}
              className="w-4 h-4 text-teal-600 rounded border-slate-300 focus:ring-teal-500"
            />
            <div>
              <p className="text-sm font-semibold text-slate-800">Form {t.formNumber}</p>
              <p className="text-xs text-slate-500">{t.formName}</p>
            </div>
          </label>
        ))}
        {(activeTab === 'Misc' ? allTabForms : tabForms).length === 0 && (
          <p className="text-slate-400 text-sm text-center py-6">No {activeTab} forms available.</p>
        )}
      </div>

      {selected.length > 0 && (
        <p className="text-xs text-teal-600 font-medium mt-3">{selected.length} form{selected.length !== 1 ? 's' : ''} selected</p>
      )}
    </div>
  )
}

// Step 3: Signer Info
function Step3({
  signers,
  onChange,
}: {
  signers: Signer[]
  onChange: (s: Signer[]) => void
}) {
  function update(i: number, field: keyof Signer, value: string) {
    const next = [...signers]
    next[i] = { ...next[i], [field]: value }
    onChange(next)
  }

  function add() {
    onChange([...signers, { name: '', email: '', phone: '', role: 'seller' }])
  }

  function remove(i: number) {
    onChange(signers.filter((_, idx) => idx !== i))
  }

  return (
    <div>
      <h2 className="text-lg font-bold text-slate-900 mb-1">Client Information</h2>
      <p className="text-slate-500 text-sm mb-6">Add all parties who will receive and sign the documents.</p>

      <div className="space-y-4">
        {signers.map((signer, i) => (
          <div key={i} className="bg-slate-50 rounded-xl border border-slate-200 p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold text-slate-700">Signer {i + 1}</span>
              {signers.length > 1 && (
                <button onClick={() => remove(i)} className="text-red-400 hover:text-red-600 text-xs">
                  Remove
                </button>
              )}
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-slate-600 mb-1">Full Name</label>
                <input
                  type="text"
                  value={signer.name}
                  onChange={e => update(i, 'name', e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  placeholder="Jane Smith"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Email</label>
                <input
                  type="email"
                  value={signer.email}
                  onChange={e => update(i, 'email', e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  placeholder="jane@example.com"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Phone</label>
                <input
                  type="tel"
                  value={signer.phone}
                  onChange={e => update(i, 'phone', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  placeholder="(252) 555-0100"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Role</label>
                <select
                  value={signer.role}
                  onChange={e => update(i, 'role', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                >
                  <option value="seller">Seller</option>
                  <option value="buyer">Buyer</option>
                  <option value="co_seller">Co-Seller</option>
                  <option value="co_buyer">Co-Buyer</option>
                </select>
              </div>
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={add}
        className="mt-4 inline-flex items-center gap-2 text-sm text-teal-600 hover:text-teal-700 font-medium"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </svg>
        Add another signer
      </button>
    </div>
  )
}

// Step 4: Agent Questionnaire
function Step4({
  agentData,
  onChange,
}: {
  agentData: AgentData
  onChange: (d: AgentData) => void
}) {
  function set(key: string, value: string) {
    onChange({ ...agentData, [key]: value })
  }

  return (
    <div>
      <h2 className="text-lg font-bold text-slate-900 mb-1">Deal Details</h2>
      <p className="text-slate-500 text-sm mb-6">
        Fill in the agent-side fields. Shared values will carry across all selected forms automatically.
      </p>

      <div className="space-y-4">
        {AGENT_FIELDS.map(f => (
          <div key={f.key}>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">{f.label}</label>
            <input
              type={f.type}
              value={agentData[f.key] ?? ''}
              onChange={e => set(f.key, e.target.value)}
              placeholder={f.placeholder}
              className="w-full px-3 py-2.5 rounded-lg border border-slate-300 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
            />
          </div>
        ))}
      </div>
    </div>
  )
}

// Step 5: Review
function Step5({
  propertyAddress,
  selectedForms,
  signers,
  agentData,
  templates,
}: {
  propertyAddress: string
  selectedForms: string[]
  signers: Signer[]
  agentData: AgentData
  templates: FormTemplate[]
}) {
  const selectedTemplates = templates.filter(t => selectedForms.includes(t.id))
  const filledFields = AGENT_FIELDS.filter(f => agentData[f.key])

  return (
    <div>
      <h2 className="text-lg font-bold text-slate-900 mb-1">Review Package</h2>
      <p className="text-slate-500 text-sm mb-6">Confirm all details before generating the client link.</p>

      <div className="space-y-4">
        <div className="bg-slate-50 rounded-xl border border-slate-200 p-4">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Property</p>
          <p className="text-sm font-semibold text-slate-900">{propertyAddress}</p>
        </div>

        <div className="bg-slate-50 rounded-xl border border-slate-200 p-4">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
            Forms ({selectedTemplates.length})
          </p>
          <div className="space-y-1">
            {selectedTemplates.map(t => (
              <p key={t.id} className="text-sm text-slate-700">
                Form {t.formNumber} — {t.formName}
              </p>
            ))}
          </div>
        </div>

        <div className="bg-slate-50 rounded-xl border border-slate-200 p-4">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
            Signers ({signers.length})
          </p>
          <div className="space-y-1">
            {signers.map((s, i) => (
              <p key={i} className="text-sm text-slate-700">
                {s.name} ({s.role}) — {s.email}
              </p>
            ))}
          </div>
        </div>

        {filledFields.length > 0 && (
          <div className="bg-slate-50 rounded-xl border border-slate-200 p-4">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Deal Details</p>
            <div className="space-y-1">
              {filledFields.map(f => (
                <div key={f.key} className="flex justify-between text-sm">
                  <span className="text-slate-500">{f.label}</span>
                  <span className="text-slate-900 font-medium">{agentData[f.key]}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// Step 6: Success
function Step6({
  propertyAddress,
  clientLinkToken,
}: {
  propertyAddress: string
  clientLinkToken: string
}) {
  const [copied, setCopied] = useState(false)
  const link = typeof window !== 'undefined'
    ? `${window.location.origin}/intake/${clientLinkToken}`
    : `/intake/${clientLinkToken}`

  function copy() {
    navigator.clipboard.writeText(link)
    setCopied(true)
    setTimeout(() => setCopied(false), 3000)
  }

  return (
    <div className="text-center">
      <div className="w-14 h-14 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <svg className="w-7 h-7 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <h2 className="text-xl font-bold text-slate-900 mb-1">Package Created!</h2>
      <p className="text-slate-500 text-sm mb-8">
        Share this link with your client for <span className="font-medium text-slate-700">{propertyAddress}</span>.
        It expires in 7 days.
      </p>

      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-4 text-left">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Client Intake Link</p>
        <p className="text-sm text-slate-800 font-mono break-all">{link}</p>
      </div>

      <div className="flex gap-3 flex-col sm:flex-row">
        <button
          onClick={copy}
          className="flex-1 inline-flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold px-4 py-2.5 rounded-lg text-sm transition-colors"
        >
          {copied ? (
            <>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              Copied!
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Copy Link
            </>
          )}
        </button>
        <Link
          href="/dashboard"
          className="flex-1 inline-flex items-center justify-center gap-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 font-semibold px-4 py-2.5 rounded-lg text-sm transition-colors"
        >
          Back to Dashboard
        </Link>
      </div>
    </div>
  )
}

const STEP_COUNT = 6

export default function NewPackageWizard({ formTemplates }: { formTemplates: FormTemplate[] }) {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [propertyAddress, setPropertyAddress] = useState('')
  const [selectedForms, setSelectedForms] = useState<string[]>([])
  const [signers, setSigners] = useState<Signer[]>([{ name: '', email: '', phone: '', role: 'seller' }])
  const [agentData, setAgentData] = useState<AgentData>({})
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [clientLinkToken, setClientLinkToken] = useState('')

  function toggleForm(id: string) {
    setSelectedForms(prev =>
      prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]
    )
  }

  function canAdvance(): boolean {
    if (step === 0) return propertyAddress.trim().length > 0
    if (step === 1) return selectedForms.length > 0
    if (step === 2) return signers.every(s => s.name.trim() && s.email.trim())
    return true
  }

  async function handleNext() {
    if (step === 4) {
      await submit()
      return
    }
    setStep(s => s + 1)
  }

  async function submit() {
    setSubmitting(true)
    setError('')
    try {
      const res = await fetch('/api/packages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          propertyAddress,
          formsSelected: selectedForms,
          signers,
          agentData,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Failed to create package')
        return
      }
      setClientLinkToken(data.clientLinkToken)
      setStep(5)
    } catch {
      setError('Network error — please try again')
    } finally {
      setSubmitting(false)
    }
  }

  const stepLabels = ['Address', 'Forms', 'Clients', 'Details', 'Review', 'Done']

  return (
    <div className="max-w-lg mx-auto">
      <div className="flex items-center gap-3 mb-6">
        {step < 5 && (
          <Link href="/dashboard" className="text-slate-400 hover:text-slate-600 transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
        )}
        <div>
          <h1 className="text-lg font-bold text-slate-900">New Package</h1>
          <p className="text-slate-500 text-xs">{stepLabels[step]} · Step {step + 1} of {STEP_COUNT}</p>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <StepIndicator current={step} total={STEP_COUNT} />

        {step === 0 && <Step1 value={propertyAddress} onChange={setPropertyAddress} />}
        {step === 1 && (
          <Step2 templates={formTemplates} selected={selectedForms} onToggle={toggleForm} />
        )}
        {step === 2 && <Step3 signers={signers} onChange={setSigners} />}
        {step === 3 && <Step4 agentData={agentData} onChange={setAgentData} />}
        {step === 4 && (
          <Step5
            propertyAddress={propertyAddress}
            selectedForms={selectedForms}
            signers={signers}
            agentData={agentData}
            templates={formTemplates}
          />
        )}
        {step === 5 && (
          <Step6 propertyAddress={propertyAddress} clientLinkToken={clientLinkToken} />
        )}

        {error && (
          <div className="mt-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
            {error}
          </div>
        )}

        {step < 5 && (
          <div className="flex justify-between mt-8 pt-6 border-t border-slate-100">
            {step > 0 ? (
              <button
                onClick={() => setStep(s => s - 1)}
                className="text-sm text-slate-500 hover:text-slate-700 font-medium transition-colors"
              >
                ← Back
              </button>
            ) : (
              <div />
            )}

            <button
              onClick={handleNext}
              disabled={!canAdvance() || submitting}
              className="inline-flex items-center gap-2 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold px-5 py-2.5 rounded-lg text-sm transition-colors"
            >
              {submitting
                ? 'Creating…'
                : step === 4
                ? 'Generate Client Link'
                : 'Continue →'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
