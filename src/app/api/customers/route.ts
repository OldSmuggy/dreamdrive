export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'
import { createSupabaseServer } from '@/lib/supabase-server'

export async function GET() {
  const supabase = createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const admin = createAdminClient()

  const { data, error } = await admin
    .from('customers')
    .select(`
      id, first_name, last_name, email, phone, state, status, created_at,
      customer_vehicles(id, vehicle_status, created_at)
    `)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const supabase = createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  try {
    const body = await req.json()
    const admin = createAdminClient()

    const { data, error } = await admin
      .from('customers')
      .insert({
        first_name:         body.first_name,
        last_name:          body.last_name          || null,
        email:              body.email              || null,
        phone:              body.phone              || null,
        state:              body.state              || null,
        notes:              body.notes              || null,
        hubspot_contact_id: body.hubspot_contact_id || null,
        status:             'active',
      })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
