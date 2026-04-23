import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { hashPassword, signToken, sessionCookieOptions } from '@/lib/auth'
import { cookies } from 'next/headers'

export async function POST(request: Request) {
  const body = await request.json()
  const { email, password, name, firmName, licenseNumber, phone } = body

  if (!email || !password || !name) {
    return NextResponse.json({ error: 'Email, password, and name are required' }, { status: 400 })
  }

  const existing = await prisma.agent.findUnique({ where: { email } })
  if (existing) {
    return NextResponse.json({ error: 'Email already registered' }, { status: 409 })
  }

  const passwordHash = await hashPassword(password)
  const agent = await prisma.agent.create({
    data: { email, passwordHash, name, firmName, licenseNumber, phone },
  })

  const token = signToken({ agentId: agent.id, email: agent.email, name: agent.name })
  const cookieStore = await cookies()
  cookieStore.set(sessionCookieOptions(token))

  return NextResponse.json(
    { success: true, agent: { id: agent.id, email: agent.email, name: agent.name } },
    { status: 201 }
  )
}
