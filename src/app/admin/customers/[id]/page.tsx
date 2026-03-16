import { notFound } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase'
import CustomerDetailClient from './CustomerDetailClient'

export const metadata = { title: 'Customer Detail | Admin' }

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyRecord = Record<string, any>

export default async function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = createAdminClient()

  const { data: raw, error } = await supabase
    .from('customers')
    .select(`
      id, first_name, last_name, email, phone, state, notes, hubspot_id, created_at, updated_at,
      customer_vehicles(
        id, current_stage, stage_dates, admin_notes, notes, make, model, year, listing_id, build_id, created_at,
        listing:listings(id, model_name, model_year, chassis_code, photos, bid_no)
      ),
      customer_documents(id, filename, storage_path, file_type, description, uploaded_at, customer_vehicle_id)
    `)
    .eq('id', id)
    .is('archived_at', null)
    .single()

  if (error || !raw) notFound()

  const customer = raw as AnyRecord

  // Normalise Supabase join shape (may return array or object)
  const vehicles = ((customer.customer_vehicles ?? []) as AnyRecord[]).map(v => ({
    ...v,
    listing: Array.isArray(v.listing) ? (v.listing[0] ?? null) : v.listing,
  }))

  return (
    <CustomerDetailClient
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      customer={{ ...customer, customer_vehicles: vehicles } as any}
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      documents={(customer.customer_documents ?? []) as any}
    />
  )
}
