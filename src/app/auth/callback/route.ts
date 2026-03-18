import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createAdminClient } from '@/lib/supabase'
import { sendEmail, emailTemplates } from '@/lib/email'
import { cookies } from 'next/headers'
import type { ResponseCookie } from 'next/dist/compiled/@edge-runtime/cookies'

export async function GET(req: NextRequest) {
  const { searchParams, origin } = new URL(req.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/account'

  if (code) {
    const cookieStore = cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) { return cookieStore.get(name)?.value },
          set(name: string, value: string, options: Partial<ResponseCookie>) {
            cookieStore.set(name, value, options)
          },
          remove(name: string, options: Partial<ResponseCookie>) {
            cookieStore.set(name, '', { ...options, maxAge: 0 })
          },
        },
      }
    )

    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data.user) {
      // Create profile for new OAuth users (ON CONFLICT DO NOTHING via upsert ignoreDuplicates)
      const meta = data.user.user_metadata ?? {}
      const fullName: string = meta.full_name ?? meta.name ?? ''
      const [firstName, ...rest] = fullName.trim().split(' ')
      const lastName = rest.join(' ') || null

      const admin = createAdminClient()
      const { data: upserted } = await admin.from('profiles').upsert(
        {
          id: data.user.id,
          first_name: firstName || null,
          last_name: lastName,
        },
        { onConflict: 'id', ignoreDuplicates: true }
      ).select('created_at').single()

      // Send welcome email for new users (created just now)
      const isNew = upserted?.created_at && (Date.now() - new Date(upserted.created_at).getTime()) < 60000
      if (isNew && data.user.email) {
        sendEmail({
          to: data.user.email,
          ...emailTemplates.welcomeEmail(firstName || ''),
        }).catch(() => {})
      }

      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth-callback-failed`)
}
