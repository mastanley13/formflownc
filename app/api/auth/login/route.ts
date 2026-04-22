import { cookies } from 'next/headers'
import prisma from '@/lib/db'
import { verifyPassword, signToken, sessionCookieOptions } from '@/lib/auth'

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return Response.json({ error: 'Email and password are required.' }, { status: 400 })
    }

    const agent = await prisma.agent.findUnique({ where: { email: email.toLowerCase().trim() } })
    if (!agent) {
      return Response.json({ error: 'Invalid credentials.' }, { status: 401 })
    }

    const valid = await verifyPassword(password, agent.passwordHash)
    if (!valid) {
      return Response.json({ error: 'Invalid credentials.' }, { status: 401 })
    }

    const token = signToken({ agentId: agent.id, email: agent.email, name: agent.name })
    const cookieStore = await cookies()
    cookieStore.set(sessionCookieOptions(token))

    return Response.json({
      agent: {
        id: agent.id,
        email: agent.email,
        name: agent.name,
        firmName: agent.firmName,
        licenseNumber: agent.licenseNumber,
      },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return Response.json({ error: message }, { status: 500 })
  }
}
