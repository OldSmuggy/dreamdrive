export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'

export async function GET() {
  const supabase = createAdminClient()

  const { data, error } = await supabase
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
  try {
    const body = await req.json()
    const supabase = createAdminClient()

    const { data, error } = await supabase
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
