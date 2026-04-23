'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type FormTemplate = {
  id: string
  formNumber: string
  formName: string
  category: string
}

type Signer = {
  name: string
  email: string
  phone: string
  role: 'seller' | 'buyer' | 'agent' | 'co_agent'
}

type AgentProfile = {
  name: string | null
  email: string | null
  phone: string | null
  firmName: string | null
  licenseNumber: string | null
  firmAddress: string | null
  firmPhone: string | null
  firmLicense: string | null
} | null

type Props = {
  forms: FormTemplate[]
  agentProfile: AgentProfile
}

const CATEGORIES = ['Seller', 'Buyer', 'Agency', 'Misc'] as const

const DEAL_FIELDS = [
  { key: 'listing_price', label: 'Listing Price', type: 'text', placeholder: '$450,000' },
  { key: 'listing_begin_date', label: 'Listing Start Date', type: 'date', placeholder: '' },
  { key: 'listing_end_date', label: 'Listing End Date', type: 'date', placeholder: '' },
  { key: 'listing_commission_pct', label: 'Listing Commission %', type: 'text', placeholder: '3.0' },
  { key: 'selling_commission_pct', label: 'Co-Op Commission %', type: 'text', placeholder: '2.5' },
  { key: 'purchase_price', label: 'Purchase Price', type: 'text', placeholder: '$450,000' },
  { key: 'earnest_money', label: 'Earnest Money', type: 'text', placeholder: '$1,000' },
  { key: 'due_diligence_fee', label: 'Due Diligence Fee', type: 'text', placeholder: '$500' },
  { key: 'due_diligence_deadline', label: 'Due Diligence Deadline', type: 'date', placeholder: '' },
  { key: 'closing_date', label: 'Target Closing Date', type: 'date', placeholder: '' },
] as const

const DISCLOSURE_FIELDS = [
  { key: 'disc_hoa_exists', label: 'HOA Exists' },
  { key: 'disc_lead_paint', label: 'Lead Paint Disclosure Required' },
  { key: 'disc_flood_zone', label: 'In Flood Zone' },
  { key: 'disc_septic', label: 'Has Septic System' },
  { key: 'disc_well', label: 'Has Private Well' },
  { key: 'disc_mineral_rights', label: 'Mineral Rights Conveying' },
  { key: 'disc_renovations', label: 'Unpermitted Renovations' },
] as const

function parseCategories(raw: string): string[] {
  try {
    return JSON.parse(raw) as string[]
  } catch {
    return [raw]
  }
}

export default function NewPackageWizard({ forms, agentProfile }: Props) {
  const router = useRouter()
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5 | 6>(1)
  const [propertyAddress, setPropertyAddress] = useState('')
  const [selectedForms, setSelectedForms] = useState<string[]>([])
  const [activeTab, setActiveTab] = useState<string>('Seller')
  const [signers, setSigners] = useState<Signer[]>([
    { name: '', email: '', phone: '', role: 'seller' },
  ])
  const [agentData, setAgentData] = useState<Record<string, string | boolean>>(() => {
    const init: Record<string, string | boolean> = {}
    if (agentProfile) {
      if (agentProfile.name) init['agent_name'] = agentProfile.name
      if (agentProfile.email) init['agent_email'] = agentProfile.email
      if (agentProfile.phone) init['agent_phone'] = agentProfile.phone
      if (agentProfile.licenseNumber) init['agent_license_number'] = agentProfile.licenseNumber
      if (agentProfile.firmName) init['agent_firm_name'] = agentProfile.firmName
      if (agentProfile.firmAddress) init['agent_firm_address'] = agentProfile.firmAddress
      if (agentProfile.firmPhone) init['agent_firm_phone'] = agentProfile.firmPhone
      if (agentProfile.firmLicense) init['agent_firm_license'] = agentProfile.firmLicense
    }
    return init
  })
  const [clientLink, setClientLink] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const formsInTab = (tab: string) =>
    forms.filter((f) => parseCategories(f.category).includes(tab))

  const toggleForm = (id: string) =>
    setSelectedForms((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )

  const addSigner = () =>
    setSigners((prev) => [...prev, { name: '', email: '', phone: '', role: 'seller' }])

  const removeSigner = (i: number) =>
    setSigners((prev) => prev.filter((_, idx) => idx !== i))

  const updateSigner = (i: number, field: keyof Signer, value: string) =>
    setSigners((prev) => {
      const next = [...prev]
      next[i] = { ...next[i], [field]: value }
      return next
    })

  const setField = (key: string, value: string | boolean) =>
    setAgentData((prev) => ({ ...prev, [key]: value }))

  const validSigners = signers.filter((s) => s.name && s.email)

  async function generatePackage() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/packages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          propertyAddress,
          formsSelected: selectedForms,
          signers: validSigners,
          agentData,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Failed to create package')
        return
      }
      const base = typeof window !== 'undefined' ? window.location.origin : ''
      setClientLink(`${base}/intake/${data.package.clientLinkToken}`)
      setStep(6)
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  /* ── Step 1: Property Address ── */
  if (step === 1) {
    return (
      <Card title="Step 1 of 5 — Property Address" onBack={() => router.push('/dashboard')}>
        <p className="text-slate-500 text-sm mb-4">
          Enter the full property address for this listing package.
        </p>
        <input
          type="text"
          value={propertyAddress}
          onChange={(e) => setPropertyAddress(e.target.value)}
          placeholder="123 Oak Street, New Bern, NC 28560"
          className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-base"
          autoFocus
        />
        <NavRow>
          <div />
          <NextBtn onClick={() => setStep(2)} disabled={!propertyAddress.trim()} />
        </NavRow>
      </Card>
    )
  }

  /* ── Step 2: Select Forms ── */
  if (step === 2) {
    return (
      <Card title="Step 2 of 5 — Select Forms" onBack={() => setStep(1)}>
        <p className="text-slate-500 text-sm mb-4">
          Choose the forms to include. Selected: {selectedForms.length}
        </p>
        <div className="flex gap-1 mb-4 bg-slate-100 p-1 rounded-lg">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveTab(cat)}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === cat
                  ? 'bg-white text-teal-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
        <div className="space-y-2 min-h-[120px]">
          {formsInTab(activeTab).length === 0 ? (
            <p className="text-slate-400 text-sm text-center py-8">
              No {activeTab} forms available
            </p>
          ) : (
            formsInTab(activeTab).map((form) => (
              <label
                key={form.id}
                className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 cursor-pointer hover:border-teal-300 transition-colors"
              >
                <input
                  type="checkbox"
                  checked={selectedForms.includes(form.id)}
                  onChange={() => toggleForm(form.id)}
                  className="w-4 h-4 accent-teal-600 shrink-0"
                />
                <div>
                  <span className="font-medium text-slate-900 text-sm">
                    Form {form.formNumber}
                  </span>
                  <span className="text-slate-500 ml-2 text-sm">{form.formName}</span>
                </div>
              </label>
            ))
          )}
        </div>
        <NavRow>
          <BackBtn onClick={() => setStep(1)} />
          <NextBtn onClick={() => setStep(3)} disabled={selectedForms.length === 0} />
        </NavRow>
      </Card>
    )
  }

  /* ── Step 3: Signers ── */
  if (step === 3) {
    return (
      <Card title="Step 3 of 5 — Client Signers" onBack={() => setStep(2)}>
        <p className="text-slate-500 text-sm mb-4">
          Add everyone who will sign these forms.
        </p>
        <div className="space-y-4">
          {signers.map((signer, i) => (
            <div key={i} className="border border-slate-200 rounded-xl p-4 relative">
              {signers.length > 1 && (
                <button
                  onClick={() => removeSigner(i)}
                  className="absolute top-3 right-3 text-slate-400 hover:text-red-500 text-xs font-medium"
                >
                  Remove
                </button>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="Full Name *">
                  <input
                    type="text"
                    value={signer.name}
                    onChange={(e) => updateSigner(i, 'name', e.target.value)}
                    placeholder="Jane Smith"
                    className={inputCls}
                  />
                </Field>
                <Field label="Email *">
                  <input
                    type="email"
                    value={signer.email}
                    onChange={(e) => updateSigner(i, 'email', e.target.value)}
                    placeholder="jane@example.com"
                    className={inputCls}
                  />
                </Field>
                <Field label="Phone">
                  <input
                    type="tel"
                    value={signer.phone}
                    onChange={(e) => updateSigner(i, 'phone', e.target.value)}
                    placeholder="(555) 000-0000"
                    className={inputCls}
                  />
                </Field>
                <Field label="Role">
                  <select
                    value={signer.role}
                    onChange={(e) => updateSigner(i, 'role', e.target.value as Signer['role'])}
                    className={inputCls}
                  >
                    <option value="seller">Seller</option>
                    <option value="buyer">Buyer</option>
                    <option value="agent">Agent</option>
                    <option value="co_agent">Co-Agent</option>
                  </select>
                </Field>
              </div>
            </div>
          ))}
        </div>
        <button
          onClick={addSigner}
          className="mt-3 text-teal-600 hover:text-teal-700 font-medium text-sm"
        >
          + Add Signer
        </button>
        <NavRow>
          <BackBtn onClick={() => setStep(2)} />
          <NextBtn onClick={() => setStep(4)} disabled={validSigners.length === 0} />
        </NavRow>
      </Card>
    )
  }

  /* ── Step 4: Agent Questionnaire ── */
  if (step === 4) {
    return (
      <Card title="Step 4 of 5 — Deal Details" onBack={() => setStep(3)}>
        <p className="text-slate-500 text-sm mb-5">
          Fields shared across forms are collected once and carried forward automatically.
        </p>
        <div className="space-y-6">
          <section>
            <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wider mb-3">
              Deal Terms
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {DEAL_FIELDS.map((f) => (
                <Field key={f.key} label={f.label}>
                  <input
                    type={f.type}
                    value={(agentData[f.key] as string) ?? ''}
                    onChange={(e) => setField(f.key, e.target.value)}
                    placeholder={f.placeholder}
                    className={inputCls}
                  />
                </Field>
              ))}
            </div>
          </section>

          <section>
            <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wider mb-3">
              Property Disclosures
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {DISCLOSURE_FIELDS.map((f) => (
                <label key={f.key} className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={(agentData[f.key] as boolean) ?? false}
                    onChange={(e) => setField(f.key, e.target.checked)}
                    className="w-4 h-4 accent-teal-600"
                  />
                  <span className="text-sm text-slate-700">{f.label}</span>
                </label>
              ))}
            </div>
          </section>
        </div>
        <NavRow>
          <BackBtn onClick={() => setStep(3)} />
          <NextBtn onClick={() => setStep(5)} />
        </NavRow>
      </Card>
    )
  }

  /* ── Step 5: Review ── */
  if (step === 5) {
    const selectedFormDetails = forms.filter((f) => selectedForms.includes(f.id))
    const filledDealFields = DEAL_FIELDS.filter((f) => agentData[f.key])

    return (
      <Card title="Step 5 of 5 — Review &amp; Generate Link" onBack={() => setStep(4)}>
        <div className="space-y-3 mb-6">
          <ReviewSection title="Property">
            <p className="text-slate-700 text-sm">{propertyAddress}</p>
          </ReviewSection>

          <ReviewSection title={`Forms (${selectedFormDetails.length})`}>
            <ul className="space-y-1">
              {selectedFormDetails.map((f) => (
                <li key={f.id} className="text-slate-700 text-sm">
                  Form {f.formNumber} — {f.formName}
                </li>
              ))}
            </ul>
          </ReviewSection>

          <ReviewSection title={`Signers (${validSigners.length})`}>
            <ul className="space-y-1">
              {validSigners.map((s, i) => (
                <li key={i} className="text-slate-700 text-sm capitalize">
                  {s.name} ({s.role.replace('_', ' ')}) — {s.email}
                </li>
              ))}
            </ul>
          </ReviewSection>

          {filledDealFields.length > 0 && (
            <ReviewSection title="Deal Terms">
              {filledDealFields.map((f) => (
                <div key={f.key} className="flex justify-between text-sm py-0.5">
                  <span className="text-slate-500">{f.label}</span>
                  <span className="text-slate-800 font-medium">{agentData[f.key] as string}</span>
                </div>
              ))}
            </ReviewSection>
          )}
        </div>

        {error && (
          <p className="text-red-600 text-sm bg-red-50 rounded-lg px-3 py-2 mb-4">{error}</p>
        )}

        <NavRow>
          <BackBtn onClick={() => setStep(4)} />
          <button
            onClick={generatePackage}
            disabled={loading}
            className="bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-semibold px-6 py-2.5 rounded-lg transition-colors"
          >
            {loading ? 'Generating…' : 'Generate Client Link'}
          </button>
        </NavRow>
      </Card>
    )
  }

  /* ── Step 6: Success ── */
  return (
    <Card title="Package Created" onBack={null}>
      <div className="text-center py-4">
        <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg
            className="w-8 h-8 text-teal-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">Client Link Generated</h2>
        <p className="text-slate-500 text-sm mb-6">
          Share this link with your client to complete their portion of the forms.
        </p>

        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-center gap-3 text-left mb-2">
          <code className="flex-1 text-sm text-teal-700 font-mono break-all">{clientLink}</code>
          <CopyButton text={clientLink} />
        </div>
        <p className="text-slate-400 text-xs mb-8">Link expires in 7 days</p>

        <button
          onClick={() => router.push('/dashboard')}
          className="bg-slate-900 hover:bg-slate-800 text-white font-semibold px-6 py-2.5 rounded-lg transition-colors"
        >
          Back to Dashboard
        </button>
      </div>
    </Card>
  )
}

/* ── Helper components ── */

const inputCls =
  'mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm'

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-sm font-medium text-slate-700">{label}</label>
      {children}
    </div>
  )
}

function Card({
  title,
  onBack,
  children,
}: {
  title: string
  onBack: (() => void) | null
  children: React.ReactNode
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        {onBack && (
          <button onClick={onBack} className="text-slate-400 hover:text-slate-700 text-lg leading-none">
            ←
          </button>
        )}
        <h2 className="text-lg font-bold text-slate-900">{title}</h2>
      </div>
      {children}
    </div>
  )
}

function NavRow({ children }: { children: React.ReactNode }) {
  return <div className="mt-6 flex items-center justify-between">{children}</div>
}

function NextBtn({ onClick, disabled }: { onClick: () => void; disabled?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="bg-teal-600 hover:bg-teal-700 disabled:opacity-40 text-white font-semibold px-5 py-2 rounded-lg transition-colors text-sm"
    >
      Continue →
    </button>
  )
}

function BackBtn({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick} className="text-slate-500 hover:text-slate-700 font-medium text-sm px-3 py-2">
      ← Back
    </button>
  )
}

function ReviewSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border border-slate-200 rounded-xl p-4">
      <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
        {title}
      </h4>
      {children}
    </div>
  )
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      onClick={copy}
      className="shrink-0 text-sm font-medium text-teal-600 hover:text-teal-700"
    >
      {copied ? 'Copied!' : 'Copy'}
    </button>
  )
}
