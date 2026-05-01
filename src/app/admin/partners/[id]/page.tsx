import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase'
import AdminPartnerDetailClient from './AdminPartnerDetailClient'

export const dynamic = 'force-dynamic'

export default async function AdminPartnerDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = createAdminClient()
  const [{ data: partner }, { data: listings }] = await Promise.all([
    supabase.from('supplier_partners').select('*').eq('id', id).single(),
    supabase.from('listings').select('id, model_name, model_year, mileage_km, photos, status, au_price_aud, source_url, created_at').eq('supplier_partner_id', id).order('created_at', { ascending: false }),
  ])
  if (!partner) notFound()
  return (
    <div className="space-y-6">
      <Link href="/admin/partners" className="text-sm text-gray-400 hover:text-charcoal">← Partners</Link>
      <AdminPartnerDetailClient partner={partner} listings={listings ?? []} />
    </div>
  )
}
