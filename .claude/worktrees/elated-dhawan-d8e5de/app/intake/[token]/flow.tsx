'use client'

import { useState } from 'react'

type Signer = { id: string; name: string; email: string; role: string }

type Props = {
  token: string
  propertyAddress: string
  signers: Signer[]
  existingData: Record<string, string>
}

const SECTIONS = ['Personal Info', 'Property Details', 'Disclosures', 'ID Upload', 'Review'] as const

const DISCLOSURES = [
  {
    key: 'disc_hoa_exists',
    label: 'Is there a Homeowners Association (HOA)?',
    followUp: { key: 'property_hoa_name', label: 'HOA Name' },
  },
  {
    key: 'disc_lead_paint',
    label: 'Was the home built before 1978 (lead paint disclosure required)?',
    followUp: null,
  },
  { key: 'disc_flood_zone', label: 'Is the property in a flood zone?', followUp: null },
  { key: 'disc_septic', label: 'Does the property have a septic system?', followUp: null },
  { key: 'disc_well', label: 'Does the property have a private well?', followUp: null },
  {
    key: 'disc_mineral_rights',
    label: 'Are mineral rights conveying with the property?',
    followUp: null,
  },
  {
    key: 'disc_renovations',
    label: 'Are there any unpermitted renovations or additions?',
    followUp: null,
  },
] as const

export default function IntakeFlow({ token, propertyAddress, signers, existingData }: Props) {
  const [sectionIdx, setSectionIdx] = useState(0)
  const [data, setData] = useState<Record<string, string>>(existingData ?? {})
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const section = SECTIONS[sectionIdx]
  const progress = Math.round((sectionIdx / (SECTIONS.length - 1)) * 100)

  const setField = (key: string, value: string) =>
    setData((prev) => ({ ...prev, [key]: value }))

  async function handleSubmit() {
    setSubmitting(true)
    setError('')
    try {
      const res = await fetch(`/api/intake/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientData: data }),
      })
      const result = await res.json()
      if (!res.ok) {
        setError(result.error || 'Submission failed')
        return
      }
      setSubmitted(true)
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-teal-700 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-10 text-center max-w-md w-full">
          <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-5">
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
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Submitted!</h1>
          <p className="text-slate-500">
            Thank you. Your agent will be in touch soon with next steps.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-slate-900 px-4 py-4">
        <h1 className="text-lg font-bold text-teal-400">FormFlowNC</h1>
        <p className="text-slate-400 text-sm mt-0.5 truncate">{propertyAddress}</p>
      </div>

      {/* Progress */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-2xl mx-auto px-4 py-3">
          <div className="flex justify-between mb-2">
            {SECTIONS.map((s, i) => (
              <span
                key={s}
                className={`text-xs font-medium transition-colors ${
                  i === sectionIdx
                    ? 'text-teal-600'
                    : i < sectionIdx
                    ? 'text-slate-400'
                    : 'text-slate-300'
                }`}
              >
                {s.split(' ')[0]}
              </span>
            ))}
          </div>
          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-teal-600 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <h2 className="text-xl font-bold text-slate-900 mb-5">{section}</h2>

          {/* Personal Info */}
          {section === 'Personal Info' && (
            <div className="space-y-4">
              {signers.map((signer, i) => (
                <div key={signer.id} className="border border-slate-200 rounded-xl p-4">
                  <p className="text-sm font-semibold text-slate-700 mb-3 capitalize">
                    {signer.role.replace('_', ' ')}: {signer.name}
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <IntakeField label="Legal Full Name">
                      <input
                        type="text"
                        value={data[`client_${i}_legal_name`] ?? signer.name}
                        onChange={(e) => setField(`client_${i}_legal_name`, e.target.value)}
                        className={iCls}
                      />
                    </IntakeField>
                    <IntakeField label="Date of Birth">
                      <input
                        type="date"
                        value={data[`client_${i}_dob`] ?? ''}
                        onChange={(e) => setField(`client_${i}_dob`, e.target.value)}
                        className={iCls}
                      />
                    </IntakeField>
                    <IntakeField label="Phone">
                      <input
                        type="tel"
                        value={data[`client_${i}_phone`] ?? ''}
                        onChange={(e) => setField(`client_${i}_phone`, e.target.value)}
                        placeholder="(555) 000-0000"
                        className={iCls}
                      />
                    </IntakeField>
                    <IntakeField label="Mailing Address">
                      <input
                        type="text"
                        value={data[`client_${i}_mailing`] ?? ''}
                        onChange={(e) => setField(`client_${i}_mailing`, e.target.value)}
                        placeholder="123 Main St, City, NC"
                        className={iCls}
                      />
                    </IntakeField>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Property Details */}
          {section === 'Property Details' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <IntakeField label="County">
                  <input
                    type="text"
                    value={data.property_county ?? ''}
                    onChange={(e) => setField('property_county', e.target.value)}
                    placeholder="Craven"
                    className={iCls}
                  />
                </IntakeField>
                <IntakeField label="Tax Parcel ID">
                  <input
                    type="text"
                    value={data.property_tax_parcel ?? ''}
                    onChange={(e) => setField('property_tax_parcel', e.target.value)}
                    className={iCls}
                  />
                </IntakeField>
                <IntakeField label="Year Built">
                  <input
                    type="number"
                    value={data.property_year_built ?? ''}
                    onChange={(e) => setField('property_year_built', e.target.value)}
                    placeholder="1995"
                    className={iCls}
                  />
                </IntakeField>
                <IntakeField label="Square Feet">
                  <input
                    type="number"
                    value={data.property_sq_ft ?? ''}
                    onChange={(e) => setField('property_sq_ft', e.target.value)}
                    placeholder="1,800"
                    className={iCls}
                  />
                </IntakeField>
                <IntakeField label="Bedrooms">
                  <input
                    type="number"
                    value={data.property_beds ?? ''}
                    onChange={(e) => setField('property_beds', e.target.value)}
                    placeholder="3"
                    className={iCls}
                  />
                </IntakeField>
                <IntakeField label="Bathrooms">
                  <input
                    type="number"
                    value={data.property_baths ?? ''}
                    onChange={(e) => setField('property_baths', e.target.value)}
                    placeholder="2"
                    className={iCls}
                  />
                </IntakeField>
              </div>
              <IntakeField label="Legal Description">
                <textarea
                  value={data.property_legal_description ?? ''}
                  onChange={(e) => setField('property_legal_description', e.target.value)}
                  rows={3}
                  className={iCls}
                />
              </IntakeField>
            </div>
          )}

          {/* Disclosures */}
          {section === 'Disclosures' && (
            <div className="space-y-4">
              <p className="text-slate-500 text-sm">
                Please answer all questions about the property to the best of your knowledge.
              </p>
              {DISCLOSURES.map((q) => (
                <div key={q.key} className="border border-slate-200 rounded-xl p-4">
                  <p className="text-slate-800 text-sm mb-3">{q.label}</p>
                  <div className="flex gap-5">
                    {(['yes', 'no', 'unknown'] as const).map((opt) => (
                      <label key={opt} className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="radio"
                          name={q.key}
                          value={opt}
                          checked={data[q.key] === opt}
                          onChange={() => setField(q.key, opt)}
                          className="accent-teal-600"
                        />
                        <span className="text-sm text-slate-700 capitalize">{opt}</span>
                      </label>
                    ))}
                  </div>
                  {q.followUp && data[q.key] === 'yes' && (
                    <div className="mt-3">
                      <IntakeField label={q.followUp.label}>
                        <input
                          type="text"
                          value={data[q.followUp.key] ?? ''}
                          onChange={(e) => setField(q.followUp!.key, e.target.value)}
                          className={iCls}
                        />
                      </IntakeField>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* ID Upload */}
          {section === 'ID Upload' && (
            <div className="space-y-4">
              <p className="text-slate-500 text-sm">
                Please provide a clear photo of your government-issued ID (driver&apos;s license or
                passport) for identity verification.
              </p>
              {signers.map((signer, i) => (
                <div key={signer.id} className="border border-slate-200 rounded-xl p-4">
                  <p className="text-sm font-semibold text-slate-700 mb-3">ID for {signer.name}</p>
                  <label className="block cursor-pointer">
                    <div className="border-2 border-dashed border-slate-300 hover:border-teal-400 rounded-xl p-8 text-center transition-colors">
                      <svg
                        className="w-8 h-8 text-slate-400 mx-auto mb-2"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                        />
                      </svg>
                      <p className="text-slate-500 text-sm">
                        {data[`client_${i}_id_filename`] ?? 'Tap to upload photo ID'}
                      </p>
                    </div>
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) setField(`client_${i}_id_filename`, file.name)
                      }}
                    />
                  </label>
                </div>
              ))}
            </div>
          )}

          {/* Review */}
          {section === 'Review' && (
            <div className="space-y-4">
              <p className="text-slate-600 text-sm mb-2">
                Please review your information before submitting.
              </p>

              <div className="border border-slate-200 rounded-xl p-4">
                <SectionTitle>Signers</SectionTitle>
                {signers.map((s, i) => (
                  <div key={s.id} className="py-2 border-b border-slate-100 last:border-0">
                    <p className="font-medium text-slate-800 text-sm">
                      {data[`client_${i}_legal_name`] ?? s.name}
                    </p>
                    <p className="text-slate-500 text-xs capitalize">
                      {s.role.replace('_', ' ')} · {s.email}
                    </p>
                  </div>
                ))}
              </div>

              <div className="border border-slate-200 rounded-xl p-4">
                <SectionTitle>Property</SectionTitle>
                <p className="text-slate-700 text-sm">{propertyAddress}</p>
                {data.property_county && (
                  <p className="text-slate-500 text-xs mt-1">County: {data.property_county}</p>
                )}
              </div>

              {error && (
                <p className="text-red-600 text-sm bg-red-50 rounded-lg px-3 py-2">{error}</p>
              )}

              <p className="text-slate-400 text-xs">
                By submitting, you confirm that all information provided is accurate and complete to
                the best of your knowledge.
              </p>
            </div>
          )}

          {/* Navigation */}
          <div className="mt-6 flex items-center justify-between">
            {sectionIdx > 0 ? (
              <button
                onClick={() => setSectionIdx((i) => i - 1)}
                className="text-slate-500 hover:text-slate-700 font-medium text-sm px-3 py-2"
              >
                ← Back
              </button>
            ) : (
              <div />
            )}

            {sectionIdx < SECTIONS.length - 1 ? (
              <button
                onClick={() => setSectionIdx((i) => i + 1)}
                className="bg-teal-600 hover:bg-teal-700 text-white font-semibold px-5 py-2 rounded-lg transition-colors text-sm"
              >
                Continue →
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-semibold px-5 py-2 rounded-lg transition-colors text-sm"
              >
                {submitting ? 'Submitting…' : 'Submit'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

const iCls =
  'mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm'

function IntakeField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-sm text-slate-600">{label}</label>
      {children}
    </div>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
      {children}
    </h3>
  )
}
