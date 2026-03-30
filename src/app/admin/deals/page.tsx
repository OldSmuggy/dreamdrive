import { createAdminClient } from '@/lib/supabase'
import DealsClient from './DealsClient'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Deals | Admin' }

export default async function DealsPage() {
  const supabase = createAdminClient()

  const { data: deals, error } = await supabase
    .from('deals')
    .select(`
      id, listing_id, customer_id, buyer_id, customer_vehicle_id,
      status, notes, admin_notes,
      purchase_price_jpy, purchase_price_aud,
      created_at, updated_at,
      listing:listings(id, model_name, model_year, grade, mileage_km, photos, status),
      customer:customers(id, first_name, last_name, email, phone, state),
      buyer:buyers(id, name, email, phone, whatsapp_number, company, is_active)
    `)
    .order('created_at', { ascending: false })

  if (error) {
    return (
      <div>
        <h1 className="text-2xl text-charcoal mb-4">Deals</h1>
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-sm text-amber-800">
          <p className="font-semibold mb-2">Database setup required.</p>
          <p className="mb-3">Run the deals migration in Supabase, then refresh.</p>
          <p className="text-xs text-amber-600">Error: {error.message}</p>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl text-charcoal">
          Deals{' '}
          <span className="text-gray-400 font-sans text-lg font-normal">
            ({deals?.length ?? 0})
          </span>
        </h1>
      </div>
      <DealsClient deals={(deals ?? []) as any} />
    </div>
  )
}
