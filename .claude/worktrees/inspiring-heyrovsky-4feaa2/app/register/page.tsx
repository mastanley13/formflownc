'use client'

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function RegisterPage() {
  const router = useRouter()
  const [form, setForm] = useState({
    name: '', email: '', password: '', phone: '',
    licenseNumber: '', firmName: '', firmAddress: '', firmPhone: '', firmLicense: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function update(key: string, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Registration failed.'); return }
      router.push('/dashboard')
      router.refresh()
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const field = (
    id: string, label: string, type = 'text', placeholder = '', required = false
  ) => (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1.5" htmlFor={id}>
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <input
        id={id} type={type} required={required} placeholder={placeholder}
        value={form[id as keyof typeof form]}
        onChange={(e) => update(id, e.target.value)}
        className="w-full border border-slate-300 rounded-lg px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition"
      />
    </div>
  )

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-teal-600 mb-4">
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Create Agent Account</h1>
          <p className="text-slate-500 text-sm mt-1">FormFlowNC — Invite only</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 space-y-5">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">{error}</div>
          )}

          <div className="pb-2 border-b border-slate-100">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Personal</p>
          </div>
          {field('name', 'Full Name', 'text', 'Chris Rayner', true)}
          {field('email', 'Email Address', 'email', 'chris@example.com', true)}
          {field('password', 'Password', 'password', 'At least 8 characters', true)}
          {field('phone', 'Phone', 'tel', '(252) 555-0100')}

          <div className="pb-2 border-b border-slate-100 pt-2">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">License & Firm</p>
          </div>
          {field('licenseNumber', 'NC License Number', 'text', 'NC-123456')}
          {field('firmName', 'Firm Name', 'text', 'Realty ONE Group Affinity')}
          {field('firmLicense', 'Firm License Number', 'text', 'C-12345')}
          {field('firmAddress', 'Firm Address', 'text', '123 Main St, New Bern, NC 28560')}
          {field('firmPhone', 'Firm Phone', 'tel', '(252) 555-0200')}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-teal-600 hover:bg-teal-700 disabled:opacity-60 text-white font-semibold rounded-lg px-4 py-3 text-sm transition"
          >
            {loading ? 'Creating account…' : 'Create Account'}
          </button>
        </form>

        <p className="text-center text-xs text-slate-400 mt-6">
          Already have an account?{' '}
          <Link href="/login" className="text-teal-600 hover:underline font-medium">Sign in</Link>
        </p>
      </div>
    </div>
  )
}
