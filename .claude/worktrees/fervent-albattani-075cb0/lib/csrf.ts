import crypto from 'crypto'

function getSecret(): string {
  // Use a dedicated CSRF_SECRET if available; fall back to JWT_SECRET.
  // In production, set CSRF_SECRET to a separate random value.
  const s = process.env.CSRF_SECRET ?? process.env.JWT_SECRET
  if (!s) throw new Error('CSRF_SECRET (or JWT_SECRET) is not set')
  return s
}

// Stateless CSRF token: HMAC-SHA256(secret, agentId:floor(timestamp/300))
// Valid for a 5-minute window; allows 1 window of clock skew (10 min total).
export function generateCsrfToken(agentId: string): string {
  const window = Math.floor(Date.now() / 1000 / 300)
  const payload = `${agentId}:${window}`
  return crypto.createHmac('sha256', getSecret()).update(payload).digest('hex')
}

export function verifyCsrfToken(token: string, agentId: string): boolean {
  if (!token || !agentId) return false
  // SHA-256 hex output is always 64 characters — reject anything else outright.
  if (token.length !== 64) return false
  const window = Math.floor(Date.now() / 1000 / 300)
  for (const w of [window, window - 1]) {
    const payload = `${agentId}:${w}`
    const expected = crypto.createHmac('sha256', getSecret()).update(payload).digest('hex')
    try {
      if (crypto.timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(token, 'hex'))) {
        return true
      }
    } catch {
      return false
    }
  }
  return false
}
