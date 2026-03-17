import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ vehicleId: string }> },
) {
  const { vehicleId } = await params
  const supabase = createAdminClient()

  // Fetch vehicle with all related data
  const { data: vehicle, error } = await supabase
    .from('customer_vehicles')
    .select(`
      id, vehicle_status, vehicle_description, build_date, for_sale, sale_price_aud, sale_notes,
      purchase_price_jpy, purchase_price_aud,
      customer:customers!customer_vehicles_customer_id_fkey(id, first_name, last_name),
      listing:listings(id, model_name, model_year, grade, chassis_code, photos, mileage_km, drive),
      order_stages(id, stage, status, notes, entered_at, completed_at, planned_date),
      customer_builds(id, build_type, build_location, pop_top, pop_top_fee_aud, addon_slugs, addons_total_aud, custom_description, total_quoted_aud, build_status, notes),
      customer_documents(id, name, file_url, file_type, file_size_bytes, document_type, notes, created_at, customer_visible)
    `)
    .eq('id', vehicleId)
    .single()

  if (error || !vehicle) {
    return NextResponse.json({ error: 'Vehicle not found' }, { status: 404 })
  }

  // Normalise joins
  const customer = Array.isArray(vehicle.customer) ? vehicle.customer[0] : vehicle.customer
  const listing  = Array.isArray(vehicle.listing)  ? vehicle.listing[0]  : vehicle.listing
  const build    = Array.isArray(vehicle.customer_builds) ? vehicle.customer_builds[0] ?? null : vehicle.customer_builds
  const stages   = vehicle.order_stages ?? []
  const docs     = (vehicle.customer_documents ?? []).filter(
    (d: { customer_visible: boolean }) => d.customer_visible === true,
  )

  // Resolve addon product names
  const addonSlugs = build?.addon_slugs ?? []
  let addonProducts: { slug: string; name: string; rrp_aud: number }[] = []
  if (addonSlugs.length > 0) {
    const { data: products } = await supabase
      .from('products')
      .select('slug, name, rrp_aud')
      .in('slug', addonSlugs)
    addonProducts = products ?? []
  }

  return NextResponse.json({
    customer: customer ?? null,
    vehicle: {
      id:                  vehicle.id,
      vehicle_status:      vehicle.vehicle_status,
      vehicle_description: vehicle.vehicle_description,
      build_date:          vehicle.build_date,
      purchase_price_jpy:  vehicle.purchase_price_jpy,
      purchase_price_aud:  vehicle.purchase_price_aud,
    },
    listing:  listing ?? null,
    stages,
    build,
    documents: docs,
    addonProducts,
    forSale: vehicle.for_sale ? {
      price: vehicle.sale_price_aud,
      notes: vehicle.sale_notes,
    } : null,
  })
}
