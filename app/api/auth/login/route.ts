import { cookies } from 'next/headers'
import prisma from '@/lib/db'
import { verifyPassword, signToken, sessionCookieOptions } from '@/lib/auth'

// In-memory rate limiter: max 5 attempts per IP per 15 minutes
const attempts = new Map<string, { count: number; resetAt: number }>()

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const window = 15 * 60 * 1000
  const entry = attempts.get(ip)

  if (!entry || now > entry.resetAt) {
    attempts.set(ip, { count: 1, resetAt: now + window })
    return true
  }

  if (entry.count >= 5) return false

  entry.count++
  return true
}

function getIp(request: Request): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    request.headers.get('x-real-ip') ??
    'unknown'
  )
}

export async function POST(request: Request) {
  const ip = getIp(request)

  if (!checkRateLimit(ip)) {
    return Response.json(
      { error: 'Too many login attempts. Try again in 15 minutes.' },
      { status: 429 }
    )
  }

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

    // Clear rate limit on successful login
    attempts.delete(ip)

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
