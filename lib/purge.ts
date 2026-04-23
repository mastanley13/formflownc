import prisma from '@/lib/db'
import { rm } from 'fs/promises'
import path from 'path'

export type PurgeResult = {
  purgedCount: number
  packageIds: string[]
  errors: string[]
}

// Deletes packages that have expired (clientLinkExpiresAt < now)
// and are not in a terminal state (completed).
// Wipes client PII from package data and signer records, and deletes filled PDFs.
// agentId scopes the purge to one agent's packages.
export async function purgeExpiredPackages(agentId?: string): Promise<PurgeResult> {
  const expired = await prisma.package.findMany({
    where: {
      clientLinkExpiresAt: { lt: new Date() },
      status: { notIn: ['completed'] },
      ...(agentId ? { agentId } : {}),
    },
    select: { id: true, status: true },
  })

  if (expired.length === 0) {
    return { purgedCount: 0, packageIds: [], errors: [] }
  }

  const ids = expired.map((p) => p.id)
  const errors: string[] = []

  for (const id of ids) {
    const dir = path.join(process.cwd(), 'uploads', 'filled', id)
    try {
      await rm(dir, { recursive: true, force: true })
    } catch (e) {
      errors.push(`Failed to delete files for ${id}: ${e instanceof Error ? e.message : String(e)}`)
    }
  }

  // Wipe signer PII
  await prisma.packageSigner.updateMany({
    where: { packageId: { in: ids } },
    data: {
      name: '[purged]',
      email: 'purged@purged.invalid',
      phone: null,
    },
  })

  // Mark packages as expired and wipe package-level PII
  await prisma.package.updateMany({
    where: { id: { in: ids } },
    data: {
      status: 'expired',
      clientData: '{}',
      agentData: '{}',
    },
  })

  return { purgedCount: ids.length, packageIds: ids, errors }
}

// Auto-expire: mark packages that have passed their deadline.
// Safe to run frequently — only touches packages that are past expiry.
export async function markExpiredPackages(): Promise<number> {
  const result = await prisma.package.updateMany({
    where: {
      clientLinkExpiresAt: { lt: new Date() },
      status: { notIn: ['completed', 'expired'] },
    },
    data: { status: 'expired' },
  })
  return result.count
}
