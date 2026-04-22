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
// Also removes any associated filled PDF files from the filesystem.
export async function purgeExpiredPackages(): Promise<PurgeResult> {
  const expired = await prisma.package.findMany({
    where: {
      clientLinkExpiresAt: { lt: new Date() },
      status: { notIn: ['completed'] },
    },
    select: { id: true, status: true },
  })

  if (expired.length === 0) {
    return { purgedCount: 0, packageIds: [], errors: [] }
  }

  const ids = expired.map((p) => p.id)
  const errors: string[] = []

  // Delete filled PDF files for each package
  for (const id of ids) {
    const dir = path.join(process.cwd(), 'uploads', 'filled', id)
    try {
      await rm(dir, { recursive: true, force: true })
    } catch (e) {
      errors.push(`Failed to delete files for ${id}: ${e instanceof Error ? e.message : String(e)}`)
    }
  }

  // Mark packages as expired in DB (cascade deletes signers)
  await prisma.package.updateMany({
    where: { id: { in: ids } },
    data: {
      status: 'expired',
      clientData: '{}', // wipe client PII
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
