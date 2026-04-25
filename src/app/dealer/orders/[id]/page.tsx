import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createSupabaseServer } from '@/lib/supabase-server'
import { createAdminClient } from '@/lib/supabase'
import { formatCentsAud, FUNDS_ENTRY_LABELS, FUNDS_STATUS_STYLES, type FundsLedgerEntry } from '@/lib/funds'
import { DEALER_TIMELINE_STAGES, calculatePaymentSplit, tierLabel, gradeLabel } from '@/lib/dealer-pricing'

export const dynamic = 'force-dynamic'

export default async function DealerOrderDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const admin = createAdminClient()
  const { data: order } = await admin
    .from('dealer_orders')
    .select('*')
    .eq('id', id)
    .eq('dealer_user_id', user.id)
    .single()

  if (!order) notFound()

  const [{ data: stages }, { data: funds }, { data: listing }] = await Promise.all([
    admin.from('dealer_order_stages').select('*').eq('order_id', id).order('stage_index'),
    admin.from('funds_ledger').select('*').eq('user_id', user.id).eq('reference_type', 'dealer_order').eq('reference_id', id).order('created_at', { ascending: false }),
    order.source_listing_id
      ? admin.from('listings').select('id, model_name, model_year, mileage_km, photos').eq('id', order.source_listing_id).single()
      : Promise.resolve({ data: null }),
  ])

  const stageList = (stages ?? []) as Array<{ id: string; stage_key: string; status: string; entered_at: string | null; completed_at: string | null; planned_date: string | null; notes: string | null }>
  const fundsList = (funds ?? []) as FundsLedgerEntry[]
  const split = calculatePaymentSplit(order.wholesale_price_cents)
  const heldForOrder = fundsList.filter(f => f.status === 'held').reduce((s, f) => s + f.amount_cents, 0)

  return (
    <div className="space-y-6">
      <Link href="/dealer/orders" className="text-sm text-gray-400 hover:text-charcoal">← My Orders</Link>

      <div className="bg-white border border-gray-200 rounded-2xl p-6">
        <h1 className="text-2xl font-bold text-charcoal">{order.order_number}</h1>
        <p className="text-gray-500 text-sm">{tierLabel(order.tier as 'shell')} · {gradeLabel(order.vehicle_grade as 'mid')}</p>
        <p className="text-xs text-gray-400 mt-1 capitalize">Status: {order.status.replace('_', ' ')}</p>

        <div className="grid sm:grid-cols-3 gap-3 mt-5">
          <div className="bg-cream rounded-xl p-4">
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Wholesale</p>
            <p className="font-bold text-charcoal">{formatCentsAud(order.wholesale_price_cents)}</p>
          </div>
          <div className="bg-cream rounded-xl p-4">
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Recommended retail</p>
            <p className="font-bold text-charcoal">{formatCentsAud(order.retail_price_cents ?? 0)}</p>
          </div>
          <div className="bg-cream rounded-xl p-4">
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Your margin</p>
            <p className="font-bold text-ocean">{formatCentsAud(order.dealer_margin_cents ?? 0)}</p>
          </div>
        </div>
      </div>

      {/* Payment schedule */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6">
        <h2 className="font-bold text-charcoal mb-1">Payment schedule</h2>
        <p className="text-xs text-gray-500 mb-4">Funds held: <span className="font-semibold text-ocean">{formatCentsAud(heldForOrder)}</span> of {formatCentsAud(order.wholesale_price_cents)}</p>
        <div className="grid sm:grid-cols-3 gap-3">
          <div className="border border-gray-200 rounded-xl p-3">
            <p className="text-xs text-gray-500 uppercase mb-1">Deposit · 20%</p>
            <p className="font-bold text-charcoal">{formatCentsAud(split.deposit)}</p>
            <p className="text-xs text-gray-400 mt-1">On signing</p>
          </div>
          <div className="border border-gray-200 rounded-xl p-3">
            <p className="text-xs text-gray-500 uppercase mb-1">Progress · 35%</p>
            <p className="font-bold text-charcoal">{formatCentsAud(split.progress)}</p>
            <p className="text-xs text-gray-400 mt-1">Vehicle arrives</p>
          </div>
          <div className="border border-gray-200 rounded-xl p-3">
            <p className="text-xs text-gray-500 uppercase mb-1">Final · 45%</p>
            <p className="font-bold text-charcoal">{formatCentsAud(split.final)}</p>
            <p className="text-xs text-gray-400 mt-1">Before delivery</p>
          </div>
        </div>
      </div>

      {/* Vehicle (if linked) */}
      {listing && (
        <div className="bg-white border border-gray-200 rounded-2xl p-6">
          <h2 className="font-bold text-charcoal mb-3">Sourced vehicle</h2>
          <div className="flex gap-4 items-center">
            {(listing as { photos?: string[] }).photos?.[0] && (
              <div className="relative w-32 h-24 rounded-lg overflow-hidden shrink-0">
                <Image src={(listing as { photos: string[] }).photos[0]} alt="" fill className="object-cover" sizes="128px" />
              </div>
            )}
            <div>
              <p className="font-semibold text-charcoal">{(listing as { model_year: number | null }).model_year} {(listing as { model_name: string }).model_name}</p>
              <p className="text-sm text-gray-500">{(listing as { mileage_km: number | null }).mileage_km?.toLocaleString()} km</p>
              <Link href={`/van/${(listing as { id: string }).id}`} className="text-xs text-ocean hover:underline">View listing →</Link>
            </div>
          </div>
        </div>
      )}

      {/* Timeline */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6">
        <h2 className="font-bold text-charcoal mb-4">Timeline</h2>
        <div className="space-y-3">
          {DEALER_TIMELINE_STAGES.map(meta => {
            const stage = stageList.find(s => s.stage_key === meta.key)
            const status = stage?.status ?? 'upcoming'
            const statusCls = status === 'completed' ? 'bg-green-100 text-green-700'
              : status === 'current' ? 'bg-ocean text-white'
              : 'bg-gray-100 text-gray-400'
            const borderCls = status === 'current' ? 'border-ocean' : 'border-gray-200'
            return (
              <div key={meta.key} className={`flex gap-4 border ${borderCls} rounded-xl p-4`}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold shrink-0 ${statusCls}`}>
                  {status === 'completed' ? '✓' : meta.index}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <p className="font-semibold text-charcoal">{meta.label}</p>
                    <p className="text-xs text-gray-400">{meta.timing}</p>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">{meta.desc}</p>
                  {stage?.notes && <p className="text-xs text-charcoal mt-2 italic bg-cream rounded px-2 py-1">{stage.notes}</p>}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Funds for this order */}
      {fundsList.length > 0 && (
        <div>
          <h2 className="font-bold text-charcoal mb-3">Payments for this order</h2>
          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden divide-y divide-gray-100">
            {fundsList.map(e => {
              const status = FUNDS_STATUS_STYLES[e.status]
              return (
                <div key={e.id} className="p-4 flex items-center justify-between gap-3 flex-wrap">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-charcoal text-sm">{e.description}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${status.cls}`}>{status.label}</span>
                    </div>
                    <p className="text-xs text-gray-500">{new Date(e.created_at).toLocaleDateString('en-AU')} · {FUNDS_ENTRY_LABELS[e.entry_type]}</p>
                  </div>
                  <p className="font-bold text-charcoal whitespace-nowrap">{formatCentsAud(e.amount_cents)}</p>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {order.notes && (
        <div className="bg-cream border border-gray-200 rounded-2xl p-4">
          <p className="text-xs font-semibold text-gray-500 mb-1">Your notes</p>
          <p className="text-sm text-charcoal whitespace-pre-wrap">{order.notes}</p>
        </div>
      )}
    </div>
  )
}
