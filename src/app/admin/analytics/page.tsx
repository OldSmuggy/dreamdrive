export const dynamic = 'force-dynamic'

import { createAdminClient } from '@/lib/supabase'
import Link from 'next/link'

export const metadata = { title: 'Dashboard | Admin' }

export default async function DashboardPage() {
  const admin = createAdminClient()

  const now = new Date()
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()

  // Parallel queries — all wrapped to handle missing tables gracefully
  const [
    totalListingsRes,
    liveListingsRes,
    draftListingsRes,
    communityFindsRes,
    topViewedRes,
    stockAlertsRes,
    weekAlertsRes,
    monthAlertsRes,
    tipsRes,
    submissionsRes,
    recentAlertsRes,
    newListingsWeekRes,
    newListingsMonthRes,
    leadsRes,
    leadsWeekRes,
    customersRes,
    dealsRes,
    activeDealsRes,
    oldListingsRes,
    listingsBySourceRes,
    recentLeadsRes,
  ] = await Promise.all([
    // Listing counts
    admin.from('listings').select('*', { count: 'exact', head: true }),
    admin.from('listings').select('*', { count: 'exact', head: true }).eq('status', 'available'),
    admin.from('listings').select('*', { count: 'exact', head: true }).eq('status', 'draft'),
    admin.from('listings').select('*', { count: 'exact', head: true }).eq('is_community_find', true),

    // Top viewed
    admin
      .from('listings')
      .select('id, model_name, model_year, view_count, status, photos, created_at, mileage_km, aud_estimate')
      .eq('status', 'available')
      .order('view_count', { ascending: false, nullsFirst: false })
      .limit(8),

    // Stock alerts
    admin.from('stock_alerts').select('*', { count: 'exact', head: true }),
    admin.from('stock_alerts').select('*', { count: 'exact', head: true }).gte('created_at', weekAgo),
    admin.from('stock_alerts').select('*', { count: 'exact', head: true }).gte('created_at', monthAgo),

    // Tips & submissions
    admin.from('vehicle_tips').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    admin.from('van_submissions').select('*', { count: 'exact', head: true }).eq('status', 'pending_review'),

    // Recent alerts
    admin.from('stock_alerts').select('email, name, notes, created_at').order('created_at', { ascending: false }).limit(5),

    // New listings this week / month
    admin.from('listings').select('*', { count: 'exact', head: true }).gte('created_at', weekAgo),
    admin.from('listings').select('*', { count: 'exact', head: true }).gte('created_at', monthAgo),

    // Leads
    admin.from('leads').select('*', { count: 'exact', head: true }),
    admin.from('leads').select('*', { count: 'exact', head: true }).gte('created_at', weekAgo),

    // Customers
    admin.from('customers').select('*', { count: 'exact', head: true }),

    // Deals
    admin.from('deals').select('*', { count: 'exact', head: true }),
    admin.from('deals').select('*', { count: 'exact', head: true }).not('status', 'in', '("completed","cancelled","lost")'),

    // Old listings (over 30 days, still available)
    admin.from('listings').select('*', { count: 'exact', head: true })
      .eq('status', 'available')
      .lte('created_at', monthAgo),

    // Listings by source
    admin.from('listings').select('source, status').eq('status', 'available'),

    // Recent leads
    admin.from('leads').select('id, name, email, type, source, status, created_at, estimated_value').order('created_at', { ascending: false }).limit(5),
  ])

  // Safe counts
  const totalListings = totalListingsRes.count ?? 0
  const liveListings = liveListingsRes.count ?? 0
  const draftListings = draftListingsRes.count ?? 0
  const communityFinds = communityFindsRes.count ?? 0
  const stockAlerts = stockAlertsRes.count ?? 0
  const weekAlerts = weekAlertsRes.count ?? 0
  const monthAlerts = monthAlertsRes.count ?? 0
  const pendingTips = tipsRes.count ?? 0
  const pendingSubmissions = submissionsRes.count ?? 0
  const newListingsWeek = newListingsWeekRes.count ?? 0
  const newListingsMonth = newListingsMonthRes.count ?? 0
  const totalLeads = leadsRes.count ?? 0
  const weekLeads = leadsWeekRes.count ?? 0
  const totalCustomers = customersRes.count ?? 0
  const totalDeals = dealsRes.count ?? 0
  const activeDeals = activeDealsRes.count ?? 0
  const oldListings = oldListingsRes.count ?? 0

  const topViewed = topViewedRes.data ?? []
  const recentAlerts = recentAlertsRes.data ?? []
  const recentLeads = recentLeadsRes.data ?? []

  // Source breakdown
  const sourceData = listingsBySourceRes.data ?? []
  const sourceBreakdown: Record<string, number> = {}
  for (const row of sourceData) {
    sourceBreakdown[row.source] = (sourceBreakdown[row.source] || 0) + 1
  }

  // Calculate total views across all live listings
  const totalViews = topViewed.reduce((sum, v) => sum + (v.view_count ?? 0), 0)

  return (
    <div className="flex-1 p-2 md:p-6 overflow-y-auto">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-charcoal">Dashboard</h1>
            <p className="text-sm text-gray-400 mt-0.5">
              {now.toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
        </div>

        {/* Attention needed banner */}
        {(pendingTips > 0 || pendingSubmissions > 0 || draftListings > 0) && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
            <p className="font-semibold text-amber-900 text-sm mb-2">Needs your attention</p>
            <div className="flex flex-wrap gap-3">
              {pendingTips > 0 && (
                <Link href="/admin/vehicle-tips" className="flex items-center gap-1.5 text-sm text-amber-800 bg-amber-100 rounded-lg px-3 py-1.5 hover:bg-amber-200 transition-colors">
                  <span>💡</span> {pendingTips} pending tip{pendingTips !== 1 ? 's' : ''} to review
                </Link>
              )}
              {pendingSubmissions > 0 && (
                <Link href="/admin/van-submissions" className="flex items-center gap-1.5 text-sm text-amber-800 bg-amber-100 rounded-lg px-3 py-1.5 hover:bg-amber-200 transition-colors">
                  <span>📬</span> {pendingSubmissions} submission{pendingSubmissions !== 1 ? 's' : ''} to review
                </Link>
              )}
              {draftListings > 0 && (
                <Link href="/admin/drafts" className="flex items-center gap-1.5 text-sm text-amber-800 bg-amber-100 rounded-lg px-3 py-1.5 hover:bg-amber-200 transition-colors">
                  <span>📝</span> {draftListings} draft{draftListings !== 1 ? 's' : ''} to publish
                </Link>
              )}
            </div>
          </div>
        )}

        {/* ── Key Metrics ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6">
          <StatCard label="Live Listings" value={liveListings} icon="🚐" sub={`${newListingsWeek} new this week`} trend={newListingsWeek > 0 ? 'up' : undefined} />
          <StatCard label="Total Views" value={totalViews} icon="👁️" sub="across live listings" />
          <StatCard label="Stock Alerts" value={stockAlerts} icon="🔔" sub={`${weekAlerts} this week`} trend={weekAlerts > 0 ? 'up' : undefined} />
          <StatCard label="Leads" value={totalLeads} icon="📋" sub={`${weekLeads} this week`} trend={weekLeads > 0 ? 'up' : undefined} />
        </div>

        {/* ── Secondary Metrics ── */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-4 mb-6">
          <MiniStat label="Customers" value={totalCustomers} href="/admin/customers" />
          <MiniStat label="Active Deals" value={activeDeals} href="/admin/deals" />
          <MiniStat label="Drafts" value={draftListings} href="/admin/drafts" />
          <MiniStat label="Community Finds" value={communityFinds} />
          <MiniStat label="Stale (30d+)" value={oldListings} warn={oldListings > 5} />
        </div>

        {/* ── Source breakdown ── */}
        {Object.keys(sourceBreakdown).length > 0 && (
          <div className="bg-white border border-gray-100 rounded-xl p-5 mb-6">
            <h2 className="font-bold text-charcoal text-sm mb-3">Live Listings by Source</h2>
            <div className="flex flex-wrap gap-4">
              {Object.entries(sourceBreakdown)
                .sort((a, b) => b[1] - a[1])
                .map(([source, count]) => (
                  <div key={source} className="flex items-center gap-2">
                    <span className={`w-3 h-3 rounded-full ${sourceColour(source)}`} />
                    <span className="text-sm text-charcoal font-medium">{formatSource(source)}</span>
                    <span className="text-sm text-gray-400 font-mono">{count}</span>
                  </div>
                ))}
            </div>
          </div>
        )}

        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          {/* ── Top Viewed Vans ── */}
          <div className="bg-white border border-gray-100 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-charcoal">Most Popular Vans</h2>
              <Link href="/admin/listings" className="text-xs text-ocean hover:underline">View all</Link>
            </div>
            <div className="space-y-3">
              {topViewed.map((van, i) => (
                <Link key={van.id} href={`/van/${van.id}`} className="flex items-center gap-3 group">
                  <span className="text-gray-300 text-xs font-mono w-4 text-right">{i + 1}</span>
                  <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                    {van.photos?.[0] ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={van.photos[0]} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs">🚐</div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-charcoal truncate group-hover:text-ocean transition-colors">
                      {van.model_year ?? ''} {van.model_name}
                    </p>
                    <p className="text-xs text-gray-400">
                      {van.mileage_km ? `${(van.mileage_km / 1000).toFixed(0)}k km` : ''}
                      {van.aud_estimate ? ` · ~A$${Math.round((van.aud_estimate) / 100).toLocaleString()}` : ''}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-sm font-bold text-ocean">{(van.view_count ?? 0).toLocaleString()}</span>
                    <p className="text-[10px] text-gray-400">views</p>
                  </div>
                </Link>
              ))}
              {topViewed.length === 0 && (
                <p className="text-gray-400 text-sm py-4 text-center">No view data yet</p>
              )}
            </div>
          </div>

          {/* ── Recent Activity Feed ── */}
          <div className="space-y-6">
            {/* Recent leads */}
            <div className="bg-white border border-gray-100 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-charcoal">Recent Leads</h2>
                <Link href="/admin/leads" className="text-xs text-ocean hover:underline">View all</Link>
              </div>
              <div className="space-y-3">
                {recentLeads.map((lead) => (
                  <div key={lead.id} className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-ocean/10 text-ocean flex items-center justify-center text-xs font-bold shrink-0">
                      {leadIcon(lead.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-charcoal truncate">{lead.name || lead.email || 'Anonymous'}</p>
                      <p className="text-xs text-gray-400">
                        {formatLeadType(lead.type)}
                        {lead.source ? ` via ${lead.source}` : ''}
                        {lead.estimated_value ? ` · ~A$${Math.round(lead.estimated_value / 100).toLocaleString()}` : ''}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${statusColour(lead.status)}`}>
                        {lead.status}
                      </span>
                      <p className="text-[10px] text-gray-400 mt-0.5">
                        {timeAgo(lead.created_at)}
                      </p>
                    </div>
                  </div>
                ))}
                {recentLeads.length === 0 && (
                  <p className="text-gray-400 text-sm py-4 text-center">No leads yet</p>
                )}
              </div>
            </div>

            {/* Recent stock alert sign-ups */}
            <div className="bg-white border border-gray-100 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-charcoal">Recent Stock Alerts</h2>
                <span className="text-xs text-gray-400">{monthAlerts} this month</span>
              </div>
              <div className="space-y-3">
                {recentAlerts.map((alert, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-ocean/10 text-ocean flex items-center justify-center text-xs font-bold shrink-0">
                      {(alert.name || alert.email || '?')[0].toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-charcoal truncate">{alert.name || alert.email}</p>
                      {alert.name && <p className="text-xs text-gray-400 truncate">{alert.email}</p>}
                      {alert.notes && (
                        <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">&ldquo;{alert.notes}&rdquo;</p>
                      )}
                    </div>
                    <span className="text-[10px] text-gray-400 shrink-0">
                      {timeAgo(alert.created_at)}
                    </span>
                  </div>
                ))}
                {recentAlerts.length === 0 && (
                  <p className="text-gray-400 text-sm py-4 text-center">No sign-ups yet</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── Quick Actions ── */}
        <div className="bg-cream rounded-2xl p-5 mb-6">
          <h2 className="font-bold text-charcoal mb-4">Quick Actions</h2>
          <div className="flex flex-wrap gap-3">
            <ActionButton href="/admin/listings" label="Manage Listings" icon="🚐" />
            <ActionButton href="/admin/import" label="Import Vehicles" icon="📥" />
            <ActionButton href="/admin/scrape" label="Run Scraper" icon="🤖" />
            <ActionButton href="/admin/vehicle-tips" label="Review Tips" icon="💡" count={pendingTips} />
            <ActionButton href="/admin/van-submissions" label="Review Submissions" icon="📬" count={pendingSubmissions} />
            <ActionButton href="/admin/customers/add" label="Add Customer" icon="👤" />
            <WeeklyPicksButton />
          </div>
        </div>

        {/* ── Growth Snapshot ── */}
        <div className="bg-white border border-gray-100 rounded-2xl p-5">
          <h2 className="font-bold text-charcoal mb-4">This Month at a Glance</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <GlanceItem label="New listings added" value={newListingsMonth} />
            <GlanceItem label="Stock alert sign-ups" value={monthAlerts} />
            <GlanceItem label="Total deals" value={totalDeals} />
            <GlanceItem label="Listings over 30 days old" value={oldListings} warn={oldListings > 5} />
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Components ─────────────────────────────────────────────────

function StatCard({ label, value, sub, icon, trend }: {
  label: string; value: number; sub?: string; icon: string; trend?: 'up' | 'down'
}) {
  return (
    <div className="bg-white border border-gray-100 rounded-xl p-4 md:p-5">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-lg">{icon}</span>
        <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">{label}</p>
      </div>
      <p className="text-2xl md:text-3xl font-bold text-charcoal">{value.toLocaleString()}</p>
      {sub && (
        <p className={`text-xs font-medium mt-1 ${trend === 'up' ? 'text-green-600' : 'text-gray-400'}`}>
          {trend === 'up' && '↑ '}{sub}
        </p>
      )}
    </div>
  )
}

function MiniStat({ label, value, href, warn }: {
  label: string; value: number; href?: string; warn?: boolean
}) {
  const inner = (
    <div className={`rounded-xl border p-3 text-center ${warn ? 'border-amber-200 bg-amber-50' : 'border-gray-100 bg-white'} ${href ? 'hover:border-ocean transition-colors cursor-pointer' : ''}`}>
      <p className={`text-xl font-bold ${warn ? 'text-amber-600' : 'text-charcoal'}`}>{value.toLocaleString()}</p>
      <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wide mt-0.5">{label}</p>
    </div>
  )
  if (href) return <Link href={href}>{inner}</Link>
  return inner
}

function GlanceItem({ label, value, warn }: { label: string; value: number; warn?: boolean }) {
  return (
    <div className="text-center">
      <p className={`text-2xl font-bold ${warn ? 'text-amber-600' : 'text-charcoal'}`}>{value.toLocaleString()}</p>
      <p className="text-xs text-gray-400 mt-0.5">{label}</p>
    </div>
  )
}

function ActionButton({ href, label, icon, count }: { href: string; label: string; icon: string; count?: number }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm font-medium text-charcoal hover:border-ocean hover:text-ocean transition-colors"
    >
      <span>{icon}</span>
      <span>{label}</span>
      {count !== undefined && count > 0 && (
        <span className="bg-ocean/10 text-ocean text-xs font-bold px-1.5 py-0.5 rounded-full">{count}</span>
      )}
    </Link>
  )
}

function WeeklyPicksButton() {
  return (
    <form action="/api/admin/weekly-picks" method="POST">
      <input type="hidden" name="preview" value="false" />
      <button
        type="button"
        onClick={async (e) => {
          e.preventDefault()
          if (!confirm('Send the weekly auction picks email to all stock alert subscribers?')) return
          const res = await fetch('/api/admin/weekly-picks', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ preview: false }),
          })
          const data = await res.json()
          alert(data.ok ? `Sent! ${data.picks} vans to ${data.sent} subscribers` : data.message || 'No vans this week')
        }}
        className="flex items-center gap-2 px-4 py-2.5 bg-ocean text-white rounded-lg text-sm font-medium hover:bg-ocean/90 transition-colors"
      >
        <span>📧</span>
        <span>Send Weekly Picks</span>
      </button>
    </form>
  )
}

// ── Helpers ─────────────────────────────────────────────────────

function sourceColour(source: string): string {
  const colours: Record<string, string> = {
    auction: 'bg-purple-500',
    dealer_carsensor: 'bg-blue-500',
    dealer_goonet: 'bg-green-500',
    au_stock: 'bg-amber-500',
    customer_upload: 'bg-pink-500',
  }
  return colours[source] || 'bg-gray-400'
}

function formatSource(source: string): string {
  const names: Record<string, string> = {
    auction: 'Auction',
    dealer_carsensor: 'Car Sensor',
    dealer_goonet: 'Goo-net',
    au_stock: 'AU Stock',
    customer_upload: 'Customer Upload',
  }
  return names[source] || source
}

function statusColour(status: string): string {
  const colours: Record<string, string> = {
    new: 'bg-blue-100 text-blue-700',
    contacted: 'bg-amber-100 text-amber-700',
    qualified: 'bg-green-100 text-green-700',
    closed: 'bg-gray-100 text-gray-500',
  }
  return colours[status] || 'bg-gray-100 text-gray-500'
}

function leadIcon(type: string): string {
  const icons: Record<string, string> = {
    consultation: '💬',
    interest: '❤️',
    quiz_result: '🎯',
    finance_enquiry: '💰',
  }
  return icons[type] || '📋'
}

function formatLeadType(type: string): string {
  const names: Record<string, string> = {
    consultation: 'Consultation',
    interest: 'Interest',
    quiz_result: 'Quiz result',
    finance_enquiry: 'Finance enquiry',
  }
  return names[type] || type
}

function timeAgo(dateStr: string): string {
  const now = Date.now()
  const then = new Date(dateStr).getTime()
  const diffMs = now - then
  const mins = Math.floor(diffMs / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return new Date(dateStr).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })
}
