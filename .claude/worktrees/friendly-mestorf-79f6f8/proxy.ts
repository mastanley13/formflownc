import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const COOKIE_NAME = 'ffnc_session'
const PUBLIC_PATHS = ['/login', '/register', '/intake', '/api/auth', '/api/intake', '/_next', '/favicon']

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p)) || pathname === '/'

  if (!isPublic) {
    const token = request.cookies.get(COOKIE_NAME)?.value
    if (!token) {
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('from', pathname)
      return NextResponse.redirect(loginUrl)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|public).*)'],
}
