import { getSession } from '@/lib/auth'
import { verifyPassword, hashPassword } from '@/lib/auth'
import { verifyCsrfToken } from '@/lib/csrf'
import prisma from '@/lib/db'

export async function GET() {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Not authenticated.' }, { status: 401 })

  const agent = await prisma.agent.findUnique({
    where: { id: session.agentId },
    select: {
      id: true, email: true, name: true, phone: true,
      licenseNumber: true, firmName: true, firmAddress: true,
      firmPhone: true, firmLicense: true, createdAt: true,
    },
  })

  if (!agent) return Response.json({ error: 'Agent not found.' }, { status: 404 })
  return Response.json({ agent })
}

export async function PATCH(request: Request) {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Not authenticated.' }, { status: 401 })

  const csrfToken = request.headers.get('x-csrf-token') ?? ''
  if (!verifyCsrfToken(csrfToken, session.agentId)) {
    return Response.json({ error: 'Invalid CSRF token.' }, { status: 403 })
  }

  const body = await request.json() as Record<string, unknown>

  const updateData: Record<string, unknown> = {}
  if (typeof body.name === 'string' && body.name.trim()) updateData.name = body.name.trim()
  if (typeof body.phone === 'string') updateData.phone = body.phone.trim() || null
  if (typeof body.firmName === 'string') updateData.firmName = body.firmName.trim() || null
  if (typeof body.firmAddress === 'string') updateData.firmAddress = body.firmAddress.trim() || null
  if (typeof body.firmPhone === 'string') updateData.firmPhone = body.firmPhone.trim() || null
  if (typeof body.firmLicense === 'string') updateData.firmLicense = body.firmLicense.trim() || null
  if (typeof body.licenseNumber === 'string') updateData.licenseNumber = body.licenseNumber.trim() || null

  // Password change
  if (typeof body.newPassword === 'string' && body.newPassword.length > 0) {
    if (typeof body.currentPassword !== 'string' || !body.currentPassword) {
      return Response.json({ error: 'Current password is required to change password.' }, { status: 400 })
    }
    if (body.newPassword.length < 8) {
      return Response.json({ error: 'New password must be at least 8 characters.' }, { status: 400 })
    }
    const agent = await prisma.agent.findUnique({ where: { id: session.agentId }, select: { passwordHash: true } })
    if (!agent) return Response.json({ error: 'Agent not found.' }, { status: 404 })
    const valid = await verifyPassword(body.currentPassword, agent.passwordHash)
    if (!valid) return Response.json({ error: 'Current password is incorrect.' }, { status: 400 })
    updateData.passwordHash = await hashPassword(body.newPassword)
  }

  if (Object.keys(updateData).length === 0) {
    return Response.json({ error: 'No valid fields to update.' }, { status: 400 })
  }

  const agent = await prisma.agent.update({
    where: { id: session.agentId },
    data: updateData,
    select: {
      id: true, email: true, name: true, phone: true,
      licenseNumber: true, firmName: true, firmAddress: true,
      firmPhone: true, firmLicense: true, createdAt: true,
    },
  })

  return Response.json({ agent })
}
