'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function DashboardNav({ agentName }: { agentName: string }) {
  const router = useRouter()

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
  }

  return (
    <header className="bg-blue-950 text-white shadow-sm">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-teal-500 flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <span className="font-bold text-sm tracking-wide">FormFlowNC</span>
        </Link>

        <div className="flex items-center gap-4">
          <span className="text-blue-200 text-sm hidden sm:block">{agentName}</span>
          <button
            onClick={logout}
            className="text-blue-200 hover:text-white text-sm transition-colors"
          >
            Sign out
          </button>
        </div>
      </div>
    </header>
  )
}
