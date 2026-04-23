import { prisma } from '@/lib/db'
import { verifyPassword, signToken, sessionCookieOptions } from '@/lib/auth'
import { cookies } from 'next/headers'

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return Response.json({ error: 'Email and password required' }, { status: 400 })
    }

    const agent = await prisma.agent.findUnique({ where: { email: email.toLowerCase() } })
    if (!agent || !(await verifyPassword(password, agent.passwordHash))) {
      return Response.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    const token = signToken({ agentId: agent.id, email: agent.email, name: agent.name })
    const cookieStore = await cookies()
    cookieStore.set(sessionCookieOptions(token))

    return Response.json({ agent: { id: agent.id, email: agent.email, name: agent.name } })
  } catch {
    return Response.json({ error: 'Login failed' }, { status: 500 })
  }
}
