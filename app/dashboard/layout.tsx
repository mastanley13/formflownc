import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import DashboardNav from './nav'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession()
  if (!session) redirect('/login')

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <DashboardNav agentName={session.name} />
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8">
        {children}
      </main>
    </div>
  )
}
