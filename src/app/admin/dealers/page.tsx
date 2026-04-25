import { createAdminClient } from '@/lib/supabase'
import AdminDealersClient from './AdminDealersClient'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Dealers | Admin' }

export default async function AdminDealersPage() {
  const supabase = createAdminClient()

  const { data: dealers } = await supabase
    .from('profiles')
    .select('id, first_name, last_name, phone, dealer_company_name, dealer_abn, dealer_territory, dealer_signed_at, dealer_invited_at, dealer_active, created_at')
    .eq('role', 'dealer')
    .order('created_at', { ascending: false })

  // Get order counts and totals per dealer
  const { data: orderCounts } = await supabase
    .from('dealer_orders')
    .select('dealer_user_id, wholesale_price_cents')

  const stats: Record<string, { count: number; total: number }> = {}
  for (const o of (orderCounts ?? [])) {
    const id = (o as { dealer_user_id: string }).dealer_user_id
    if (!stats[id]) stats[id] = { count: 0, total: 0 }
    stats[id].count += 1
    stats[id].total += (o as { wholesale_price_cents: number }).wholesale_price_cents ?? 0
  }

  return <AdminDealersClient initialDealers={dealers ?? []} stats={stats} />
}
