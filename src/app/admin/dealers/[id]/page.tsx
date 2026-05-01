import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase'
import { formatCentsAud, FUNDS_ENTRY_LABELS, FUNDS_STATUS_STYLES, type FundsLedgerEntry } from '@/lib/funds'
import { tierLabel, gradeLabel } from '@/lib/dealer-pricing'

export const dynamic = 'force-dynamic'

export default async function AdminDealerDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = createAdminClient()

  const [{ data: profile }, { data: orders }, { data: funds }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', id).single(),
    supabase.from('dealer_orders').select('*').eq('dealer_user_id', id).order('created_at', { ascending: false }),
    supabase.from('funds_ledger').select('*').eq('user_id', id).order('created_at', { ascending: false }),
  ])

  if (!profile) notFound()

  const funded = (funds ?? []) as FundsLedgerEntry[]
  const totalHeld = funded.filter(f => f.status === 'held').reduce((s, f) => s + f.amount_cents, 0)
  const orderCount = orders?.length ?? 0
  const totalOrderValue = (orders ?? []).reduce((s, o) => s + ((o as { wholesale_price_cents: number }).wholesale_price_cents ?? 0), 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/dealers" className="text-sm text-gray-400 hover:text-charcoal">← Dealers</Link>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl p-6">
        <h1 className="text-2xl font-bold text-charcoal mb-1">{profile.dealer_company_name ?? 'Unnamed dealer'}</h1>
        <p className="text-gray-500 text-sm">
          {[profile.first_name, profile.last_name].filter(Boolean).join(' ') || 'No contact name'}
          {profile.phone && ` · ${profile.phone}`}
          {profile.dealer_territory && ` · ${profile.dealer_territory}`}
        </p>
        {profile.dealer_abn && <p className="text-xs text-gray-400 mt-1">ABN {profile.dealer_abn}</p>}

        <div className="grid sm:grid-cols-3 gap-4 mt-6">
          <div className="bg-cream rounded-xl p-4">
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Orders</p>
            <p className="text-2xl font-bold text-charcoal">{orderCount}</p>
          </div>
          <div className="bg-cream rounded-xl p-4">
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Order value</p>
            <p className="text-2xl font-bold text-charcoal">{formatCentsAud(totalOrderValue)}</p>
          </div>
          <div className="bg-cream rounded-xl p-4">
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Held funds</p>
            <p className="text-2xl font-bold text-ocean">{formatCentsAud(totalHeld)}</p>
          </div>
        </div>
      </div>

      <section>
        <h2 className="font-bold text-charcoal mb-3">Orders</h2>
        {orderCount === 0 ? (
          <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center text-gray-400 text-sm">No orders yet.</div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden divide-y divide-gray-100">
            {(orders ?? []).map(o => {
              const order = o as { id: string; order_number: string; tier: string; vehicle_grade: string; wholesale_price_cents: number; status: string; created_at: string }
              return (
                <Link key={order.id} href={`/admin/dealer-orders/${order.id}`} className="block p-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between gap-4 flex-wrap">
                    <div>
                      <p className="font-semibold text-charcoal text-sm">{order.order_number} — {tierLabel(order.tier as 'shell')}</p>
                      <p className="text-xs text-gray-500">{gradeLabel(order.vehicle_grade as 'mid')} · {order.status.replace('_', ' ')}</p>
                    </div>
                    <p className="font-bold text-charcoal">{formatCentsAud(order.wholesale_price_cents)}</p>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </section>

      <section>
        <h2 className="font-bold text-charcoal mb-3">Funds Ledger</h2>
        {funded.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center text-gray-400 text-sm">No funds entries yet.</div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden divide-y divide-gray-100">
            {funded.map(e => {
              const status = FUNDS_STATUS_STYLES[e.status]
              return (
                <div key={e.id} className="p-4 flex items-center justify-between gap-3 flex-wrap">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-charcoal text-sm">{e.description}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${status.cls}`}>{status.label}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {new Date(e.created_at).toLocaleDateString('en-AU')} · {FUNDS_ENTRY_LABELS[e.entry_type]}
                    </p>
                  </div>
                  <p className="font-bold text-charcoal whitespace-nowrap">{formatCentsAud(e.amount_cents)}</p>
                </div>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}
