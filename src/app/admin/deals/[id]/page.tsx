import { createAdminClient } from '@/lib/supabase'
import { notFound } from 'next/navigation'
import DealDetailClient from './DealDetailClient'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Deal Detail | Admin' }

export default async function DealDetailPage({ params }: { params: { id: string } }) {
  const { id } = params
  const supabase = createAdminClient()

  const { data: deal, error } = await supabase
    .from('deals')
    .select(`
      id, listing_id, customer_id, buyer_id, customer_vehicle_id,
      status, notes, admin_notes,
      purchase_price_jpy, purchase_price_aud,
      created_at, updated_at,
      listing:listings(
        id, model_name, model_year, grade, mileage_km, photos, status,
        transmission, drive, displacement_cc, body_colour, inspection_score,
        start_price_jpy, kaijo_code, auction_date
      ),
      customer:customers(id, first_name, last_name, email, phone, state),
      buyer:buyers(id, name, email, phone, whatsapp_number, company, region, is_active)
    `)
    .eq('id', id)
    .single()

  if (error || !deal) notFound()

  return <DealDetailClient deal={deal as any} />
}
