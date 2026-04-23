import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import LogoutButton from './logout-button'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession()
  if (!session) redirect('/login')

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-slate-900 px-4 sm:px-6 py-3 flex items-center justify-between">
        <h1 className="text-lg font-bold text-teal-400">FormFlowNC</h1>
        <div className="flex items-center gap-4">
          <span className="text-slate-400 text-sm hidden sm:block">{session.name}</span>
          <LogoutButton />
        </div>
      </nav>
      <main className="max-w-5xl mx-auto p-4 sm:p-6">{children}</main>
    </div>
  )
}
