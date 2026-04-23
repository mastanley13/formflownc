import { notFound } from 'next/navigation'
import { prisma } from '@/lib/db'
import IntakeForm from './intake-form'

type Props = { params: Promise<{ token: string }> }

export default async function IntakePage({ params }: Props) {
  const { token } = await params

  const pkg = await prisma.package.findUnique({
    where: { clientLinkToken: token },
    include: {
      agent: { select: { name: true, firmName: true } },
      signers: { select: { name: true, email: true, role: true } },
    },
  })

  if (!pkg) notFound()

  if (new Date() > pkg.clientLinkExpiresAt) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-slate-900 mb-2">Link Expired</h1>
          <p className="text-slate-500 text-sm">This intake link has expired. Please contact your agent for a new link.</p>
        </div>
      </div>
    )
  }

  if (pkg.status === 'client_completed' || pkg.status === 'completed') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="w-14 h-14 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-slate-900 mb-2">Already Submitted</h1>
          <p className="text-slate-500 text-sm">Your information has already been submitted. Your agent will be in touch soon.</p>
        </div>
      </div>
    )
  }

  if (pkg.status === 'link_sent' || pkg.status === 'draft') {
    await prisma.package.update({ where: { id: pkg.id }, data: { status: 'client_opened' } })
  }

  return (
    <IntakeForm
      token={token}
      propertyAddress={pkg.propertyAddress}
      agentName={pkg.agent.name}
      agentFirm={pkg.agent.firmName ?? ''}
      signers={pkg.signers}
    />
  )
}
