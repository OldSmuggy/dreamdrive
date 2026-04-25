import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createSupabaseServer } from '@/lib/supabase-server'
import { createAdminClient } from '@/lib/supabase'
import { getUserFundsSummary, formatCentsAud } from '@/lib/funds'
import { tierLabel, gradeLabel, DEALER_TIMELINE_STAGES } from '@/lib/dealer-pricing'
import FundsBalanceCard from '@/components/funds/FundsBalanceCard'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Dashboard' }

const STAGE_LABELS = Object.fromEntries(DEALER_TIMELINE_STAGES.map(s => [s.key, s.label]))

export default async function DealerDashboard() {
  const supabase = createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const admin = createAdminClient()

  const [{ data: orders }, fundsSummary] = await Promise.all([
    admin.from('dealer_orders').select('*').eq('dealer_user_id', user.id).order('created_at', { ascending: false }),
    getUserFundsSummary(user.id),
  ])

  const orderList = orders ?? []
  const inProgress = orderList.filter(o => !['delivered', 'cancelled'].includes((o as { status: string }).status))
  const totalCommitted = orderList.reduce((s, o) => s + ((o as { wholesale_price_cents: number }).wholesale_price_cents ?? 0), 0)

  const latest = orderList[0] as undefined | { id: string; order_number: string; tier: string; vehicle_grade: string; status: string; wholesale_price_cents: number }

  // Get current stage of latest order
  let latestStageLabel: string | null = null
  if (latest) {
    const { data: stage } = await admin
      .from('dealer_order_stages')
      .select('stage_key')
      .eq('order_id', latest.id)
      .eq('status', 'current')
      .single()
    if (stage) latestStageLabel = STAGE_LABELS[(stage as { stage_key: string }).stage_key] ?? null
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-charcoal">Welcome back</h1>
        <p className="text-gray-500 text-sm mt-1">Here&apos;s where everything stands.</p>
      </div>

      {/* Top stats */}
      <div className="grid sm:grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200 rounded-2xl p-5">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Total orders</p>
          <p className="text-3xl font-bold text-charcoal">{orderList.length}</p>
          <p className="text-xs text-gray-400 mt-1">{inProgress.length} in progress</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-2xl p-5">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Committed</p>
          <p className="text-3xl font-bold text-charcoal">{formatCentsAud(totalCommitted)}</p>
          <p className="text-xs text-gray-400 mt-1">Wholesale across all orders</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-2xl p-5">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Funds held</p>
          <p className="text-3xl font-bold text-ocean">{formatCentsAud(fundsSummary.totalHeldCents)}</p>
          <p className="text-xs text-gray-400 mt-1">Ring-fenced safely</p>
        </div>
      </div>

      {/* Funds card */}
      <FundsBalanceCard summary={fundsSummary} variant="dealer" />

      {/* Latest order */}
      {latest && (
        <div className="bg-white border border-gray-200 rounded-2xl p-5">
          <div className="flex items-center justify-between gap-3 flex-wrap mb-3">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Latest order</p>
              <p className="font-bold text-charcoal">{latest.order_number} — {tierLabel(latest.tier as 'shell')}</p>
              <p className="text-xs text-gray-500 mt-0.5">{gradeLabel(latest.vehicle_grade as 'mid')} · {formatCentsAud(latest.wholesale_price_cents)}</p>
            </div>
            <Link href={`/dealer/orders/${latest.id}`} className="text-sm text-ocean font-medium hover:underline">
              View →
            </Link>
          </div>
          {latestStageLabel && (
            <div className="bg-cream rounded-xl px-4 py-3 text-sm">
              <span className="text-gray-500">Currently:</span> <span className="font-semibold text-charcoal">{latestStageLabel}</span>
            </div>
          )}
        </div>
      )}

      <div className="flex gap-3 flex-wrap">
        <Link href="/dealer/orders/new" className="btn-primary text-sm px-5 py-2.5">
          + Place New Order
        </Link>
        <Link href="/dealer/orders" className="border border-gray-300 text-charcoal text-sm font-medium px-5 py-2.5 rounded-lg hover:bg-gray-50">
          View All Orders
        </Link>
      </div>
    </div>
  )
}
