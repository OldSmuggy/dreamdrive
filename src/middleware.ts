import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  if (pathname.startsWith('/admin')) {
    // res must be created before the Supabase client so cookie writes land on it
    const res = NextResponse.next()

    // @supabase/ssr v0.3 uses get/set/remove (not getAll/setAll)
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get: (name: string) => req.cookies.get(name)?.value,
          set: (name: string, value: string, options: object) => res.cookies.set(name, value, options as any),
          remove: (name: string, options: object) => res.cookies.set(name, '', { ...(options as any), maxAge: 0 }),
        },
      }
    )

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.redirect(new URL('/login?next=/admin', req.url))
    }

    return res
  }

  return NextResponse.next()
}

export const config = { matcher: ['/admin/:path*'] }
