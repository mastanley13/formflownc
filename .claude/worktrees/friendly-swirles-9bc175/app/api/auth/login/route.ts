import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyPassword, signToken, sessionCookieOptions } from '@/lib/auth'
import { cookies } from 'next/headers'

export async function POST(request: Request) {
  const body = await request.json()
  const { email, password } = body

  if (!email || !password) {
    return NextResponse.json({ error: 'Email and password required' }, { status: 400 })
  }

  const agent = await prisma.agent.findUnique({ where: { email } })
  if (!agent) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
  }

  const valid = await verifyPassword(password, agent.passwordHash)
  if (!valid) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
  }

  const token = signToken({ agentId: agent.id, email: agent.email, name: agent.name })
  const cookieStore = await cookies()
  cookieStore.set(sessionCookieOptions(token))

  return NextResponse.json({
    success: true,
    agent: { id: agent.id, email: agent.email, name: agent.name, firmName: agent.firmName },
  })
}
