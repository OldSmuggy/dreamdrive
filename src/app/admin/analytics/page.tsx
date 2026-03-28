export const dynamic = 'force-dynamic'

import { createAdminClient } from '@/lib/supabase'
import Link from 'next/link'

export const metadata = { title: 'Analytics | Admin' }

export default async function AnalyticsPage() {
  const admin = createAdminClient()

  // Parallel queries for all dashboard data
  const [
    { count: totalListings },
    { count: liveListings },
    { count: communityFinds },
    { data: topViewed },
    { count: stockAlerts },
    { count: tips },
    { count: submissions },
    { data: recentAlerts },
    { data: recentEnquiries },
  ] = await Promise.all([
    admin.from('listings').select('*', { count: 'exact', head: true }),
    admin.from('listings').select('*', { count: 'exact', head: true }).eq('status', 'available'),
    admin.from('listings').select('*', { count: 'exact', head: true }).eq('is_community_find', true),
    admin
      .from('listings')
      .select('id, model_name, model_year, view_count, status, photos')
      .eq('status', 'available')
      .order('view_count', { ascending: false })
      .limit(10),
    admin.from('stock_alerts').select('*', { count: 'exact', head: true }),
    admin.from('vehicle_tips').select('*', { count: 'exact', head: true }),
    admin.from('van_submissions').select('*', { count: 'exact', head: true }),
    admin.from('stock_alerts').select('email, name, notes, created_at').order('created_at', { ascending: false }).limit(10),
    admin.from('listings').select('id, model_name, model_year, view_count').eq('status', 'available').order('created_at', { ascending: false }).limit(5),
  ])

  // Get this week's alert sign-ups
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const { count: weekAlerts } = await admin
    .from('stock_alerts')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', weekAgo)

  return (
    <div className="flex-1 p-6 overflow-y-auto">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl font-bold text-charcoal mb-6">Dashboard</h1>

        {/* Stat cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard label="Live Listings" value={liveListings ?? 0} icon="🚐" />
          <StatCard label="Community Finds" value={communityFinds ?? 0} icon="🤝" />
          <StatCard label="Stock Alert Sign-ups" value={stockAlerts ?? 0} sub={`${weekAlerts ?? 0} this week`} icon="🔔" />
          <StatCard label="Van Tips" value={tips ?? 0} icon="💡" />
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Top viewed vans */}
          <div className="bg-white border border-gray-100 rounded-2xl p-5">
            <h2 className="font-bold text-charcoal mb-4">Top Viewed Vans</h2>
            <div className="space-y-3">
              {(topViewed ?? []).map((van, i) => (
                <div key={van.id} className="flex items-center gap-3">
                  <span className="text-gray-300 text-sm font-mono w-5 text-right">{i + 1}</span>
                  <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                    {van.photos?.[0] ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={van.photos[0]} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-300 text-sm">🚐</div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-charcoal truncate">
                      {van.model_year ?? ''} {van.model_name}
                    </p>
                  </div>
                  <span className="text-sm font-bold text-ocean">{van.view_count.toLocaleString()} views</span>
                </div>
              ))}
              {(!topViewed || topViewed.length === 0) && (
                <p className="text-gray-400 text-sm py-4 text-center">No view data yet</p>
              )}
            </div>
          </div>

          {/* Recent stock alert sign-ups */}
          <div className="bg-white border border-gray-100 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-charcoal">Recent Stock Alerts</h2>
              <span className="text-xs text-gray-400">{stockAlerts ?? 0} total</span>
            </div>
            <div className="space-y-3">
              {(recentAlerts ?? []).map((alert, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-ocean/10 text-ocean flex items-center justify-center text-xs font-bold shrink-0">
                    {(alert.name || alert.email)[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-charcoal truncate">{alert.name || alert.email}</p>
                    {alert.name && <p className="text-xs text-gray-400 truncate">{alert.email}</p>}
                    {alert.notes && (
                      <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">&ldquo;{alert.notes}&rdquo;</p>
                    )}
                  </div>
                  <span className="text-[10px] text-gray-400 shrink-0">
                    {new Date(alert.created_at).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })}
                  </span>
                </div>
              ))}
              {(!recentAlerts || recentAlerts.length === 0) && (
                <p className="text-gray-400 text-sm py-4 text-center">No sign-ups yet</p>
              )}
            </div>
          </div>
        </div>

        {/* Quick actions */}
        <div className="mt-8 bg-cream rounded-2xl p-5">
          <h2 className="font-bold text-charcoal mb-4">Quick Actions</h2>
          <div className="flex flex-wrap gap-3">
            <ActionButton href="/admin/listings" label="Manage Listings" icon="🚐" />
            <ActionButton href="/admin/vehicle-tips" label="Review Tips" icon="💡" count={tips ?? 0} />
            <ActionButton href="/admin/van-submissions" label="Review Submissions" icon="📬" count={submissions ?? 0} />
            <WeeklyPicksButton />
          </div>
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value, sub, icon }: { label: string; value: number; sub?: string; icon: string }) {
  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xl">{icon}</span>
        <p className="text-xs font-semibold text-gray-400 uppercase">{label}</p>
      </div>
      <p className="text-3xl font-bold text-charcoal">{value.toLocaleString()}</p>
      {sub && <p className="text-xs text-ocean font-medium mt-1">{sub}</p>}
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
          alert(data.ok ? `Sent! ${data.picks} vans → ${data.sent} subscribers` : data.message || 'No vans this week')
        }}
        className="flex items-center gap-2 px-4 py-2.5 bg-ocean text-white rounded-lg text-sm font-medium hover:bg-ocean/90 transition-colors"
      >
        <span>📧</span>
        <span>Send Weekly Picks</span>
      </button>
    </form>
  )
}
