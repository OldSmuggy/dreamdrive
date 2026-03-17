import { notFound } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase'
import MyVanClient from './MyVanClient'

export const metadata = { title: 'Your Van Journey — Dream Drive' }

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type R = Record<string, any>

export default async function MyVanPage({ params }: { params: Promise<{ vehicleId: string }> }) {
  const { vehicleId } = await params
  const supabase = createAdminClient()

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

  if (error || !vehicle) notFound()

  const v = vehicle as R
  const customer = Array.isArray(v.customer) ? v.customer[0] : v.customer
  const listing  = Array.isArray(v.listing)  ? v.listing[0]  : v.listing
  const build    = Array.isArray(v.customer_builds) ? v.customer_builds[0] ?? null : v.customer_builds
  const stages   = v.order_stages ?? []
  const docs     = (v.customer_documents ?? []).filter((d: R) => d.customer_visible === true)

  // Resolve addon names
  const slugs = build?.addon_slugs ?? []
  let addonProducts: { slug: string; name: string }[] = []
  if (slugs.length > 0) {
    const { data } = await supabase.from('products').select('slug, name').in('slug', slugs)
    addonProducts = data ?? []
  }

  return (
    <MyVanClient
      customer={customer}
      vehicle={{
        id: v.id,
        vehicle_status: v.vehicle_status,
        vehicle_description: v.vehicle_description,
        build_date: v.build_date,
      }}
      listing={listing ?? null}
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      stages={stages as any}
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      build={build as any}
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      documents={docs as any}
      addonProducts={addonProducts}
      forSale={v.for_sale ? { price: v.sale_price_aud, notes: v.sale_notes } : null}
    />
  )
}
