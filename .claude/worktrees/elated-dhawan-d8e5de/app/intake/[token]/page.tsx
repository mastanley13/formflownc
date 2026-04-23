import { prisma } from '@/lib/db'
import { notFound } from 'next/navigation'
import IntakeFlow from './flow'

export default async function IntakePage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params

  const pkg = await prisma.package.findUnique({
    where: { clientLinkToken: token },
    include: {
      signers: { select: { id: true, name: true, email: true, role: true } },
    },
  })

  if (!pkg) notFound()

  const expired = new Date(pkg.clientLinkExpiresAt) < new Date()

  if (expired) {
    if (pkg.status !== 'expired') {
      await prisma.package.update({ where: { id: pkg.id }, data: { status: 'expired' } })
    }
    return (
      <FullPageMessage
        title="Link Expired"
        body="This intake link has expired. Please contact your agent for a new link."
      />
    )
  }

  if (['client_completed', 'signatures_pending', 'completed'].includes(pkg.status)) {
    return (
      <FullPageMessage
        title="Already Submitted"
        body="Your information has already been submitted. Thank you! Your agent will be in touch."
      />
    )
  }

  if (pkg.status === 'draft' || pkg.status === 'link_sent') {
    await prisma.package.update({ where: { id: pkg.id }, data: { status: 'client_opened' } })
  }

  return (
    <IntakeFlow
      token={token}
      propertyAddress={pkg.propertyAddress}
      signers={pkg.signers}
      existingData={JSON.parse(pkg.clientData) as Record<string, string>}
    />
  )
}

function FullPageMessage({ title, body }: { title: string; body: string }) {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center max-w-md w-full">
        <h1 className="text-2xl font-bold text-slate-900 mb-3">{title}</h1>
        <p className="text-slate-500">{body}</p>
      </div>
    </div>
  )
}
