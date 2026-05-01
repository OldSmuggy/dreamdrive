import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase'
import AdminDealerOrderClient from './AdminDealerOrderClient'

export const dynamic = 'force-dynamic'

export default async function AdminDealerOrderDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = createAdminClient()

  const { data: order } = await supabase
    .from('dealer_orders')
    .select('*, profiles:profiles!dealer_orders_dealer_user_id_fkey(first_name, last_name, dealer_company_name, dealer_territory, phone)')
    .eq('id', id)
    .single()

  if (!order) notFound()

  const [{ data: stages }, { data: funds }] = await Promise.all([
    supabase.from('dealer_order_stages').select('*').eq('order_id', id).order('stage_index'),
    supabase.from('funds_ledger').select('*').eq('reference_type', 'dealer_order').eq('reference_id', id).order('created_at', { ascending: false }),
  ])

  return (
    <div className="space-y-6">
      <Link href="/admin/dealer-orders" className="text-sm text-gray-400 hover:text-charcoal">← Dealer Orders</Link>
      <AdminDealerOrderClient order={order} stages={stages ?? []} funds={funds ?? []} />
    </div>
  )
}
