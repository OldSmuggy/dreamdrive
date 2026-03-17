import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'

export async function GET() {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('customer_vehicles')
    .select(`
      id, vehicle_status, vehicle_description, for_sale, sale_price_aud, sale_notes, created_at,
      customer:customers!customer_vehicles_customer_id_fkey(id, first_name, last_name),
      listing:listings(id, model_name, model_year, grade, photos),
      customer_builds(id, build_type, pop_top, total_quoted_aud)
    `)
    .eq('for_sale', true)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const normalised = (data ?? []).map(v => ({
    ...v,
    customer: Array.isArray(v.customer) ? v.customer[0] : v.customer,
    listing:  Array.isArray(v.listing)  ? v.listing[0]  : v.listing,
    build:    Array.isArray(v.customer_builds) ? v.customer_builds[0] ?? null : v.customer_builds,
  }))

  return NextResponse.json(normalised)
}
