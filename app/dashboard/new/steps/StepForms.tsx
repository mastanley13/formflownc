'use client'

import { useState, useEffect } from 'react'
import type { WizardData } from '../page'

type FormTemplate = {
  id: string
  formNumber: string
  formName: string
  category: string // JSON array string
}

const CATEGORY_TABS = ['All', 'Seller', 'Buyer', 'Agency', 'Disclosure', 'Management'] as const
type Tab = typeof CATEGORY_TABS[number]

export default function StepForms({
  data, update, onNext, onBack,
}: { data: WizardData; update: (p: Partial<WizardData>) => void; onNext: () => void; onBack: () => void }) {
  const [forms, setForms] = useState<FormTemplate[]>([])
  const [selected, setSelected] = useState<Set<string>>(new Set(data.selectedForms))
  const [activeTab, setActiveTab] = useState<Tab>('All')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/forms')
      .then((r) => r.json())
      .then((d) => { setForms(d.forms || []); setLoading(false) })
      .catch(() => { setError('Failed to load forms.'); setLoading(false) })
  }, [])

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const filtered = forms.filter((f) => {
    if (activeTab === 'All') return true
    try {
      const cats: string[] = JSON.parse(f.category)
      return cats.some((c) => c.toLowerCase() === activeTab.toLowerCase())
    } catch { return false }
  })

  function handleContinue() {
    if (selected.size === 0) { setError('Select at least one form.'); return }
    update({ selectedForms: [...selected] })
    onNext()
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">Select Forms</h2>
        <p className="text-sm text-slate-500 mt-1">Choose the NC REALTOR forms for this transaction.</p>
      </div>

      {/* Category tabs */}
      <div className="flex gap-1 overflow-x-auto pb-1 -mx-1 px-1">
        {CATEGORY_TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`shrink-0 text-xs font-semibold px-3 py-1.5 rounded-full border transition ${
              activeTab === tab
                ? 'bg-teal-600 text-white border-teal-600'
                : 'bg-white text-slate-600 border-slate-200 hover:border-teal-300 hover:text-teal-700'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Form list */}
      {loading ? (
        <div className="text-center py-10 text-slate-400 text-sm">Loading forms…</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-10 text-slate-400 text-sm">No forms in this category.</div>
      ) : (
        <div className="space-y-2">
          {filtered.map((form) => {
            const isSelected = selected.has(form.id)
            let cats: string[] = []
            try { cats = JSON.parse(form.category) } catch { /* */ }

            return (
              <label
                key={form.id}
                className={`flex items-start gap-4 p-4 rounded-xl border cursor-pointer transition ${
                  isSelected ? 'border-teal-500 bg-teal-50' : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => toggle(form.id)}
                  className="mt-0.5 w-4 h-4 rounded accent-teal-600 shrink-0"
                />
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-slate-900 text-sm">Form {form.formNumber}</span>
                    {cats.map((c) => (
                      <span key={c} className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">{c}</span>
                    ))}
                  </div>
                  <p className="text-sm text-slate-600 mt-0.5">{form.formName}</p>
                </div>
              </label>
            )
          })}
        </div>
      )}

      {error && <p className="text-red-600 text-sm">{error}</p>}

      <div className="flex items-center justify-between pt-2">
        <button onClick={onBack} className="text-sm text-slate-500 hover:text-slate-700 font-medium px-4 py-3 rounded-xl hover:bg-slate-100 transition">
          ← Back
        </button>
        <div className="flex items-center gap-3">
          {selected.size > 0 && (
            <span className="text-sm text-teal-700 font-medium">{selected.size} form{selected.size > 1 ? 's' : ''} selected</span>
          )}
          <button onClick={handleContinue} className="bg-teal-600 hover:bg-teal-700 text-white font-semibold px-6 py-3 rounded-xl text-sm transition">
            Continue →
          </button>
        </div>
      </div>
    </div>
  )
}
