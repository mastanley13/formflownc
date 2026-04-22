'use client'

import { useState } from 'react'
import type { WizardData } from '../page'

export default function StepDone({
  data, onNew, onDashboard,
}: { data: WizardData; onNew: () => void; onDashboard: () => void }) {
  const [copied, setCopied] = useState(false)

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(data.clientLink)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch {
      // Fallback for older browsers
      const el = document.createElement('textarea')
      el.value = data.clientLink
      document.body.appendChild(el)
      el.select()
      document.execCommand('copy')
      document.body.removeChild(el)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    }
  }

  return (
    <div className="text-center space-y-6 py-4">
      <div className="flex items-center justify-center">
        <div className="w-16 h-16 rounded-full bg-teal-100 flex items-center justify-center">
          <svg className="w-8 h-8 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
      </div>

      <div>
        <h2 className="text-xl font-bold text-slate-900">Package Created!</h2>
        <p className="text-slate-500 text-sm mt-1.5">
          Send the link below to your client — it expires in <strong>7 days</strong>.
        </p>
      </div>

      {/* Link display */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-left">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Client Intake Link</p>
        <div className="flex items-center gap-2">
          <code className="flex-1 text-xs text-teal-700 font-mono bg-white border border-slate-200 rounded-lg px-3 py-2 truncate">
            {data.clientLink}
          </code>
          <button
            onClick={copyLink}
            className={`shrink-0 text-sm font-semibold px-4 py-2 rounded-lg border transition ${
              copied
                ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                : 'bg-white text-teal-700 border-teal-300 hover:bg-teal-50'
            }`}
          >
            {copied ? '✓ Copied!' : 'Copy'}
          </button>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-sm text-blue-800 text-left">
        <strong>Property:</strong> {data.propertyAddress}<br />
        <strong>Client signers:</strong> {data.signers.map((s) => s.name).join(', ')}
      </div>

      <div className="flex flex-col sm:flex-row gap-3 pt-2">
        <button
          onClick={copyLink}
          className="flex-1 bg-teal-600 hover:bg-teal-700 text-white font-semibold py-3 rounded-xl text-sm transition"
        >
          {copied ? '✓ Link Copied!' : '📋 Copy Link to Clipboard'}
        </button>
        <button
          onClick={onDashboard}
          className="flex-1 border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold py-3 rounded-xl text-sm transition"
        >
          View Dashboard
        </button>
      </div>

      <button onClick={onNew} className="text-sm text-slate-400 hover:text-slate-600 underline transition">
        Create another package
      </button>
    </div>
  )
}
