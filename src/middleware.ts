import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  if (pathname.startsWith('/admin')) {
    // Pass req into NextResponse.next() so any cookie mutations written by the
    // Supabase client (e.g. token refresh) are forwarded to the route handler.
    let res = NextResponse.next({ request: req })

    // @supabase/ssr v0.3 uses get/set/remove (not getAll/setAll).
    // setAll is only in v0.4+.
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get: (name: string) => req.cookies.get(name)?.value,
          set: (name: string, value: string, options: object) => {
            // Keep request cookies in sync so downstream server components see them
            req.cookies.set(name, value)
            res = NextResponse.next({ request: req })
            res.cookies.set(name, value, options as any)
          },
          remove: (name: string, options: object) => {
            req.cookies.set(name, '')
            res = NextResponse.next({ request: req })
            res.cookies.set(name, '', { ...(options as any), maxAge: 0 })
          },
        },
      }
    )

    // Use getSession() — reads the JWT from request cookies directly with no
    // outbound network call.  getUser() makes a round-trip to Supabase on every
    // request; in Vercel Edge Runtime that call can fail or time-out, causing a
    // redirect loop even when the user is genuinely authenticated.
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.redirect(new URL('/login?next=/admin', req.url))
    }

    return res
  }

  return NextResponse.next()
}

export const config = { matcher: ['/admin/:path*'] }
