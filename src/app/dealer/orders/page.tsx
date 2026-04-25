import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createSupabaseServer } from '@/lib/supabase-server'
import { createAdminClient } from '@/lib/supabase'
import { formatCentsAud } from '@/lib/funds'
import { tierLabel, gradeLabel } from '@/lib/dealer-pricing'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'My Orders' }

const STATUS_STYLES: Record<string, string> = {
  pending_deposit: 'bg-amber-100 text-amber-700',
  sourcing:        'bg-blue-100 text-blue-700',
  sourced:         'bg-blue-100 text-blue-700',
  shipping:        'bg-purple-100 text-purple-700',
  building:        'bg-purple-100 text-purple-700',
  ready:           'bg-green-100 text-green-700',
  delivered:       'bg-gray-100 text-gray-500',
  cancelled:       'bg-red-100 text-red-600',
}

export default async function DealerOrdersList() {
  const supabase = createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const admin = createAdminClient()
  const { data: orders } = await admin
    .from('dealer_orders')
    .select('*')
    .eq('dealer_user_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-charcoal">My Orders</h1>
          <p className="text-gray-500 text-sm mt-1">{orders?.length ?? 0} order{(orders?.length ?? 0) === 1 ? '' : 's'}</p>
        </div>
        <Link href="/dealer/orders/new" className="btn-primary text-sm px-4 py-2">+ Place New Order</Link>
      </div>

      {(orders?.length ?? 0) === 0 ? (
        <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center">
          <div className="text-5xl mb-3">📦</div>
          <p className="font-semibold text-charcoal mb-1">No orders yet</p>
          <p className="text-gray-500 text-sm mb-5">Place your first order and we&apos;ll start sourcing.</p>
          <Link href="/dealer/orders/new" className="btn-primary inline-block text-sm px-5 py-2">+ Place New Order</Link>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden divide-y divide-gray-100">
          {(orders ?? []).map(o => {
            const order = o as { id: string; order_number: string; tier: string; vehicle_grade: string; wholesale_price_cents: number; status: string; created_at: string }
            return (
              <Link key={order.id} href={`/dealer/orders/${order.id}`} className="block p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <p className="font-bold text-charcoal text-sm">{order.order_number}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_STYLES[order.status] ?? 'bg-gray-100 text-gray-600'}`}>
                        {order.status.replace('_', ' ')}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">{tierLabel(order.tier as 'shell')} · {gradeLabel(order.vehicle_grade as 'mid')}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{new Date(order.created_at).toLocaleDateString('en-AU')}</p>
                  </div>
                  <p className="font-bold text-charcoal whitespace-nowrap">{formatCentsAud(order.wholesale_price_cents)}</p>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
