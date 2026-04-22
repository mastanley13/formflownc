'use client'

import { useState } from 'react'

export default function CopyLinkButton({ token }: { token: string }) {
  const [copied, setCopied] = useState(false)

  async function copy() {
    const url = `${window.location.origin}/intake/${token}`
    try {
      await navigator.clipboard.writeText(url)
    } catch {
      const el = document.createElement('textarea')
      el.value = url
      document.body.appendChild(el)
      el.select()
      document.execCommand('copy')
      document.body.removeChild(el)
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  return (
    <button
      onClick={copy}
      className={`text-xs font-medium px-3 py-1.5 rounded-lg border transition ${
        copied
          ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
          : 'text-teal-600 border-teal-200 hover:bg-teal-50 hover:text-teal-700'
      }`}
    >
      {copied ? '✓ Copied' : 'Copy Link'}
    </button>
  )
}
