/**
 * Client-side CSRF token utility.
 *
 * Fetches a token from GET /api/csrf and caches it for 4 minutes
 * (the server window is 5 min with 1 window of skew = 10 min total,
 * so refreshing at 4 min keeps us well within bounds).
 */

let cachedToken: string | null = null
let fetchedAt = 0
const TTL_MS = 4 * 60 * 1000 // 4 minutes

/**
 * Returns a valid CSRF token, fetching a fresh one if the cache is stale.
 * For use in authenticated dashboard pages — not needed for public intake endpoints.
 */
export async function getCsrfToken(): Promise<string> {
  if (cachedToken && Date.now() - fetchedAt < TTL_MS) {
    return cachedToken
  }

  const res = await fetch('/api/csrf')
  if (!res.ok) {
    // If not authenticated the endpoint returns 401 — return empty string
    // and let the actual request surface the auth error.
    cachedToken = null
    return ''
  }

  const data = (await res.json()) as { token?: string }
  cachedToken = data.token ?? ''
  fetchedAt = Date.now()
  return cachedToken
}

/** Force-expire the cache so the next call fetches fresh. */
export function invalidateCsrfToken(): void {
  cachedToken = null
  fetchedAt = 0
}

/**
 * Convenience: builds a headers object with Content-Type JSON + CSRF token.
 */
export async function csrfHeaders(): Promise<Record<string, string>> {
  const token = await getCsrfToken()
  return {
    'Content-Type': 'application/json',
    'x-csrf-token': token,
  }
}
