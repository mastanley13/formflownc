'use client'

import { useState, useRef, FormEvent, ChangeEvent } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

type DetectedField = {
  name: string
  type: string
  options?: string[]
  suggestedCanonical: string | null
}

type UploadResult = {
  formNumber: string
  formName: string
  category: string
  version: string
  pdfFilePath: string
  fieldCount: number
  fields: DetectedField[]
}

const CATEGORY_OPTIONS = ['Seller', 'Buyer', 'Listing', 'Disclosure', 'Agency', 'Management', 'Offer']

export default function NewFormPage() {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)

  // Step 1 state
  const [step, setStep] = useState<1 | 2>(1)
  const [formNumber, setFormNumber] = useState('')
  const [formName, setFormName] = useState('')
  const [version, setVersion] = useState('2025')
  const [categories, setCategories] = useState<string[]>([])
  const [pdfFile, setPdfFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')

  // Step 2 state
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null)
  const [mappings, setMappings] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')

  function toggleCategory(cat: string) {
    setCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    )
  }

  async function handleUpload(e: FormEvent) {
    e.preventDefault()
    if (!pdfFile) { setUploadError('Please select a PDF file.'); return }
    if (!formNumber.trim()) { setUploadError('Form number is required.'); return }
    if (!formName.trim()) { setUploadError('Form name is required.'); return }

    setUploading(true)
    setUploadError('')

    const fd = new FormData()
    fd.append('pdf', pdfFile)
    fd.append('formNumber', formNumber.trim())
    fd.append('formName', formName.trim())
    fd.append('category', JSON.stringify(categories))
    fd.append('version', version.trim() || '2025')

    const res = await fetch('/api/forms/upload', { method: 'POST', body: fd })
    const data = await res.json() as UploadResult & { error?: string }

    setUploading(false)

    if (!res.ok) {
      setUploadError(data.error ?? 'Upload failed.')
      return
    }

    // Pre-fill mappings from suggestions
    const initial: Record<string, string> = {}
    for (const f of data.fields) {
      initial[f.name] = f.suggestedCanonical ?? ''
    }
    setMappings(initial)
    setUploadResult(data)
    setStep(2)
  }

  async function handleSave() {
    if (!uploadResult) return
    setSaving(true)
    setSaveError('')

    const fieldMappings: Record<string, string> = {}
    for (const [pdfField, canonical] of Object.entries(mappings)) {
      if (canonical.trim()) fieldMappings[pdfField] = canonical.trim()
    }

    const res = await fetch('/api/forms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        formNumber: uploadResult.formNumber,
        formName: uploadResult.formName,
        category: uploadResult.category,
        version: uploadResult.version,
        pdfFilePath: uploadResult.pdfFilePath,
        fieldMappings,
      }),
    })
    const data = await res.json() as { error?: string }

    setSaving(false)

    if (!res.ok) {
      setSaveError(data.error ?? 'Save failed.')
      return
    }

    router.push('/dashboard/forms')
  }

  const fieldTypeIcon = (type: string) => {
    if (type === 'checkbox') return '☑'
    if (type === 'radio') return '◉'
    if (type === 'dropdown') return '▾'
    return '▭'
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
          <h1 className="text-2xl font-bold text-slate-900">Upload Form Template</h1>
          <p className="text-sm text-slate-500 mt-0.5">Step {step} of 2 — {step === 1 ? 'Upload PDF' : 'Map Fields'}</p>
        </div>
      </div>

      {/* Progress */}
      <div className="flex items-center gap-2 mb-8">
        {[1, 2].map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
              s < step ? 'bg-teal-600 text-white' : s === step ? 'bg-teal-100 text-teal-700 border-2 border-teal-600' : 'bg-slate-100 text-slate-400'
            }`}>{s < step ? '✓' : s}</div>
            {s < 2 && <div className={`h-0.5 w-16 ${s < step ? 'bg-teal-600' : 'bg-slate-200'}`} />}
          </div>
        ))}
        <span className="ml-2 text-sm text-slate-500">{step === 1 ? 'Upload & metadata' : 'Review & map fields'}</span>
      </div>

      {/* Step 1 */}
      {step === 1 && (
        <form onSubmit={handleUpload} className="bg-white border border-slate-200 rounded-2xl p-6 space-y-6">
          {/* PDF upload */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">PDF File <span className="text-red-500">*</span></label>
            <div
              className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center cursor-pointer hover:border-teal-400 hover:bg-teal-50 transition"
              onClick={() => fileRef.current?.click()}
            >
              {pdfFile ? (
                <div className="text-sm text-teal-700 font-medium">{pdfFile.name} ({(pdfFile.size / 1024).toFixed(0)} KB)</div>
              ) : (
                <>
                  <svg className="w-8 h-8 text-slate-300 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <p className="text-sm text-slate-500">Click to select a fillable PDF</p>
                  <p className="text-xs text-slate-400 mt-1">AcroForm fields will be auto-detected</p>
                </>
              )}
            </div>
            <input
              ref={fileRef}
              type="file"
              accept=".pdf"
              className="hidden"
              onChange={(e: ChangeEvent<HTMLInputElement>) => {
                const f = e.target.files?.[0] ?? null
                setPdfFile(f)
                setUploadError('')
              }}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Form Number <span className="text-red-500">*</span></label>
              <input
                value={formNumber}
                onChange={(e) => setFormNumber(e.target.value)}
                placeholder="e.g. 101"
                className="w-full border border-slate-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Version Year</label>
              <input
                value={version}
                onChange={(e) => setVersion(e.target.value)}
                placeholder="2025"
                className="w-full border border-slate-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Form Name <span className="text-red-500">*</span></label>
            <input
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              placeholder="e.g. Exclusive Right to Sell Listing Agreement"
              className="w-full border border-slate-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Categories</label>
            <div className="flex flex-wrap gap-2">
              {CATEGORY_OPTIONS.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => toggleCategory(cat)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium border transition ${
                    categories.includes(cat)
                      ? 'bg-teal-600 text-white border-teal-600'
                      : 'bg-white text-slate-600 border-slate-300 hover:border-teal-400'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {uploadError && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">{uploadError}</div>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={uploading}
              className="bg-teal-600 hover:bg-teal-700 disabled:opacity-60 text-white font-semibold px-6 py-3 rounded-xl text-sm transition flex items-center gap-2"
            >
              {uploading ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Detecting fields…
                </>
              ) : 'Upload & Detect Fields →'}
            </button>
          </div>
        </form>
      )}

      {/* Step 2 — Field mapping */}
      {step === 2 && uploadResult && (
        <div className="space-y-6">
          <div className="bg-teal-50 border border-teal-200 rounded-xl px-4 py-3 text-sm text-teal-800">
            <strong>{uploadResult.fieldCount}</strong> AcroForm field{uploadResult.fieldCount !== 1 ? 's' : ''} detected in <strong>{uploadResult.formNumber}</strong>.
            Map each PDF field name to a canonical data key. Leave blank to skip.
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
            <div className="bg-slate-50 border-b border-slate-100 px-5 py-3 grid grid-cols-12 gap-4">
              <div className="col-span-1 text-xs font-semibold text-slate-400 uppercase">Type</div>
              <div className="col-span-4 text-xs font-semibold text-slate-400 uppercase">PDF Field Name</div>
              <div className="col-span-7 text-xs font-semibold text-slate-400 uppercase">Canonical Key</div>
            </div>
            <div className="divide-y divide-slate-100 max-h-[480px] overflow-y-auto">
              {uploadResult.fields.map((f) => (
                <div key={f.name} className="px-5 py-3 grid grid-cols-12 gap-4 items-center hover:bg-slate-50">
                  <div className="col-span-1 text-base text-slate-400" title={f.type}>{fieldTypeIcon(f.type)}</div>
                  <div className="col-span-4">
                    <p className="text-sm font-mono text-slate-700 truncate">{f.name}</p>
                    {f.options && f.options.length > 0 && (
                      <p className="text-xs text-slate-400 mt-0.5 truncate">{f.options.slice(0, 3).join(', ')}{f.options.length > 3 ? '…' : ''}</p>
                    )}
                  </div>
                  <div className="col-span-7">
                    <input
                      value={mappings[f.name] ?? ''}
                      onChange={(e) => setMappings((prev) => ({ ...prev, [f.name]: e.target.value }))}
                      placeholder={f.suggestedCanonical ?? 'canonical_key'}
                      className={`w-full border rounded-lg px-3 py-1.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-teal-500 transition ${
                        mappings[f.name] ? 'border-teal-300 bg-teal-50 text-teal-800' : 'border-slate-200 text-slate-700'
                      }`}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {saveError && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">{saveError}</div>
          )}

          <div className="flex items-center justify-between">
            <button
              onClick={() => setStep(1)}
              className="text-sm text-slate-500 hover:text-slate-700 font-medium px-4 py-2.5 rounded-xl hover:bg-slate-100 transition"
            >
              ← Back
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="bg-teal-600 hover:bg-teal-700 disabled:opacity-60 text-white font-semibold px-6 py-3 rounded-xl text-sm transition flex items-center gap-2"
            >
              {saving ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Saving…
                </>
              ) : 'Save Template'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
