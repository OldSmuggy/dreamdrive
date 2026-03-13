import { NextRequest, NextResponse } from 'next/server'

// Bypass createServerClient entirely to avoid Edge Runtime compatibility issues
// with @supabase/ssr v0.3.0's internal _recoverAndRefresh() network calls.
// Instead, check for the Supabase auth cookie directly.
//
// @supabase/ssr stores the session as:
//   sb-{projectRef}-auth-token       (when token fits in one cookie)
//   sb-{projectRef}-auth-token.0     (first chunk when token is large)
//
// The projectRef is the subdomain of NEXT_PUBLIC_SUPABASE_URL.

export function middleware(req: NextRequest) {
  if (req.nextUrl.pathname.startsWith('/admin')) {
    const ref = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? '')
      .replace('https://', '')
      .split('.')[0]
    const tokenCookie = `sb-${ref}-auth-token`

    const hasSession =
      req.cookies.has(tokenCookie) || req.cookies.has(`${tokenCookie}.0`)

    if (!hasSession) {
      return NextResponse.redirect(new URL('/login?next=/admin', req.url))
    }
  }

  return NextResponse.next()
}

export const config = { matcher: ['/admin/:path*'] }
