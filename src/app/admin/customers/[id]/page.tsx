import { notFound } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase'
import CustomerDetailClient from './CustomerDetailClient'

export const metadata = { title: 'Customer | Admin' }

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyRecord = Record<string, any>

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = createAdminClient()

  const [{ data: raw, error }, { data: products }] = await Promise.all([
    supabase
      .from('customers')
      .select(`
        id, first_name, last_name, email, phone, state, notes, hubspot_contact_id, status, created_at, updated_at,
        customer_vehicles(
          id, vehicle_status, vehicle_description, target_preferences, listing_id,
          purchase_price_jpy, purchase_price_aud, build_date, notes, sort_order, created_at,
          listing:listings(id, model_name, model_year, grade, chassis_code, photos, bid_no, mileage_km, start_price_jpy, buy_price_jpy),
          order_stages(id, stage, status, notes, entered_at, completed_at, planned_date),
          customer_builds(id, build_type, build_location, conversion_fee_aud, pop_top, pop_top_fee_aud, addon_slugs, addons_total_aud, custom_description, custom_quote_aud, total_quoted_aud, build_status, notes)
        ),
        customer_documents(id, name, file_url, file_type, file_size_bytes, document_type, notes, created_at, customer_vehicle_id)
      `)
      .eq('id', id)
      .single(),

    supabase
      .from('products')
      .select('id, slug, name, rrp_aud, special_price_aud, category')
      .eq('visible', true)
      .order('sort_order'),
  ])

  if (error || !raw) notFound()

  const customer = raw as AnyRecord

  // Normalise Supabase join shapes (may return array or object)
  const vehicles = ((customer.customer_vehicles ?? []) as AnyRecord[])
    .map(v => ({
      ...v,
      listing:         Array.isArray(v.listing)         ? (v.listing[0]         ?? null) : v.listing,
      order_stages:    Array.isArray(v.order_stages)    ? v.order_stages                 : [],
      customer_builds: Array.isArray(v.customer_builds) ? v.customer_builds              : [],
    }))
    .sort((a: AnyRecord, b: AnyRecord) => (a.sort_order ?? 0) - (b.sort_order ?? 0))

  return (
    <CustomerDetailClient
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      customer={{ ...customer, customer_vehicles: vehicles } as any}
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      documents={(customer.customer_documents ?? []) as any}
      products={products ?? []}
    />
  )
}
