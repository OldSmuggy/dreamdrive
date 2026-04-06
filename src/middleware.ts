import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // Build a mutable response so we can forward any refreshed auth cookies
  let response = NextResponse.next({
    request: { headers: request.headers },
  })

  // @supabase/ssr v0.3.x cookie API: get / set / remove (individual cookies)
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          // Mutate the request so downstream middleware can see the new cookie
          request.cookies.set({ name, value, ...options })
          // Re-create response so the new cookie is forwarded to the browser
          response = NextResponse.next({ request: { headers: request.headers } })
          response.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: '', ...options })
          response = NextResponse.next({ request: { headers: request.headers } })
          response.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )

  // getUser() validates the token server-side (recommended over getSession() in middleware)
  const { data: { user } } = await supabase.auth.getUser()

  const isAdmin   = request.nextUrl.pathname.startsWith('/admin')
  const isAccount = request.nextUrl.pathname.startsWith('/account')
  const isMyVan   = request.nextUrl.pathname.startsWith('/my-van')
  const isAgent   = request.nextUrl.pathname.startsWith('/agent')

  // Redirect unauthenticated users to login
  if ((isAdmin || isAccount || isMyVan || isAgent) && !user) {
    const dest = encodeURIComponent(request.nextUrl.pathname)
    return NextResponse.redirect(new URL(`/login?next=${dest}`, request.url))
  }

  // Admin pages require admin email domain (API routes have their own requireAdmin() check)
  if (isAdmin && user && !user.email?.endsWith('@dreamdrive.life')) {
    // Check if user has is_admin flag via a lightweight query
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single()
    if (!profile?.is_admin) {
      return NextResponse.redirect(new URL('/', request.url))
    }
  }

  return response
}

export const config = { matcher: ['/admin/:path*', '/account/:path*', '/my-van/:path*', '/agent/:path*'] }
