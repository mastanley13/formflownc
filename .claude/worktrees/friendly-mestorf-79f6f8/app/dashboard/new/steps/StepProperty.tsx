import { useState, FormEvent } from 'react'
import type { WizardData } from '../page'

export default function StepProperty({
  data, update, onNext,
}: { data: WizardData; update: (p: Partial<WizardData>) => void; onNext: () => void }) {
  const [address, setAddress] = useState(data.propertyAddress)
  const [error, setError] = useState('')

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!address.trim()) { setError('Property address is required.'); return }
    update({ propertyAddress: address.trim() })
    onNext()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">Property Address</h2>
        <p className="text-sm text-slate-500 mt-1">Enter the full address of the subject property.</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5" htmlFor="address">
          Full Address
        </label>
        <input
          id="address"
          type="text"
          autoFocus
          required
          placeholder="123 Oak Street, New Bern, NC 28560"
          value={address}
          onChange={(e) => { setAddress(e.target.value); setError('') }}
          className="w-full border border-slate-300 rounded-xl px-4 py-3.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition text-base"
        />
        {error && <p className="text-red-600 text-sm mt-1.5">{error}</p>}
        <p className="text-xs text-slate-400 mt-2">
          This address will carry forward across all selected forms automatically.
        </p>
      </div>

      <div className="flex justify-end pt-2">
        <button type="submit" className="bg-teal-600 hover:bg-teal-700 text-white font-semibold px-6 py-3 rounded-xl text-sm transition">
          Continue →
        </button>
      </div>
    </form>
  )
}
