'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'
import { getCsrfToken } from '@/lib/csrf-client'

export default function DashboardNav({ agentName }: { agentName: string }) {
  const pathname = usePathname()
  const router = useRouter()
  const [menuOpen, setMenuOpen] = useState(false)

  async function handleLogout() {
    const csrfToken = await getCsrfToken()
    await fetch('/api/auth/logout', {
      method: 'POST',
      headers: { 'x-csrf-token': csrfToken },
    })
    router.push('/login')
    router.refresh()
  }

  const navLink = (href: string, label: string) => (
    <Link
      href={href}
      className={`text-sm font-medium px-3 py-1.5 rounded-lg transition ${
        pathname === href
          ? 'bg-teal-50 text-teal-700'
          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
      }`}
    >
      {label}
    </Link>
  )

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link href="/dashboard" className="flex items-center gap-2 shrink-0">
          <div className="w-7 h-7 rounded-lg bg-teal-600 flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <span className="font-bold text-slate-900 text-sm hidden sm:block">FormFlowNC</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden sm:flex items-center gap-1">
          {navLink('/dashboard', 'Packages')}
          {navLink('/dashboard/forms', 'Forms')}
          {navLink('/dashboard/new', 'New Package')}
        </nav>

        {/* Agent menu */}
        <div className="relative ml-auto">
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="flex items-center gap-2 text-sm text-slate-700 hover:text-slate-900"
          >
            <div className="w-7 h-7 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center font-semibold text-xs">
              {agentName.charAt(0).toUpperCase()}
            </div>
            <span className="hidden sm:block font-medium">{agentName}</span>
            <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-10 w-44 bg-white border border-slate-200 rounded-xl shadow-lg py-1 z-40">
              <Link
                href="/dashboard/settings"
                onClick={() => setMenuOpen(false)}
                className="block px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              >
                Settings
              </Link>
              <button
                onClick={handleLogout}
                className="w-full text-left px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              >
                Sign out
              </button>
            </div>
          )}
        </div>

        {/* Mobile menu */}
        <button
          onClick={() => setMenuOpen((v) => !v)}
          className="sm:hidden p-2 rounded-lg text-slate-500 hover:bg-slate-100"
          aria-label="Menu"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>

      {/* Mobile nav drawer */}
      {menuOpen && (
        <div className="sm:hidden border-t border-slate-100 bg-white px-4 py-3 space-y-1">
          {navLink('/dashboard', 'Packages')}
          {navLink('/dashboard/forms', 'Forms')}
          {navLink('/dashboard/new', 'New Package')}
          <button
            onClick={handleLogout}
            className="block w-full text-left text-sm font-medium px-3 py-1.5 rounded-lg text-red-600 hover:bg-red-50 transition"
          >
            Sign out
          </button>
        </div>
      )}
    </header>
  )
}
