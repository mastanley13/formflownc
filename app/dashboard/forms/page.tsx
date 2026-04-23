'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { getCsrfToken } from '@/lib/csrf-client'

type FormTemplate = {
  id: string
  formNumber: string
  formName: string
  category: string
  version: string
  isActive: boolean
  pdfFilePath: string
  uploadedAt: string
}

export default function FormsPage() {
  const [forms, setForms] = useState<FormTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [toggling, setToggling] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/forms')
      .then((r) => r.json())
      .then((d) => setForms(d.forms ?? []))
      .finally(() => setLoading(false))
  }, [])

  async function toggleActive(form: FormTemplate) {
    setToggling(form.id)
    const csrfToken = await getCsrfToken()
    const res = await fetch(`/api/forms/${form.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'x-csrf-token': csrfToken },
      body: JSON.stringify({ isActive: !form.isActive }),
    })
    if (res.ok) {
      setForms((prev) =>
        prev.map((f) => (f.id === form.id ? { ...f, isActive: !f.isActive } : f))
      )
    }
    setToggling(null)
  }

  async function deleteForm(form: FormTemplate) {
    if (!confirm(`Delete form ${form.formNumber} — ${form.formName}? This cannot be undone.`)) return
    const csrfToken = await getCsrfToken()
    const res = await fetch(`/api/forms/${form.id}`, {
      method: 'DELETE',
      headers: { 'x-csrf-token': csrfToken },
    })
    if (res.ok) {
      setForms((prev) => prev.filter((f) => f.id !== form.id))
    }
  }

  const categoryLabel = (raw: string) => {
    try {
      const parsed = JSON.parse(raw)
      return Array.isArray(parsed) ? parsed.join(', ') : String(parsed)
    } catch {
      return raw
    }
  }

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
        <div className="animate-pulse space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-slate-100 rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Form Templates</h1>
          <p className="text-sm text-slate-500 mt-1">{forms.length} template{forms.length !== 1 ? 's' : ''} loaded</p>
        </div>
        <Link
          href="/dashboard/forms/new"
          className="inline-flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Upload PDF
        </Link>
      </div>

      {forms.length === 0 ? (
        <div className="text-center py-20 border-2 border-dashed border-slate-200 rounded-2xl">
          <svg className="w-12 h-12 text-slate-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-slate-500 font-medium">No form templates yet</p>
          <p className="text-slate-400 text-sm mt-1">Upload NC REALTOR PDF forms to get started.</p>
          <Link
            href="/dashboard/forms/new"
            className="mt-4 inline-flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition"
          >
            Upload your first form
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="text-left px-5 py-3 font-semibold text-slate-500 text-xs uppercase tracking-wide">Form</th>
                <th className="text-left px-5 py-3 font-semibold text-slate-500 text-xs uppercase tracking-wide hidden md:table-cell">Category</th>
                <th className="text-left px-5 py-3 font-semibold text-slate-500 text-xs uppercase tracking-wide hidden sm:table-cell">Version</th>
                <th className="text-left px-5 py-3 font-semibold text-slate-500 text-xs uppercase tracking-wide">Status</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {forms.map((form) => (
                <tr key={form.id} className="hover:bg-slate-50 transition">
                  <td className="px-5 py-4">
                    <div className="font-semibold text-slate-900">{form.formNumber}</div>
                    <div className="text-slate-500 text-xs mt-0.5 truncate max-w-xs">{form.formName}</div>
                  </td>
                  <td className="px-5 py-4 text-slate-600 hidden md:table-cell">
                    {categoryLabel(form.category)}
                  </td>
                  <td className="px-5 py-4 text-slate-600 hidden sm:table-cell">{form.version}</td>
                  <td className="px-5 py-4">
                    <button
                      onClick={() => toggleActive(form)}
                      disabled={toggling === form.id}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition ${
                        form.isActive
                          ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                          : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${form.isActive ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                      {form.isActive ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/dashboard/forms/${form.id}`}
                        className="text-xs text-teal-600 hover:text-teal-800 font-medium"
                      >
                        Edit mappings
                      </Link>
                      <button
                        onClick={() => deleteForm(form)}
                        className="text-xs text-red-500 hover:text-red-700 font-medium"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
