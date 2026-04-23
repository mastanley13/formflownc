import { prisma } from '@/lib/db'
import { hashPassword, signToken, sessionCookieOptions } from '@/lib/auth'
import { cookies } from 'next/headers'

export async function POST(request: Request) {
  try {
    const { email, password, name, phone, firmName } = await request.json()

    if (!email || !password || !name) {
      return Response.json({ error: 'Email, password, and name required' }, { status: 400 })
    }

    if (password.length < 8) {
      return Response.json({ error: 'Password must be at least 8 characters' }, { status: 400 })
    }

    const existing = await prisma.agent.findUnique({ where: { email: email.toLowerCase() } })
    if (existing) {
      return Response.json({ error: 'Email already registered' }, { status: 409 })
    }

    const passwordHash = await hashPassword(password)
    const agent = await prisma.agent.create({
      data: {
        email: email.toLowerCase(),
        passwordHash,
        name,
        phone: phone || null,
        firmName: firmName || null,
      },
    })

    const token = signToken({ agentId: agent.id, email: agent.email, name: agent.name })
    const cookieStore = await cookies()
    cookieStore.set(sessionCookieOptions(token))

    return Response.json(
      { agent: { id: agent.id, email: agent.email, name: agent.name } },
      { status: 201 }
    )
  } catch {
    return Response.json({ error: 'Registration failed' }, { status: 500 })
  }
}
