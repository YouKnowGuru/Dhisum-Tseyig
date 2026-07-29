import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // 0. CSRF protection for cookie-authenticated admin API routes.
  // State-changing requests to /api/admin/* (and NextAuth's own mutation
  // endpoints) must originate from this site. We enforce this with the
  // Fetch Metadata `Sec-Fetch-Site` header plus an Origin/Host match as a
  // fallback. Bearer-token API clients (the POS desktop app) don't send
  // Sec-Fetch-Site and hit /api/auth|license — NOT /api/admin — so they are
  // unaffected.
  if (
    (pathname.startsWith('/api/admin') || pathname.startsWith('/api/auth')) &&
    !['GET', 'HEAD', 'OPTIONS'].includes(request.method)
  ) {
    const secFetchSite = request.headers.get('sec-fetch-site')
    const origin = request.headers.get('origin')
    const host = request.headers.get('host')

    let originHost: string | null = null
    if (origin) {
      try {
        originHost = new URL(origin).host
      } catch {
        originHost = null
      }
    }

    // Reject only when we have POSITIVE evidence of a cross-site request.
    // If neither header is present (non-browser API client), allow.
    const crossSiteByFetchMeta = secFetchSite === 'cross-site'
    const crossSiteByOrigin = originHost !== null && host !== null && originHost !== host

    if (crossSiteByFetchMeta || crossSiteByOrigin) {
      return NextResponse.json({ error: 'Forbidden: cross-site request blocked' }, { status: 403 })
    }
  }

  const response = NextResponse.next()

  // 1. Technical SEO: Set noindex header for admin and system pages
  // NOTE: Do NOT add these to robots.txt disallow — Googlebot must be able to
  // crawl them to see the noindex header. Otherwise you get "Blocked by robots.txt" errors.
  const noIndexRoutes = ['/admin', '/api/admin', '/license-activate', '/reset-password', '/verify-email']
  if (noIndexRoutes.some(route => pathname === route || pathname.startsWith(route + '/'))) {
    response.headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive')
  }

  // 2. Content Security Policy
  // In development, React uses eval() for debugging features (callstack reconstruction).
  // In production, React never uses eval, so we keep CSP stricter.
  const isDev = process.env.NODE_ENV === 'development'
  const cspHeader = [
    "default-src 'self'",
    `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ''}`,
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "img-src 'self' data: blob: https://www.transparenttextures.com",
    "font-src 'self' https://fonts.gstatic.com",
    "connect-src 'self'",
    "frame-ancestors 'none'",
    "form-action 'self'",
    "base-uri 'self'",
    "upgrade-insecure-requests",
  ].join('; ')

  // 3. Security Headers
  response.headers.set('Content-Security-Policy', cspHeader)
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=()')
  
  // 4. HSTS - only in production
  if (process.env.NODE_ENV === 'production') {
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains; preload'
    )
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
