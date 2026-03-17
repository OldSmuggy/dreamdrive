export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  try {
    const { vehicle_id, new_customer_id } = await req.json()
    if (!vehicle_id || !new_customer_id) {
      return NextResponse.json({ error: 'vehicle_id and new_customer_id required' }, { status: 400 })
    }

    const supabase = createAdminClient()
    const now = new Date().toISOString()

    // Get old owner name
    const { data: vehicle } = await supabase
      .from('customer_vehicles')
      .select('customer_id, notes, customer:customers!customer_vehicles_customer_id_fkey(first_name, last_name)')
      .eq('id', vehicle_id)
      .single()

    if (!vehicle) return NextResponse.json({ error: 'Vehicle not found' }, { status: 404 })

    const oldCustomer = Array.isArray(vehicle.customer) ? vehicle.customer[0] : vehicle.customer
    const oldName = [oldCustomer?.first_name, oldCustomer?.last_name].filter(Boolean).join(' ') || 'Unknown'
    const transferNote = `Transferred from ${oldName} on ${new Date().toLocaleDateString('en-AU')}`
    const newNotes = vehicle.notes ? `${vehicle.notes}\n${transferNote}` : transferNote

    // Transfer vehicle to new customer
    const { error: vehicleErr } = await supabase
      .from('customer_vehicles')
      .update({
        customer_id:    new_customer_id,
        for_sale:       false,
        sale_price_aud: null,
        sale_notes:     null,
        notes:          newNotes,
        updated_at:     now,
      })
      .eq('id', vehicle_id)

    if (vehicleErr) return NextResponse.json({ error: vehicleErr.message }, { status: 500 })

    // Transfer linked builds
    await supabase
      .from('customer_builds')
      .update({ customer_id: new_customer_id, updated_at: now })
      .eq('customer_vehicle_id', vehicle_id)

    // Transfer linked documents
    await supabase
      .from('customer_documents')
      .update({ customer_id: new_customer_id })
      .eq('customer_vehicle_id', vehicle_id)

    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
