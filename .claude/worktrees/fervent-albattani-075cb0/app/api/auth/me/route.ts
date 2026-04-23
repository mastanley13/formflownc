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

  function strField(v: unknown, max: number, fieldName: string): string | null | Response {
    if (typeof v !== 'string') return null
    if (v.trim().length > max) return Response.json({ error: `${fieldName} exceeds maximum length of ${max}.` }, { status: 400 })
    return v
  }

  const nameVal      = strField(body.name,          100, 'name')
  const phoneVal     = strField(body.phone,           20, 'phone')
  const firmNameVal  = strField(body.firmName,       200, 'firmName')
  const firmAddrVal  = strField(body.firmAddress,    500, 'firmAddress')
  const firmPhoneVal = strField(body.firmPhone,       20, 'firmPhone')
  const firmLicVal   = strField(body.firmLicense,     50, 'firmLicense')
  const licNumVal    = strField(body.licenseNumber,   50, 'licenseNumber')

  for (const v of [nameVal, phoneVal, firmNameVal, firmAddrVal, firmPhoneVal, firmLicVal, licNumVal]) {
    if (v instanceof Response) return v
  }

  const updateData: Record<string, unknown> = {}
  if (typeof nameVal === 'string' && nameVal.trim()) updateData.name = nameVal.trim()
  if (typeof phoneVal === 'string') updateData.phone = phoneVal.trim() || null
  if (typeof firmNameVal === 'string') updateData.firmName = firmNameVal.trim() || null
  if (typeof firmAddrVal === 'string') updateData.firmAddress = firmAddrVal.trim() || null
  if (typeof firmPhoneVal === 'string') updateData.firmPhone = firmPhoneVal.trim() || null
  if (typeof firmLicVal === 'string') updateData.firmLicense = firmLicVal.trim() || null
  if (typeof licNumVal === 'string') updateData.licenseNumber = licNumVal.trim() || null

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
