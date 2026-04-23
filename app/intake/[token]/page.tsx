'use client'

import { useState, useEffect, useCallback, useRef, FormEvent } from 'react'
import { useParams } from 'next/navigation'
import {
  getIntakeConfigsForForms,
  flattenSections,
  type IntakeQuestion,
  type IntakeSection,
} from '@/lib/intake-questions'

// ─── Types ──────────────────────────────────────────────────────────────

type PackageInfo = {
  propertyAddress: string
  status: string
  agent: { name: string; firmName: string | null; phone: string | null; email: string | null }
  forms: { id: string; formNumber: string; formName: string }[]
  signers: { id: string; name: string; role: string }[]
  expiresAt: string
}

type FlatSection = IntakeSection & { formName: string; formNumber: string }

// ─── Shared components ──────────────────────────────────────────────────

function ProgressBar({ current, total }: { current: number; total: number }) {
  const pct = Math.round(((current + 1) / total) * 100)
  return (
    <div className="w-full bg-slate-100 rounded-full h-2 mb-6">
      <div
        className="bg-teal-600 h-2 rounded-full transition-all duration-500 ease-out"
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}

function YesNoNoRepField({
  question,
  value,
  explanation,
  onChangeValue,
  onChangeExplanation,
}: {
  question: IntakeQuestion
  value: string
  explanation: string
  onChangeValue: (v: string) => void
  onChangeExplanation: (v: string) => void
}) {
  const showExplanation =
    question.showExplanationOn && value === question.showExplanationOn

  return (
    <div className="border border-slate-200 rounded-xl p-4">
      <p className="text-sm text-slate-800 font-medium mb-3">
        {question.label}
        {question.required && <span className="text-red-500 ml-0.5">*</span>}
      </p>
      <div className="flex gap-2 sm:gap-3">
        {['Yes', 'No', 'No Representation'].map((opt) => (
          <button
            key={opt}
            type="button"
            onClick={() => onChangeValue(opt)}
            className={`flex-1 py-3 sm:py-3.5 text-sm font-semibold rounded-lg border transition ${
              value === opt
                ? 'bg-teal-600 text-white border-teal-600'
                : 'bg-white text-slate-600 border-slate-200 hover:border-teal-300 active:bg-teal-50'
            }`}
          >
            {opt === 'No Representation' ? 'No Rep' : opt}
          </button>
        ))}
      </div>
      {showExplanation && (
        <div className="mt-3">
          <input
            type="text"
            placeholder="Please explain..."
            value={explanation}
            onChange={(e) => onChangeExplanation(e.target.value)}
            className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 transition"
          />
        </div>
      )}
      {question.helpText && (
        <p className="text-xs text-slate-400 mt-2">{question.helpText}</p>
      )}
    </div>
  )
}

function InputField({
  question,
  value,
  onChange,
}: {
  question: IntakeQuestion
  value: string
  onChange: (v: string) => void
}) {
  const baseClass =
    'w-full border border-slate-300 rounded-xl px-4 py-3.5 text-base text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition'

  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1.5" htmlFor={question.id}>
        {question.label}
        {question.required && <span className="text-red-500 ml-0.5">*</span>}
      </label>

      {question.type === 'textarea' ? (
        <textarea
          id={question.id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={question.placeholder}
          rows={3}
          className={baseClass + ' resize-none'}
        />
      ) : question.type === 'select' ? (
        <select
          id={question.id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={baseClass + ' bg-white'}
        >
          <option value="">Select...</option>
          {question.options?.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      ) : (
        <input
          id={question.id}
          type={question.type === 'number' ? 'number' : question.type === 'date' ? 'date' : 'text'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={question.placeholder}
          className={baseClass}
        />
      )}

      {question.helpText && (
        <p className="text-xs text-slate-400 mt-1.5">{question.helpText}</p>
      )}
    </div>
  )
}

// ─── Section completeness helpers ───────────────────────────────────────

function isSectionComplete(section: IntakeSection, formData: Record<string, string>): boolean {
  for (const q of section.questions) {
    if (q.required && !formData[q.id]?.trim()) return false
  }
  return true
}

function countAnswered(section: IntakeSection, formData: Record<string, string>): number {
  return section.questions.filter((q) => formData[q.id]?.trim()).length
}

// ─── Main page ──────────────────────────────────────────────────────────

export default function IntakePage() {
  const params = useParams()
  const token = typeof params.token === 'string' ? params.token : params.token?.[0] ?? ''

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [pkg, setPkg] = useState<PackageInfo | null>(null)
  const [sectionIndex, setSectionIndex] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [autoSaveMsg, setAutoSaveMsg] = useState('')

  const [formData, setFormData] = useState<Record<string, string>>({})
  const [validationErrors, setValidationErrors] = useState<Set<string>>(new Set())

  const [sections, setSections] = useState<FlatSection[]>([])

  const autoSaveRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastSavedRef = useRef<string>('')

  function set(key: string, value: string) {
    setFormData((prev) => ({ ...prev, [key]: value }))
    setValidationErrors((prev) => {
      const next = new Set(prev)
      next.delete(key)
      return next
    })
  }

  const doAutoSave = useCallback(async () => {
    if (!token) return
    const serialized = JSON.stringify(formData)
    if (serialized === lastSavedRef.current) return
    lastSavedRef.current = serialized
    try {
      setAutoSaveMsg('Saving...')
      await fetch(`/api/intake/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-auto-save': '1' },
        body: serialized,
      })
      setAutoSaveMsg('Saved')
      setTimeout(() => setAutoSaveMsg(''), 2000)
    } catch {
      setAutoSaveMsg('Save failed')
      setTimeout(() => setAutoSaveMsg(''), 3000)
    }
  }, [formData, token])

  useEffect(() => {
    if (autoSaveRef.current) clearTimeout(autoSaveRef.current)
    autoSaveRef.current = setTimeout(() => {
      if (Object.keys(formData).length > 0 && !done) doAutoSave()
    }, 3000)
    return () => { if (autoSaveRef.current) clearTimeout(autoSaveRef.current) }
  }, [formData, done, doAutoSave])

  useEffect(() => {
    if (!token) return
    fetch(`/api/intake/${token}`)
      .then((r) => r.json())
      .then((d: PackageInfo & { error?: string }) => {
        if (d.error) { setError(d.error); setLoading(false); return }
        setPkg(d)
        const formNumbers = d.forms.map((f: { formNumber: string }) => f.formNumber)
        const configs = getIntakeConfigsForForms(formNumbers)
        const flat = flattenSections(configs)
        setSections(flat)
        setLoading(false)
      })
      .catch(() => { setError('Failed to load intake form.'); setLoading(false) })
  }, [token])

  function validateCurrentSection(): boolean {
    const current = sections[sectionIndex]
    if (!current) return true
    const errors = new Set<string>()
    for (const q of current.questions) {
      if (q.required && !formData[q.id]?.trim()) errors.add(q.id)
    }
    setValidationErrors(errors)
    return errors.size === 0
  }

  function goNext() {
    if (!validateCurrentSection()) return
    setSectionIndex((s) => Math.min(s + 1, sections.length))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function goBack() {
    setSectionIndex((s) => Math.max(s - 1, 0))
    setValidationErrors(new Set())
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      const res = await fetch(`/api/intake/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      const data = await res.json() as { ok?: boolean; error?: string }
      if (!res.ok) { setError(data.error || 'Submission failed.'); return }
      setDone(true)
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const totalSteps = sections.length + 1
  const isReviewStep = sectionIndex >= sections.length
  const currentSection = sections[sectionIndex] as FlatSection | undefined

  // ─── Render states ──────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-500 text-sm">Loading your intake form...</p>
        </div>
      </div>
    )
  }

  if (error && !pkg) {
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
            Check your email for DocuSeal signature requests within the next few minutes.
          </div>
        </div>
      </div>
    )
  }

  const sectionFormLabel = currentSection
    ? currentSection.formNumber.startsWith('_') ? null : `Form ${currentSection.formNumber}`
    : null

  return (
    <div className="min-h-screen bg-slate-50">
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
          <div className="flex items-center gap-3">
            {autoSaveMsg && <span className="text-xs text-slate-400">{autoSaveMsg}</span>}
            <div className="text-right">
              <p className="text-xs font-semibold text-slate-700">{pkg?.agent.name}</p>
              <p className="text-xs text-slate-400">{pkg?.agent.firmName}</p>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-6">
        <div className="bg-slate-800 rounded-2xl px-5 py-4 mb-6 text-white">
          <p className="text-xs text-slate-400 mb-0.5">Subject Property</p>
          <p className="font-semibold text-base">{pkg?.propertyAddress}</p>
          <p className="text-xs text-teal-400 mt-1">
            {pkg?.forms.length} form{pkg?.forms.length !== 1 ? 's' : ''} &middot; Expires {pkg ? new Date(pkg.expiresAt).toLocaleDateString() : ''}
          </p>
        </div>

        <ProgressBar current={sectionIndex} total={totalSteps} />

        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs text-teal-600 font-semibold bg-teal-50 px-2 py-1 rounded-full">
            {sectionIndex + 1} of {totalSteps}
          </span>
          {sectionFormLabel && (
            <span className="text-xs text-slate-400 bg-slate-100 px-2 py-1 rounded-full">{sectionFormLabel}</span>
          )}
        </div>
        <h2 className="text-lg font-bold text-slate-900 mb-1">
          {isReviewStep ? 'Review & Submit' : currentSection?.title}
        </h2>
        {!isReviewStep && currentSection?.description && (
          <p className="text-sm text-slate-500 mb-5">{currentSection.description}</p>
        )}
        {isReviewStep && <p className="text-sm text-slate-500 mb-5">Review your answers before submitting.</p>}

        <form onSubmit={handleSubmit}>
          {!isReviewStep && currentSection && (
            <div className="space-y-4">
              {currentSection.questions.map((q) => {
                if (q.type === 'yes-no-norep') {
                  return (
                    <div key={q.id}>
                      <YesNoNoRepField
                        question={q}
                        value={formData[q.id] ?? ''}
                        explanation={formData[`${q.id}_explain`] ?? ''}
                        onChangeValue={(v) => set(q.id, v)}
                        onChangeExplanation={(v) => set(`${q.id}_explain`, v)}
                      />
                      {validationErrors.has(q.id) && (
                        <p className="text-red-500 text-xs mt-1 ml-1">This field is required.</p>
                      )}
                    </div>
                  )
                }
                return (
                  <div key={q.id}>
                    <InputField question={q} value={formData[q.id] ?? ''} onChange={(v) => set(q.id, v)} />
                    {validationErrors.has(q.id) && (
                      <p className="text-red-500 text-xs mt-1 ml-1">This field is required.</p>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {isReviewStep && (
            <div className="space-y-4">
              {sections.map((sec, i) => (
                <div key={sec.id} className="border border-slate-200 rounded-xl overflow-hidden">
                  <div className="bg-slate-50 px-4 py-2.5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {isSectionComplete(sec, formData) ? (
                        <span className="w-5 h-5 rounded-full bg-teal-100 text-teal-600 flex items-center justify-center">
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        </span>
                      ) : (
                        <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center text-xs font-bold">!</span>
                      )}
                      <span className="text-sm font-semibold text-slate-700">{sec.title}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => { setSectionIndex(i); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
                      className="text-xs text-teal-600 hover:text-teal-800 font-medium"
                    >
                      Edit
                    </button>
                  </div>
                  <div className="divide-y divide-slate-100">
                    {sec.questions.map((q) => {
                      const val = formData[q.id]
                      if (!val) return null
                      return (
                        <div key={q.id} className="flex justify-between px-4 py-2.5 gap-4">
                          <span className="text-xs text-slate-400 shrink-0 max-w-[50%]">{q.label}</span>
                          <span className="text-sm font-medium text-slate-800 text-right truncate">{val}</span>
                        </div>
                      )
                    })}
                    <div className="px-4 py-2 text-xs text-slate-400">
                      {countAnswered(sec, formData)} of {sec.questions.length} answered
                    </div>
                  </div>
                </div>
              ))}

              <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-sm text-blue-800">
                By submitting, you confirm the information above is accurate. Your agent will use
                this to prepare transaction documents for your signature.
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">{error}</div>
              )}
            </div>
          )}

          <div className="flex gap-3 mt-8">
            {sectionIndex > 0 && (
              <button
                type="button"
                onClick={goBack}
                className="flex-1 border border-slate-200 text-slate-700 font-semibold py-4 rounded-xl text-base hover:bg-slate-50 active:bg-slate-100 transition"
              >
                &larr; Back
              </button>
            )}
            {!isReviewStep ? (
              <button
                type="button"
                onClick={goNext}
                className="flex-1 bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white font-semibold py-4 rounded-xl text-base transition"
              >
                Continue &rarr;
              </button>
            ) : (
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 bg-teal-600 hover:bg-teal-700 disabled:opacity-60 text-white font-bold py-4 rounded-xl text-base transition"
              >
                {submitting ? 'Submitting...' : 'Submit My Information'}
              </button>
            )}
          </div>
        </form>

        {sections.length > 3 && (
          <div className="mt-8 pt-6 border-t border-slate-100">
            <p className="text-xs text-slate-400 mb-3 font-medium">Jump to section:</p>
            <div className="flex flex-wrap gap-2">
              {sections.map((sec, i) => (
                <button
                  key={sec.id}
                  type="button"
                  onClick={() => { setSectionIndex(i); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
                  className={`text-xs px-3 py-1.5 rounded-full border transition ${
                    i === sectionIndex
                      ? 'bg-teal-600 text-white border-teal-600'
                      : isSectionComplete(sec, formData)
                      ? 'bg-teal-50 text-teal-700 border-teal-200'
                      : 'bg-white text-slate-500 border-slate-200 hover:border-teal-300'
                  }`}
                >
                  {sec.title}
                </button>
              ))}
              <button
                type="button"
                onClick={() => { setSectionIndex(sections.length); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
                className={`text-xs px-3 py-1.5 rounded-full border transition ${
                  isReviewStep
                    ? 'bg-teal-600 text-white border-teal-600'
                    : 'bg-white text-slate-500 border-slate-200 hover:border-teal-300'
                }`}
              >
                Review
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
