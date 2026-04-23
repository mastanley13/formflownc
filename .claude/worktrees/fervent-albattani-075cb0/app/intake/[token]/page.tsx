'use client'

import { useState, useEffect, FormEvent } from 'react'
import { useParams } from 'next/navigation'

type PackageInfo = {
  propertyAddress: string
  status: string
  agent: { name: string; firmName: string | null; phone: string | null; email: string | null }
  forms: { id: string; formNumber: string; formName: string }[]
  signers: { id: string; name: string; role: string }[]
  expiresAt: string
}

type Section = 'personal' | 'property' | 'disclosures' | 'review'
const SECTIONS: { id: Section; label: string }[] = [
  { id: 'personal', label: 'Personal Info' },
  { id: 'property', label: 'Property Details' },
  { id: 'disclosures', label: 'Disclosures' },
  { id: 'review', label: 'Review & Submit' },
]

const DISC_QUESTIONS = [
  { key: 'disc_hoa_exists', label: 'Is the property part of an HOA or community association?' },
  { key: 'disc_flood_zone', label: 'Is the property located in a flood zone?' },
  { key: 'disc_septic', label: 'Does the property use a septic system?' },
  { key: 'disc_well', label: 'Does the property have a private well?' },
  { key: 'disc_lead_paint', label: 'Was the property built before 1978 (lead paint)?' },
  { key: 'disc_mineral_rights', label: 'Are mineral rights severed from the property?' },
  { key: 'disc_renovations', label: 'Are there any unpermitted renovations or improvements?' },
]

function ProgressBar({ currentSection, sections }: { currentSection: number; sections: typeof SECTIONS }) {
  const pct = Math.round(((currentSection + 1) / sections.length) * 100)
  return (
    <div className="w-full bg-slate-100 rounded-full h-1.5 mb-6">
      <div className="bg-teal-600 h-1.5 rounded-full transition-all duration-300" style={{ width: `${pct}%` }} />
    </div>
  )
}

function YesNoField({ name, label, value, onChange }: { name: string; label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="border border-slate-200 rounded-xl p-4">
      <p className="text-sm text-slate-800 font-medium mb-3">{label}</p>
      <div className="flex gap-3">
        {['Yes', 'No', 'Unknown'].map((opt) => (
          <button
            key={opt}
            type="button"
            onClick={() => onChange(opt)}
            className={`flex-1 py-3 text-sm font-semibold rounded-lg border transition ${
              value === opt
                ? 'bg-teal-600 text-white border-teal-600'
                : 'bg-white text-slate-600 border-slate-200 hover:border-teal-300'
            }`}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  )
}

export default function IntakePage() {
  const params = useParams()
  const token = typeof params.token === 'string' ? params.token : params.token?.[0] ?? ''

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [pkg, setPkg] = useState<PackageInfo | null>(null)
  const [section, setSection] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)

  const [formData, setFormData] = useState<Record<string, string>>({})

  function set(key: string, value: string) {
    setFormData((prev) => ({ ...prev, [key]: value }))
  }

  useEffect(() => {
    if (!token) return
    fetch(`/api/intake/${token}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) { setError(d.error); setLoading(false); return }
        setPkg(d)
        setLoading(false)
      })
      .catch(() => { setError('Failed to load intake form.'); setLoading(false) })
  }, [token])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    try {
      const res = await fetch(`/api/intake/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Submission failed.'); return }
      setDone(true)
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const inp = (id: string, label: string, type = 'text', placeholder = '', required = false) => (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1.5" htmlFor={id}>
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <input
        id={id} type={type} placeholder={placeholder} required={required}
        value={formData[id] ?? ''}
        onChange={(e) => set(id, e.target.value)}
        className="w-full border border-slate-300 rounded-xl px-4 py-3.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition text-base"
      />
    </div>
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-500 text-sm">Loading your intake form…</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-8 max-w-md w-full text-center">
          <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-slate-900 mb-2">Link Unavailable</h2>
          <p className="text-slate-500 text-sm">{error}</p>
        </div>
      </div>
    )
  }

  if (done) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 rounded-full bg-teal-100 flex items-center justify-center mx-auto mb-5">
            <svg className="w-8 h-8 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">You&apos;re All Set!</h2>
          <p className="text-slate-500 text-sm leading-relaxed">
            Your information has been submitted. Your agent will send signature requests to{' '}
            <strong>{pkg?.signers.map((s) => s.name).join(', ')}</strong> shortly.
          </p>
          <div className="mt-6 bg-teal-50 border border-teal-200 rounded-xl px-4 py-3 text-sm text-teal-800">
            Check your email for DocuSign/DocuSeal signature requests within the next few minutes.
          </div>
        </div>
      </div>
    )
  }

  const currentSection = SECTIONS[section]

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-teal-600 flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <span className="font-bold text-slate-900 text-sm">FormFlowNC</span>
          </div>
          <div className="text-right">
            <p className="text-xs font-semibold text-slate-700">{pkg?.agent.name}</p>
            <p className="text-xs text-slate-400">{pkg?.agent.firmName}</p>
          </div>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-6">
        {/* Property banner */}
        <div className="bg-navy-900 bg-slate-800 rounded-2xl px-5 py-4 mb-6 text-white">
          <p className="text-xs text-slate-400 mb-0.5">Subject Property</p>
          <p className="font-semibold text-base">{pkg?.propertyAddress}</p>
          <p className="text-xs text-teal-400 mt-1">{pkg?.forms.length} forms · Expires {pkg ? new Date(pkg.expiresAt).toLocaleDateString() : ''}</p>
        </div>

        {/* Progress */}
        <ProgressBar currentSection={section} sections={SECTIONS} />

        {/* Step label */}
        <div className="flex items-center gap-2 mb-5">
          <span className="text-xs text-teal-600 font-semibold bg-teal-50 px-2 py-1 rounded-full">
            {section + 1} of {SECTIONS.length}
          </span>
          <h2 className="text-lg font-bold text-slate-900">{currentSection.label}</h2>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Section: Personal Info */}
          {currentSection.id === 'personal' && (
            <div className="space-y-4">
              {inp('seller_name_1', 'Your Full Legal Name', 'text', 'Jane A. Smith', true)}
              {inp('seller_email', 'Email Address', 'email', 'jane@email.com', true)}
              {inp('seller_phone', 'Phone Number', 'tel', '(252) 555-0100')}
              {inp('seller_dob', 'Date of Birth', 'date')}
              {inp('seller_address', 'Current Mailing Address', 'text', '123 Oak St')}
              {inp('seller_city', 'City', 'text', 'New Bern')}
              <div className="grid grid-cols-2 gap-4">
                {inp('seller_state', 'State', 'text', 'NC')}
                {inp('seller_zip', 'ZIP', 'text', '28560')}
              </div>
              <p className="text-xs text-slate-400 mt-2">
                If there is a co-seller/co-buyer, they will receive a separate link.
              </p>
            </div>
          )}

          {/* Section: Property Details */}
          {currentSection.id === 'property' && (
            <div className="space-y-4">
              <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm">
                <p className="text-xs text-slate-400 mb-1">Confirmed property address</p>
                <p className="font-semibold text-slate-800">{pkg?.propertyAddress}</p>
              </div>
              {inp('property_county', 'County', 'text', 'Craven')}
              {inp('property_tax_parcel', 'Tax Parcel / PIN', 'text', '7-001-123')}
              {inp('property_year_built', 'Year Built', 'text', '1995')}
              {inp('property_sq_ft', 'Square Footage', 'text', '2,100')}
              {inp('property_bedrooms', 'Bedrooms', 'number', '3')}
              {inp('property_bathrooms', 'Bathrooms', 'text', '2.5')}
              {inp('property_type', 'Property Type', 'text', 'Single Family')}
            </div>
          )}

          {/* Section: Disclosures */}
          {currentSection.id === 'disclosures' && (
            <div className="space-y-3">
              <p className="text-sm text-slate-500 mb-4">
                Answer each disclosure question honestly. These are required by NC law for residential transactions.
              </p>
              {DISC_QUESTIONS.map((q) => (
                <YesNoField
                  key={q.key}
                  name={q.key}
                  label={q.label}
                  value={formData[q.key] ?? ''}
                  onChange={(v) => set(q.key, v)}
                />
              ))}
              {formData.disc_hoa_exists === 'Yes' && (
                <div className="mt-2 space-y-3">
                  {inp('property_hoa_name', 'HOA Name', 'text', 'Riverfront HOA')}
                  {inp('property_hoa_dues', 'Monthly HOA Dues ($)', 'text', '85')}
                </div>
              )}
            </div>
          )}

          {/* Section: Review */}
          {currentSection.id === 'review' && (
            <div className="space-y-4">
              <div className="border border-slate-200 rounded-xl divide-y divide-slate-100">
                {[
                  { label: 'Name', value: formData.seller_name_1 },
                  { label: 'Email', value: formData.seller_email },
                  { label: 'Phone', value: formData.seller_phone },
                  { label: 'Property', value: pkg?.propertyAddress },
                  { label: 'County', value: formData.property_county },
                  { label: 'Year Built', value: formData.property_year_built },
                ].filter((r) => r.value).map((row) => (
                  <div key={row.label} className="flex justify-between px-4 py-3">
                    <span className="text-xs text-slate-400">{row.label}</span>
                    <span className="text-sm font-medium text-slate-800 text-right max-w-xs truncate">{row.value}</span>
                  </div>
                ))}
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-sm text-blue-800">
                By submitting, you confirm the information above is accurate. Your agent will use this to prepare transaction documents for your signature.
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">{error}</div>
              )}
            </div>
          )}

          {/* Navigation */}
          <div className="flex gap-3 mt-8">
            {section > 0 && (
              <button
                type="button"
                onClick={() => setSection((s) => s - 1)}
                className="flex-1 border border-slate-200 text-slate-700 font-semibold py-4 rounded-xl text-base hover:bg-slate-50 transition"
              >
                ← Back
              </button>
            )}

            {section < SECTIONS.length - 1 ? (
              <button
                type="button"
                onClick={() => setSection((s) => s + 1)}
                className="flex-1 bg-teal-600 hover:bg-teal-700 text-white font-semibold py-4 rounded-xl text-base transition"
              >
                Continue →
              </button>
            ) : (
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 bg-teal-600 hover:bg-teal-700 disabled:opacity-60 text-white font-bold py-4 rounded-xl text-base transition"
              >
                {submitting ? 'Submitting…' : 'Submit My Information'}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}
