'use client'

import { useEffect, useState, FormEvent } from 'react'
import { getCsrfToken } from '@/lib/csrf-client'

type Agent = {
  id: string
  email: string
  name: string
  phone: string | null
  licenseNumber: string | null
  firmName: string | null
  firmAddress: string | null
  firmPhone: string | null
  firmLicense: string | null
}

function Field({ id, label, value, onChange, type = 'text', placeholder = '' }: {
  id: string; label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1.5" htmlFor={id}>{label}</label>
      <input
        id={id}
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        autoComplete={type === 'password' ? 'off' : undefined}
        className="w-full border border-slate-300 rounded-xl px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition"
      />
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 space-y-4">
      <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">{title}</h2>
      {children}
    </div>
  )
}

export default function SettingsPage() {
  const [agent, setAgent] = useState<Agent | null>(null)
  const [loading, setLoading] = useState(true)
  // Profile fields
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [licenseNumber, setLicenseNumber] = useState('')

  // Firm fields
  const [firmName, setFirmName] = useState('')
  const [firmAddress, setFirmAddress] = useState('')
  const [firmPhone, setFirmPhone] = useState('')
  const [firmLicense, setFirmLicense] = useState('')

  // Password fields
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const [profileSaving, setProfileSaving] = useState(false)
  const [profileMsg, setProfileMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [pwSaving, setPwSaving] = useState(false)
  const [pwMsg, setPwMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    fetch('/api/auth/me').then((r) => r.json()).then((agentData) => {
      const a = (agentData as { agent?: Agent }).agent
      if (a) {
        setAgent(a)
        setName(a.name)
        setPhone(a.phone ?? '')
        setLicenseNumber(a.licenseNumber ?? '')
        setFirmName(a.firmName ?? '')
        setFirmAddress(a.firmAddress ?? '')
        setFirmPhone(a.firmPhone ?? '')
        setFirmLicense(a.firmLicense ?? '')
      }
    }).finally(() => setLoading(false))
  }, [])

  async function saveProfile(e: FormEvent) {
    e.preventDefault()
    setProfileSaving(true)
    setProfileMsg(null)

    const csrfToken = await getCsrfToken()
    const res = await fetch('/api/auth/me', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'x-csrf-token': csrfToken },
      body: JSON.stringify({ name, phone, licenseNumber, firmName, firmAddress, firmPhone, firmLicense }),
    })
    const data = await res.json() as { agent?: Agent; error?: string }
    setProfileSaving(false)

    if (!res.ok) {
      setProfileMsg({ type: 'error', text: data.error ?? 'Save failed.' })
    } else {
      if (data.agent) setAgent(data.agent)
      setProfileMsg({ type: 'success', text: 'Profile saved successfully.' })
    }
  }

  async function changePassword(e: FormEvent) {
    e.preventDefault()
    if (newPassword !== confirmPassword) {
      setPwMsg({ type: 'error', text: 'New passwords do not match.' })
      return
    }
    if (newPassword.length < 8) {
      setPwMsg({ type: 'error', text: 'Password must be at least 8 characters.' })
      return
    }

    setPwSaving(true)
    setPwMsg(null)

    const csrfToken = await getCsrfToken()
    const res = await fetch('/api/auth/me', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'x-csrf-token': csrfToken },
      body: JSON.stringify({ currentPassword, newPassword }),
    })
    const data = await res.json() as { error?: string }
    setPwSaving(false)

    if (!res.ok) {
      setPwMsg({ type: 'error', text: data.error ?? 'Password change failed.' })
    } else {
      setPwMsg({ type: 'success', text: 'Password changed successfully.' })
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    }
  }

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10 animate-pulse space-y-4">
        <div className="h-8 bg-slate-100 rounded w-1/4" />
        <div className="h-48 bg-slate-100 rounded-2xl" />
        <div className="h-48 bg-slate-100 rounded-2xl" />
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
        <p className="text-sm text-slate-500 mt-1">
          Your profile info is pre-filled into transaction documents automatically.
        </p>
      </div>

      <div className="space-y-6">
        {/* Account info (read-only) */}
        <Section title="Account">
          <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
            <p className="text-xs text-slate-400 mb-0.5">Email address</p>
            <p className="text-sm font-medium text-slate-900">{agent?.email}</p>
          </div>
          <p className="text-xs text-slate-400">Email cannot be changed. Contact support if needed.</p>
        </Section>

        {/* Profile */}
        <form onSubmit={saveProfile}>
          <Section title="Agent Profile">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field id="name" label="Full Name" value={name} onChange={setName} placeholder="Chris Rayner" />
              <Field id="phone" label="Phone" value={phone} onChange={setPhone} placeholder="(252) 555-0100" type="tel" />
            </div>
            <Field id="licenseNumber" label="NC License Number" value={licenseNumber} onChange={setLicenseNumber} placeholder="307456" />

            <hr className="border-slate-100" />

            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Firm Information</p>
            <Field id="firmName" label="Firm / Brokerage Name" value={firmName} onChange={setFirmName} placeholder="Realty ONE Group Affinity" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field id="firmPhone" label="Firm Phone" value={firmPhone} onChange={setFirmPhone} placeholder="(252) 555-0200" type="tel" />
              <Field id="firmLicense" label="Firm License Number" value={firmLicense} onChange={setFirmLicense} placeholder="C-32419" />
            </div>
            <Field id="firmAddress" label="Firm Address" value={firmAddress} onChange={setFirmAddress} placeholder="2809 Neuse Blvd, New Bern, NC" />

            {profileMsg && (
              <div className={`rounded-xl px-4 py-3 text-sm ${
                profileMsg.type === 'success'
                  ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                  : 'bg-red-50 border border-red-200 text-red-700'
              }`}>
                {profileMsg.text}
              </div>
            )}

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={profileSaving}
                className="bg-teal-600 hover:bg-teal-700 disabled:opacity-60 text-white font-semibold px-6 py-3 rounded-xl text-sm transition min-w-[120px]"
              >
                {profileSaving ? 'Saving…' : 'Save Profile'}
              </button>
            </div>
          </Section>
        </form>

        {/* Password */}
        <form onSubmit={changePassword}>
          <Section title="Change Password">
            <Field id="currentPassword" label="Current Password" value={currentPassword} onChange={setCurrentPassword} type="password" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field id="newPassword" label="New Password" value={newPassword} onChange={setNewPassword} type="password" placeholder="8+ characters" />
              <Field id="confirmPassword" label="Confirm New Password" value={confirmPassword} onChange={setConfirmPassword} type="password" />
            </div>

            {pwMsg && (
              <div className={`rounded-xl px-4 py-3 text-sm ${
                pwMsg.type === 'success'
                  ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                  : 'bg-red-50 border border-red-200 text-red-700'
              }`}>
                {pwMsg.text}
              </div>
            )}

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={pwSaving}
                className="bg-slate-700 hover:bg-slate-800 disabled:opacity-60 text-white font-semibold px-6 py-3 rounded-xl text-sm transition min-w-[160px]"
              >
                {pwSaving ? 'Changing…' : 'Change Password'}
              </button>
            </div>
          </Section>
        </form>
      </div>
    </div>
  )
}
