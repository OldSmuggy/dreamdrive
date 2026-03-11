import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  if (pathname.startsWith('/admin')) {
    const res = NextResponse.next()

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => req.cookies.getAll(),
          setAll: (cookies) => cookies.forEach(({ name, value, options }) =>
            res.cookies.set(name, value, options)
          ),
        },
      }
    )

    // Use getUser() instead of getSession() — more reliable in middleware
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.redirect(new URL('/login?next=/admin', req.url))
    }

    return res
  }

  return NextResponse.next()
}

export const config = { matcher: ['/admin/:path*'] }
