import { NextRequest, NextResponse } from 'next/server'

export function middleware(req: NextRequest) {
  const isAdmin   = req.nextUrl.pathname.startsWith('/admin')
  const isAccount = req.nextUrl.pathname.startsWith('/account')

  if (isAdmin || isAccount) {
    const ref = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? '')
      .replace('https://', '')
      .split('.')[0]
    const tokenCookie = `sb-${ref}-auth-token`
    const hasSession =
      req.cookies.has(tokenCookie) || req.cookies.has(`${tokenCookie}.0`)

    if (!hasSession) {
      const dest = encodeURIComponent(req.nextUrl.pathname)
      return NextResponse.redirect(new URL(`/login?next=${dest}`, req.url))
    }
  }

  return NextResponse.next()
}

export const config = { matcher: ['/admin/:path*', '/account/:path*'] }
