'use client'

import { useState } from 'react'

type Signer = { name: string; email: string; role: string }

type ClientData = {
  // Personal
  sellerName1: string
  sellerName2: string
  sellerEmail: string
  sellerPhone: string
  sellerAddress: string
  // Property
  propertyType: string
  yearBuilt: string
  sqft: string
  bedrooms: string
  bathrooms: string
  county: string
  taxParcel: string
  // Disclosures
  hoaExists: boolean
  hoaName: string
  hoaDues: string
  floodZone: boolean
  septic: boolean
  privateWell: boolean
  leadPaint: boolean
  mineralRights: boolean
  unpermittedRenovations: boolean
  // ID
  idType: string
  idBase64: string
}

const STEPS = ['Welcome', 'Personal Info', 'Property Details', 'Disclosures', 'ID Upload', 'Review']

function ProgressBar({ step, total }: { step: number; total: number }) {
  const pct = Math.round(((step + 1) / total) * 100)
  return (
    <div className="w-full bg-slate-200 rounded-full h-1.5 mb-6">
      <div
        className="bg-teal-500 h-1.5 rounded-full transition-all duration-300"
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}

function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-6">
      <h2 className="text-lg font-bold text-slate-900">{title}</h2>
      {subtitle && <p className="text-slate-500 text-sm mt-0.5">{subtitle}</p>}
    </div>
  )
}

function Field({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1.5">{label}</label>
      {children}
    </div>
  )
}

function TextInput({
  value,
  onChange,
  placeholder,
  type = 'text',
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  type?: string
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full px-3 py-3 rounded-xl border border-slate-300 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
    />
  )
}

function CheckField({
  label,
  checked,
  onChange,
  sublabel,
}: {
  label: string
  checked: boolean
  onChange: (v: boolean) => void
  sublabel?: string
}) {
  return (
    <label className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-colors ${checked ? 'border-teal-400 bg-teal-50' : 'border-slate-200 bg-white hover:border-slate-300'}`}>
      <input
        type="checkbox"
        checked={checked}
        onChange={e => onChange(e.target.checked)}
        className="mt-0.5 w-5 h-5 text-teal-600 rounded border-slate-300 focus:ring-teal-500 flex-shrink-0"
      />
      <div>
        <p className="text-sm font-semibold text-slate-800">{label}</p>
        {sublabel && <p className="text-xs text-slate-500 mt-0.5">{sublabel}</p>}
      </div>
    </label>
  )
}

export default function IntakeForm({
  token,
  propertyAddress,
  agentName,
  agentFirm,
  signers,
}: {
  token: string
  propertyAddress: string
  agentName: string
  agentFirm: string
  signers: Signer[]
}) {
  const [step, setStep] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')
  const [data, setData] = useState<ClientData>({
    sellerName1: signers[0]?.name ?? '',
    sellerName2: signers[1]?.name ?? '',
    sellerEmail: signers[0]?.email ?? '',
    sellerPhone: '',
    sellerAddress: '',
    propertyType: 'Single Family',
    yearBuilt: '',
    sqft: '',
    bedrooms: '',
    bathrooms: '',
    county: '',
    taxParcel: '',
    hoaExists: false,
    hoaName: '',
    hoaDues: '',
    floodZone: false,
    septic: false,
    privateWell: false,
    leadPaint: false,
    mineralRights: false,
    unpermittedRenovations: false,
    idType: 'drivers_license',
    idBase64: '',
  })

  function set<K extends keyof ClientData>(key: K, value: ClientData[K]) {
    setData(prev => ({ ...prev, [key]: value }))
  }

  async function handleIdUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => {
      const result = ev.target?.result as string
      set('idBase64', result.split(',')[1] ?? '')
    }
    reader.readAsDataURL(file)
  }

  async function submit() {
    setSubmitting(true)
    setError('')
    try {
      const res = await fetch(`/api/intake/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientData: data }),
      })
      if (!res.ok) {
        const d = await res.json()
        setError(d.error ?? 'Submission failed')
        return
      }
      setDone(true)
    } catch {
      setError('Network error — please try again')
    } finally {
      setSubmitting(false)
    }
  }

  if (done) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-5">
            <svg className="w-8 h-8 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-3">All Done!</h1>
          <p className="text-slate-500 text-sm leading-relaxed">
            Thank you for completing your intake. {agentName} will review your information and be in touch soon.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-blue-950 text-white px-4 py-4">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-teal-500 flex items-center justify-center flex-shrink-0">
            <svg className="w-4.5 h-4.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div>
            <p className="font-bold text-sm">FormFlowNC</p>
            <p className="text-blue-200 text-xs">{agentName}{agentFirm ? ` · ${agentFirm}` : ''}</p>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6">
        <div className="bg-teal-50 border border-teal-200 rounded-xl px-4 py-3 mb-6">
          <p className="text-xs font-semibold text-teal-700 uppercase tracking-wide">Property</p>
          <p className="text-sm font-semibold text-teal-900 mt-0.5">{propertyAddress}</p>
        </div>

        <ProgressBar step={step} total={STEPS.length} />

        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          {/* Step 0: Welcome */}
          {step === 0 && (
            <div>
              <SectionHeader
                title="Welcome!"
                subtitle="Your agent has created a document package for your property. This form collects your information to pre-fill your NC REALTOR forms."
              />
              <div className="bg-slate-50 rounded-xl p-4 space-y-2 text-sm text-slate-600">
                <p>✓ Takes about 5 minutes</p>
                <p>✓ Your information is secure</p>
                <p>✓ Photo ID required at the end</p>
              </div>
            </div>
          )}

          {/* Step 1: Personal Info */}
          {step === 1 && (
            <div className="space-y-4">
              <SectionHeader title="Personal Information" subtitle="Provide the details for each party on this transaction." />
              <Field label="Your Full Name">
                <TextInput value={data.sellerName1} onChange={v => set('sellerName1', v)} placeholder="Jane Smith" />
              </Field>
              <Field label="Co-Signer Name (if applicable)">
                <TextInput value={data.sellerName2} onChange={v => set('sellerName2', v)} placeholder="John Smith" />
              </Field>
              <Field label="Email Address">
                <TextInput type="email" value={data.sellerEmail} onChange={v => set('sellerEmail', v)} placeholder="jane@example.com" />
              </Field>
              <Field label="Phone Number">
                <TextInput type="tel" value={data.sellerPhone} onChange={v => set('sellerPhone', v)} placeholder="(252) 555-0100" />
              </Field>
              <Field label="Mailing Address">
                <TextInput value={data.sellerAddress} onChange={v => set('sellerAddress', v)} placeholder="123 Home St, New Bern, NC 28560" />
              </Field>
            </div>
          )}

          {/* Step 2: Property Details */}
          {step === 2 && (
            <div className="space-y-4">
              <SectionHeader title="Property Details" subtitle="Tell us about the property." />
              <Field label="Property Type">
                <select
                  value={data.propertyType}
                  onChange={e => set('propertyType', e.target.value)}
                  className="w-full px-3 py-3 rounded-xl border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
                >
                  <option>Single Family</option>
                  <option>Condo/Townhome</option>
                  <option>Multi-Family</option>
                  <option>Land</option>
                  <option>Commercial</option>
                </select>
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Year Built">
                  <TextInput value={data.yearBuilt} onChange={v => set('yearBuilt', v)} placeholder="1998" />
                </Field>
                <Field label="Square Footage">
                  <TextInput value={data.sqft} onChange={v => set('sqft', v)} placeholder="2,100" />
                </Field>
                <Field label="Bedrooms">
                  <TextInput value={data.bedrooms} onChange={v => set('bedrooms', v)} placeholder="3" />
                </Field>
                <Field label="Bathrooms">
                  <TextInput value={data.bathrooms} onChange={v => set('bathrooms', v)} placeholder="2" />
                </Field>
              </div>
              <Field label="County">
                <TextInput value={data.county} onChange={v => set('county', v)} placeholder="Craven" />
              </Field>
              <Field label="Tax Parcel ID (optional)">
                <TextInput value={data.taxParcel} onChange={v => set('taxParcel', v)} placeholder="8-012-3456" />
              </Field>
            </div>
          )}

          {/* Step 3: Disclosures */}
          {step === 3 && (
            <div className="space-y-3">
              <SectionHeader title="Property Disclosures" subtitle="Check all that apply to this property. These are required by NC law." />
              <CheckField
                label="HOA / Owners' Association Exists"
                sublabel="Property is subject to an HOA or owners' association"
                checked={data.hoaExists}
                onChange={v => set('hoaExists', v)}
              />
              {data.hoaExists && (
                <div className="pl-4 space-y-3">
                  <Field label="HOA Name">
                    <TextInput value={data.hoaName} onChange={v => set('hoaName', v)} placeholder="Neuse River HOA" />
                  </Field>
                  <Field label="Monthly Dues">
                    <TextInput value={data.hoaDues} onChange={v => set('hoaDues', v)} placeholder="$75" />
                  </Field>
                </div>
              )}
              <CheckField
                label="Flood Zone"
                sublabel="Property is located in a FEMA designated flood zone"
                checked={data.floodZone}
                onChange={v => set('floodZone', v)}
              />
              <CheckField
                label="Septic System"
                sublabel="Property uses a private septic system (not municipal sewer)"
                checked={data.septic}
                onChange={v => set('septic', v)}
              />
              <CheckField
                label="Private Well"
                sublabel="Property uses a private well (not municipal water)"
                checked={data.privateWell}
                onChange={v => set('privateWell', v)}
              />
              <CheckField
                label="Lead Paint Disclosure Applies"
                sublabel="Property was built before 1978"
                checked={data.leadPaint}
                onChange={v => set('leadPaint', v)}
              />
              <CheckField
                label="Mineral/Oil/Gas Rights Severed"
                sublabel="Mineral, oil, or gas rights have been separated from surface rights"
                checked={data.mineralRights}
                onChange={v => set('mineralRights', v)}
              />
              <CheckField
                label="Unpermitted Renovations"
                sublabel="Property has renovations or additions completed without permits"
                checked={data.unpermittedRenovations}
                onChange={v => set('unpermittedRenovations', v)}
              />
            </div>
          )}

          {/* Step 4: ID Upload */}
          {step === 4 && (
            <div>
              <SectionHeader title="Photo ID" subtitle="Upload a clear photo of a government-issued ID to verify your identity." />

              <div className="space-y-4">
                <Field label="ID Type">
                  <select
                    value={data.idType}
                    onChange={e => set('idType', e.target.value)}
                    className="w-full px-3 py-3 rounded-xl border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
                  >
                    <option value="drivers_license">Driver&apos;s License</option>
                    <option value="passport">Passport</option>
                    <option value="state_id">State ID Card</option>
                    <option value="military_id">Military ID</option>
                  </select>
                </Field>

                <div
                  className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors ${
                    data.idBase64 ? 'border-teal-400 bg-teal-50' : 'border-slate-300 hover:border-teal-400'
                  }`}
                >
                  {data.idBase64 ? (
                    <div>
                      <svg className="w-10 h-10 text-teal-500 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p className="text-sm font-semibold text-teal-700">ID uploaded successfully</p>
                      <button
                        onClick={() => set('idBase64', '')}
                        className="text-xs text-slate-500 hover:text-slate-700 mt-1"
                      >
                        Remove and re-upload
                      </button>
                    </div>
                  ) : (
                    <label className="cursor-pointer block">
                      <svg className="w-10 h-10 text-slate-400 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <p className="text-sm font-semibold text-slate-700">Take photo or upload file</p>
                      <p className="text-xs text-slate-400 mt-1">JPG, PNG, or PDF up to 10MB</p>
                      <input
                        type="file"
                        accept="image/*,application/pdf"
                        capture="environment"
                        className="sr-only"
                        onChange={handleIdUpload}
                      />
                    </label>
                  )}
                </div>

                <p className="text-xs text-slate-400 text-center">
                  Your ID is stored securely and used only for identity verification purposes.
                </p>
              </div>
            </div>
          )}

          {/* Step 5: Review */}
          {step === 5 && (
            <div>
              <SectionHeader title="Review & Submit" subtitle="Please confirm your information before submitting." />
              <div className="space-y-3 text-sm">
                <div className="bg-slate-50 rounded-xl p-4">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Personal</p>
                  <p className="text-slate-800">{data.sellerName1}{data.sellerName2 ? ` & ${data.sellerName2}` : ''}</p>
                  <p className="text-slate-600">{data.sellerEmail} · {data.sellerPhone}</p>
                  {data.sellerAddress && <p className="text-slate-600">{data.sellerAddress}</p>}
                </div>
                <div className="bg-slate-50 rounded-xl p-4">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Property</p>
                  <p className="text-slate-800">{data.propertyType} · Built {data.yearBuilt || '—'}</p>
                  <p className="text-slate-600">
                    {data.bedrooms}bd / {data.bathrooms}ba · {data.sqft} sqft
                  </p>
                  <p className="text-slate-600">{data.county ? `${data.county} County` : ''}</p>
                </div>
                <div className="bg-slate-50 rounded-xl p-4">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Disclosures</p>
                  <div className="space-y-1">
                    {[
                      [data.hoaExists, 'HOA Exists'],
                      [data.floodZone, 'Flood Zone'],
                      [data.septic, 'Septic System'],
                      [data.privateWell, 'Private Well'],
                      [data.leadPaint, 'Lead Paint (pre-1978)'],
                      [data.mineralRights, 'Mineral Rights Severed'],
                      [data.unpermittedRenovations, 'Unpermitted Renovations'],
                    ].map(([val, label]) => val ? (
                      <p key={String(label)} className="text-slate-700">✓ {label as string}</p>
                    ) : null)}
                    {!data.hoaExists && !data.floodZone && !data.septic && !data.privateWell && !data.leadPaint && !data.mineralRights && !data.unpermittedRenovations && (
                      <p className="text-slate-500">No applicable disclosures</p>
                    )}
                  </div>
                </div>
                <div className="bg-slate-50 rounded-xl p-4">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">ID Verification</p>
                  <p className="text-slate-700">{data.idBase64 ? '✓ ID uploaded' : '⚠ No ID uploaded'}</p>
                </div>
              </div>

              {error && (
                <div className="mt-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
                  {error}
                </div>
              )}
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between mt-8 pt-6 border-t border-slate-100">
            {step > 0 ? (
              <button
                onClick={() => setStep(s => s - 1)}
                className="text-sm text-slate-500 hover:text-slate-700 font-medium transition-colors py-2.5 px-3"
              >
                ← Back
              </button>
            ) : (
              <div />
            )}

            {step < STEPS.length - 1 ? (
              <button
                onClick={() => setStep(s => s + 1)}
                className="bg-teal-600 hover:bg-teal-700 text-white font-semibold px-6 py-3 rounded-xl text-sm transition-colors min-w-[120px]"
              >
                Continue →
              </button>
            ) : (
              <button
                onClick={submit}
                disabled={submitting}
                className="bg-teal-600 hover:bg-teal-700 disabled:opacity-60 text-white font-semibold px-6 py-3 rounded-xl text-sm transition-colors min-w-[120px]"
              >
                {submitting ? 'Submitting…' : 'Submit'}
              </button>
            )}
          </div>
        </div>

        <p className="text-center text-xs text-slate-400 mt-6">
          Powered by FormFlowNC · Your data is encrypted and secure
        </p>
      </div>
    </div>
  )
}
