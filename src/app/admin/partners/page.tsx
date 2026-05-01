import { createAdminClient } from '@/lib/supabase'
import AdminPartnersClient from './AdminPartnersClient'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Referral Partners | Admin' }

export default async function AdminPartnersPage() {
  const supabase = createAdminClient()
  const { data } = await supabase.from('supplier_partners').select('*').order('created_at', { ascending: false })
  // Counts per partner
  const { data: listings } = await supabase.from('listings').select('supplier_partner_id, status').not('supplier_partner_id', 'is', null)
  const counts: Record<string, { total: number; sold: number }> = {}
  for (const l of (listings ?? [])) {
    const id = (l as { supplier_partner_id: string }).supplier_partner_id
    if (!counts[id]) counts[id] = { total: 0, sold: 0 }
    counts[id].total += 1
    if ((l as { status: string }).status === 'sold') counts[id].sold += 1
  }
  return <AdminPartnersClient initialPartners={data ?? []} counts={counts} />
}
