'use client'

import { useState } from 'react'
import { v4 as uuidv4 } from 'uuid'
import type { WizardData, Signer } from '../page'

const ROLES = [
  { value: 'seller', label: 'Seller' },
  { value: 'buyer', label: 'Buyer' },
  { value: 'co_agent', label: 'Co-Agent' },
]

const BLANK_SIGNER: Omit<Signer, 'id'> = { name: '', email: '', phone: '', role: 'seller' }

function SignerForm({
  onSave, onCancel, initial,
}: { onSave: (s: Signer) => void; onCancel: () => void; initial?: Signer }) {
  const [form, setForm] = useState<Omit<Signer, 'id'>>(initial ?? { ...BLANK_SIGNER })
  const [error, setError] = useState('')

  function update(k: string, v: string) { setForm((p) => ({ ...p, [k]: v })) }

  function save() {
    if (!form.name.trim()) { setError('Name is required.'); return }
    if (!form.email.trim() || !form.email.includes('@')) { setError('Valid email is required.'); return }
    onSave({ ...form, id: initial?.id ?? uuidv4() })
  }

  const inp = (id: keyof typeof BLANK_SIGNER, label: string, type = 'text', placeholder = '', required = false) => (
    <div>
      <label className="block text-xs font-medium text-slate-600 mb-1" htmlFor={id}>
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <input
        id={id} type={type} placeholder={placeholder}
        value={form[id]}
        onChange={(e) => update(id, e.target.value)}
        className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition"
      />
    </div>
  )

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {inp('name', 'Full Legal Name', 'text', 'Jane Smith', true)}
        {inp('email', 'Email Address', 'email', 'jane@email.com', true)}
        {inp('phone', 'Phone', 'tel', '(252) 555-0100')}
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Role<span className="text-red-500 ml-0.5">*</span></label>
          <select
            value={form.role}
            onChange={(e) => update('role', e.target.value)}
            className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition bg-white"
          >
            {ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
          </select>
        </div>
      </div>
      {error && <p className="text-red-600 text-xs">{error}</p>}
      <div className="flex gap-2 justify-end pt-1">
        <button onClick={onCancel} className="text-sm text-slate-500 hover:text-slate-700 px-3 py-2 rounded-lg hover:bg-slate-100 transition">Cancel</button>
        <button onClick={save} className="text-sm bg-teal-600 hover:bg-teal-700 text-white font-semibold px-4 py-2 rounded-lg transition">Add Signer</button>
      </div>
    </div>
  )
}

export default function StepSigners({
  data, update, onNext, onBack,
}: { data: WizardData; update: (p: Partial<WizardData>) => void; onNext: () => void; onBack: () => void }) {
  const [signers, setSigners] = useState<Signer[]>(data.signers)
  const [adding, setAdding] = useState(false)
  const [error, setError] = useState('')

  function addSigner(s: Signer) {
    setSigners((prev) => [...prev, s])
    setAdding(false)
    setError('')
  }

  function removeSigner(id: string) {
    setSigners((prev) => prev.filter((s) => s.id !== id))
  }

  function handleContinue() {
    if (signers.length === 0) { setError('At least one signer is required.'); return }
    update({ signers })
    onNext()
  }

  const roleLabel = (role: string) =>
    ROLES.find((r) => r.value === role)?.label ?? role

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">Signers</h2>
        <p className="text-sm text-slate-500 mt-1">Add everyone who will sign documents in this transaction.</p>
      </div>

      {/* Carry-forward note */}
      <div className="bg-teal-50 border border-teal-200 rounded-xl px-4 py-3 text-sm text-teal-800">
        <strong>Smart carry-forward:</strong> Signer names will be pre-filled on all relevant forms automatically.
      </div>

      {/* Existing signers */}
      {signers.length > 0 && (
        <div className="space-y-2">
          {signers.map((s) => (
            <div key={s.id} className="flex items-center gap-3 bg-white border border-slate-200 rounded-xl px-4 py-3">
              <div className="w-8 h-8 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center font-semibold text-xs shrink-0">
                {s.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-slate-900 text-sm truncate">{s.name}</p>
                <p className="text-xs text-slate-500 truncate">{s.email} · <span className="text-teal-600">{roleLabel(s.role)}</span></p>
              </div>
              <button onClick={() => removeSigner(s.id)} className="text-slate-400 hover:text-red-500 transition p-1" title="Remove">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add signer form */}
      {adding ? (
        <SignerForm onSave={addSigner} onCancel={() => setAdding(false)} />
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="w-full border-2 border-dashed border-slate-200 hover:border-teal-400 text-slate-500 hover:text-teal-700 rounded-xl py-3.5 text-sm font-medium transition flex items-center justify-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
          </svg>
          Add Signer
        </button>
      )}

      {error && <p className="text-red-600 text-sm">{error}</p>}

      <div className="flex items-center justify-between pt-2">
        <button onClick={onBack} className="text-sm text-slate-500 hover:text-slate-700 font-medium px-4 py-2.5 rounded-xl hover:bg-slate-100 transition">← Back</button>
        <button onClick={handleContinue} className="bg-teal-600 hover:bg-teal-700 text-white font-semibold px-6 py-2.5 rounded-xl text-sm transition">Continue →</button>
      </div>
    </div>
  )
}
