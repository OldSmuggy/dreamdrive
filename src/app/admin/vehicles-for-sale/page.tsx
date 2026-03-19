import { createAdminClient } from '@/lib/supabase'
import VehiclesForSaleClient from './VehiclesForSaleClient'

export const dynamic  = 'force-dynamic'
export const metadata = { title: 'Vehicles For Sale | Admin' }

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type R = Record<string, any>

export default async function VehiclesForSalePage() {
  const supabase = createAdminClient()

  const [{ data: vehicles, error }, { data: customers }] = await Promise.all([
    supabase
      .from('customer_vehicles')
      .select(`
        id, vehicle_status, vehicle_description, for_sale, sale_price_aud, sale_notes, created_at,
        customer:customers!customer_vehicles_customer_id_fkey(id, first_name, last_name),
        listing:listings(id, model_name, model_year, grade, photos),
        customer_builds(id, build_type, pop_top, total_quoted_aud)
      `)
      .eq('for_sale', true)
      .order('created_at', { ascending: false }),
    supabase
      .from('customers')
      .select('id, first_name, last_name')
      .neq('status', 'archived')
      .order('first_name'),
  ])

  if (error) {
    return (
      <div>
        <h1 className="text-2xl text-charcoal mb-4">Vehicles For Sale</h1>
        <p className="text-sm text-gray-400">No vehicles listed for sale yet, or tables not set up.</p>
      </div>
    )
  }

  const normalised = (vehicles ?? []).map((v: R) => ({
    ...v,
    customer: Array.isArray(v.customer) ? v.customer[0] : v.customer,
    listing:  Array.isArray(v.listing)  ? v.listing[0]  : v.listing,
    build:    Array.isArray(v.customer_builds) ? v.customer_builds[0] ?? null : v.customer_builds,
  }))

  return (
    <div>
      <h1 className="text-2xl text-charcoal mb-6">Vehicles For Sale ({normalised.length})</h1>
      <VehiclesForSaleClient
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        vehicles={normalised as any}
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        allCustomers={(customers ?? []) as any}
      />
    </div>
  )
}
