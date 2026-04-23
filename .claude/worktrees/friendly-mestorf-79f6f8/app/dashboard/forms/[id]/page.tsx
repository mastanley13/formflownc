'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'

type FormTemplate = {
  id: string
  formNumber: string
  formName: string
  category: string
  version: string
  isActive: boolean
  pdfFilePath: string
  fieldMappings: string
}

export default function EditFormPage() {
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const id = params.id

  const [form, setForm] = useState<FormTemplate | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')

  // Editable state
  const [formName, setFormName] = useState('')
  const [version, setVersion] = useState('')
  const [isActive, setIsActive] = useState(true)
  const [mappings, setMappings] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    fetch(`/api/forms/${id}`)
      .then((r) => r.json())
      .then((d: { form?: FormTemplate; error?: string }) => {
        if (!d.form) { setLoadError(d.error ?? 'Form not found.'); return }
        setForm(d.form)
        setFormName(d.form.formName)
        setVersion(d.form.version)
        setIsActive(d.form.isActive)
        try {
          setMappings(JSON.parse(d.form.fieldMappings) as Record<string, string>)
        } catch {
          setMappings({})
        }
      })
      .catch(() => setLoadError('Failed to load form template.'))
      .finally(() => setLoading(false))
  }, [id])

  async function handleSave() {
    setSaving(true)
    setSaveError('')
    setSaved(false)

    const res = await fetch(`/api/forms/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        formName: formName.trim(),
        version: version.trim(),
        isActive,
        fieldMappings: mappings,
      }),
    })
    const data = await res.json() as { error?: string }

    setSaving(false)

    if (!res.ok) {
      setSaveError(data.error ?? 'Save failed.')
      return
    }

    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  function addField() {
    setMappings((prev) => ({ ...prev, '': '' }))
  }

  function renameKey(oldKey: string, newKey: string) {
    setMappings((prev) => {
      const updated: Record<string, string> = {}
      for (const [k, v] of Object.entries(prev)) {
        updated[k === oldKey ? newKey : k] = v
      }
      return updated
    })
  }

  function removeKey(key: string) {
    setMappings((prev) => {
      const next = { ...prev }
      delete next[key]
      return next
    })
  }

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-slate-100 rounded w-1/3" />
          <div className="h-64 bg-slate-100 rounded-2xl" />
        </div>
      </div>
    )
  }

  if (loadError) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl p-6 text-center">
          <p className="font-semibold">{loadError}</p>
          <Link href="/dashboard/forms" className="mt-4 inline-block text-sm text-red-600 hover:underline">← Back to Forms</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <Link href="/dashboard/forms" className="text-slate-400 hover:text-slate-600 transition">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Edit Form {form?.formNumber}</h1>
          <p className="text-sm text-slate-500 mt-0.5">{form?.pdfFilePath}</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Metadata */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
          <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Metadata</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Form Name</label>
              <input
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                className="w-full border border-slate-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Version Year</label>
              <input
                value={version}
                onChange={(e) => setVersion(e.target.value)}
                className="w-full border border-slate-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsActive((v) => !v)}
              className={`relative w-11 h-6 rounded-full transition ${isActive ? 'bg-teal-600' : 'bg-slate-300'}`}
            >
              <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${isActive ? 'left-6' : 'left-1'}`} />
            </button>
            <span className="text-sm text-slate-700">{isActive ? 'Active — available for new packages' : 'Inactive — hidden from form selector'}</span>
          </div>
        </div>

        {/* Field Mappings */}
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
          <div className="bg-slate-50 border-b border-slate-100 px-5 py-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
              Field Mappings ({Object.keys(mappings).length})
            </h2>
            <button
              onClick={addField}
              className="text-xs text-teal-600 hover:text-teal-800 font-medium flex items-center gap-1"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
              </svg>
              Add field
            </button>
          </div>

          <div className="divide-y divide-slate-100 max-h-[480px] overflow-y-auto">
            {Object.entries(mappings).length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-8">No field mappings yet. Add one above.</p>
            ) : (
              Object.entries(mappings).map(([pdfField, canonical], i) => (
                <div key={`${pdfField}-${i}`} className="px-5 py-3 grid grid-cols-12 gap-3 items-center">
                  <div className="col-span-5">
                    <input
                      value={pdfField}
                      onChange={(e) => renameKey(pdfField, e.target.value)}
                      placeholder="PDF field name"
                      className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                  <div className="col-span-1 text-center text-slate-300 text-sm">→</div>
                  <div className="col-span-5">
                    <input
                      value={canonical}
                      onChange={(e) => setMappings((prev) => ({ ...prev, [pdfField]: e.target.value }))}
                      placeholder="canonical_key"
                      className={`w-full border rounded-lg px-3 py-1.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                        canonical ? 'border-teal-300 bg-teal-50 text-teal-800' : 'border-slate-200'
                      }`}
                    />
                  </div>
                  <div className="col-span-1 flex justify-end">
                    <button
                      onClick={() => removeKey(pdfField)}
                      className="text-slate-300 hover:text-red-500 transition"
                      title="Remove"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {saveError && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">{saveError}</div>
        )}

        <div className="flex items-center justify-between">
          <Link href="/dashboard/forms" className="text-sm text-slate-500 hover:text-slate-700 font-medium px-4 py-2.5 rounded-xl hover:bg-slate-100 transition">
            ← Cancel
          </Link>
          <button
            onClick={handleSave}
            disabled={saving}
            className={`font-semibold px-6 py-3 rounded-xl text-sm transition flex items-center gap-2 ${
              saved
                ? 'bg-emerald-600 text-white'
                : 'bg-teal-600 hover:bg-teal-700 disabled:opacity-60 text-white'
            }`}
          >
            {saving ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Saving…
              </>
            ) : saved ? '✓ Saved!' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  )
}
