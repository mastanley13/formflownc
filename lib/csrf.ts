import crypto from 'crypto'

function getSecret(): string {
  const s = process.env.JWT_SECRET
  if (!s) throw new Error('JWT_SECRET not set')
  return s
}

// Stateless CSRF token: HMAC-SHA256(secret, agentId:floor(timestamp/300))
// Valid for a 5-minute window; allows 1 window of clock skew.
export function generateCsrfToken(agentId: string): string {
  const window = Math.floor(Date.now() / 1000 / 300)
  const payload = `${agentId}:${window}`
  return crypto.createHmac('sha256', getSecret()).update(payload).digest('hex')
}

export function verifyCsrfToken(token: string, agentId: string): boolean {
  if (!token || !agentId) return false
  const window = Math.floor(Date.now() / 1000 / 300)
  for (const w of [window, window - 1]) {
    const payload = `${agentId}:${w}`
    const expected = crypto.createHmac('sha256', getSecret()).update(payload).digest('hex')
    if (crypto.timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(token.padEnd(64, '0').slice(0, 64), 'hex'))) {
      return true
    }
  }
  return false
}
