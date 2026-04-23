'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import StepProperty from './steps/StepProperty'
import StepForms from './steps/StepForms'
import StepSigners from './steps/StepSigners'
import StepDetails from './steps/StepDetails'
import StepReview from './steps/StepReview'
import StepDone from './steps/StepDone'

export type Signer = { id: string; name: string; email: string; phone: string; role: string }
export type WizardData = {
  propertyAddress: string
  selectedForms: string[]
  signers: Signer[]
  agentData: Record<string, string>
  packageId: string
  clientLink: string
}

const STEPS = ['Property', 'Forms', 'Signers', 'Details', 'Review', 'Done'] as const

function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-0 mb-8">
      {STEPS.slice(0, -1).map((label, i) => (
        <div key={label} className="flex items-center">
          <div className={`flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold border-2 transition-all ${
            i < current
              ? 'bg-teal-600 border-teal-600 text-white'
              : i === current
              ? 'border-teal-600 text-teal-600 bg-white'
              : 'border-slate-200 text-slate-400 bg-white'
          }`}>
            {i < current ? (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              i + 1
            )}
          </div>
          <span className={`ml-2 text-xs font-medium hidden sm:block ${i === current ? 'text-teal-700' : 'text-slate-400'}`}>
            {label}
          </span>
          {i < STEPS.length - 2 && (
            <div className={`mx-3 h-0.5 w-6 sm:w-10 rounded ${i < current ? 'bg-teal-600' : 'bg-slate-200'}`} />
          )}
        </div>
      ))}
    </div>
  )
}

export default function NewPackagePage() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [data, setData] = useState<WizardData>({
    propertyAddress: '',
    selectedForms: [],
    signers: [],
    agentData: {},
    packageId: '',
    clientLink: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')

  const update = useCallback((patch: Partial<WizardData>) => {
    setData((prev) => ({ ...prev, ...patch }))
  }, [])

  const next = () => setStep((s) => Math.min(s + 1, STEPS.length - 1))
  const back = () => setStep((s) => Math.max(s - 1, 0))

  async function handleSubmit() {
    setSubmitting(true)
    setSubmitError('')
    try {
      const res = await fetch('/api/packages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          propertyAddress: data.propertyAddress,
          formsSelected: data.selectedForms,
          signers: data.signers,
          agentData: data.agentData,
        }),
      })
      const json = await res.json()
      if (!res.ok) { setSubmitError(json.error || 'Failed to create package.'); return }
      update({ packageId: json.package.id, clientLink: json.clientLink })
      next()
    } catch {
      setSubmitError('Network error. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const steps = [
    <StepProperty key="property" data={data} update={update} onNext={next} />,
    <StepForms key="forms" data={data} update={update} onNext={next} onBack={back} />,
    <StepSigners key="signers" data={data} update={update} onNext={next} onBack={back} />,
    <StepDetails key="details" data={data} update={update} onNext={next} onBack={back} />,
    <StepReview key="review" data={data} onSubmit={handleSubmit} onBack={back} submitting={submitting} error={submitError} />,
    <StepDone key="done" data={data} onNew={() => { setStep(0); setData({ propertyAddress: '', selectedForms: [], signers: [], agentData: {}, packageId: '', clientLink: '' }) }} onDashboard={() => router.push('/dashboard')} />,
  ]

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">New Package</h1>
        <p className="text-sm text-slate-500 mt-0.5">Generate a client intake link for your transaction</p>
      </div>

      {step < STEPS.length - 1 && <StepIndicator current={step} total={STEPS.length - 1} />}

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 sm:p-8">
        {steps[step]}
      </div>
    </div>
  )
}
