import { cookies } from 'next/headers'
import prisma from '@/lib/db'
import { hashPassword, signToken, sessionCookieOptions } from '@/lib/auth'

// V1: Invite-only. Registrations only allowed when ALLOW_REGISTRATION=true or no agents exist yet.
export async function POST(request: Request) {
  try {
    const agentCount = await prisma.agent.count()
    const registrationOpen = process.env.ALLOW_REGISTRATION === 'true' || agentCount === 0

    if (!registrationOpen) {
      return Response.json({ error: 'Registration is closed. Contact your administrator.' }, { status: 403 })
    }

    const { email, password, name, phone, licenseNumber, firmName, firmAddress, firmPhone, firmLicense } =
      await request.json()

    if (!email || !password || !name) {
      return Response.json({ error: 'Name, email, and password are required.' }, { status: 400 })
    }
    if (password.length < 8) {
      return Response.json({ error: 'Password must be at least 8 characters.' }, { status: 400 })
    }

    const existing = await prisma.agent.findUnique({ where: { email: email.toLowerCase().trim() } })
    if (existing) {
      return Response.json({ error: 'An account with this email already exists.' }, { status: 409 })
    }

    const passwordHash = await hashPassword(password)
    const agent = await prisma.agent.create({
      data: {
        email: email.toLowerCase().trim(),
        passwordHash,
        name: name.trim(),
        phone: phone?.trim() || null,
        licenseNumber: licenseNumber?.trim() || null,
        firmName: firmName?.trim() || null,
        firmAddress: firmAddress?.trim() || null,
        firmPhone: firmPhone?.trim() || null,
        firmLicense: firmLicense?.trim() || null,
      },
    })

    const token = signToken({ agentId: agent.id, email: agent.email, name: agent.name })
    const cookieStore = await cookies()
    cookieStore.set(sessionCookieOptions(token))

    return Response.json({
      agent: { id: agent.id, email: agent.email, name: agent.name },
    }, { status: 201 })
  } catch (err) {
    console.error('[register] Unexpected error:', err)
    return Response.json({ error: 'Internal server error.' }, { status: 500 })
  }
}
