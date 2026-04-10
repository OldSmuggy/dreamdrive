import { createAdminClient } from '@/lib/supabase'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const cookieStore = cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) { return cookieStore.get(name)?.value },
        set() {},
        remove() {},
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()
  const { data: profile } = await admin.from('user_profiles').select('is_admin').eq('id', user.id).single()
  const isAdmin = profile?.is_admin || user.email?.endsWith('@dreamdrive.life')

  if (!isAdmin) return NextResponse.json({ error: 'Admin only' }, { status: 403 })

  const body = await request.json()
  const { customer_vehicle_id, agent_id } = body

  if (!customer_vehicle_id) {
    return NextResponse.json({ error: 'customer_vehicle_id required' }, { status: 400 })
  }

  const updates: Record<string, unknown> = { agent_id: agent_id || null }

  // If assigning an agent and no auction_status yet, set to 'watching'
  if (agent_id) {
    const { data: cv } = await admin.from('customer_vehicles').select('auction_status').eq('id', customer_vehicle_id).single()
    if (!cv?.auction_status) updates.auction_status = 'watching'
  }

  const { error } = await admin.from('customer_vehicles').update(updates).eq('id', customer_vehicle_id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
