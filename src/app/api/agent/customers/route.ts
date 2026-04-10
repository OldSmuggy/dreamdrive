export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function GET() {
  const cookieStore = cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get(name: string) { return cookieStore.get(name)?.value }, set() {}, remove() {} } }
  )
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()

  // Check role
  const { data: profile } = await admin.from('user_profiles').select('role').eq('id', user.id).single()
  const isAgent = profile?.role === 'buyer_agent'
  const isAdmin = profile?.role === 'admin' || user.email?.endsWith('@dreamdrive.life')
  if (!isAgent && !isAdmin) {
    return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
  }

  const { data: customers } = await admin
    .from('customers')
    .select('id, first_name, last_name, email')
    .eq('status', 'active')
    .order('first_name')

  return NextResponse.json({ customers: customers ?? [] })
}
