import { createAdminClient } from '@/lib/supabase-server'
import { centsToAud, sourceLabel } from '@/lib/utils'
import type { Listing } from '@/types'

export const metadata = { title: 'Listings' }

export default async function AdminListingsPage() {
  const supabase = createAdminClient()
  const { data } = await supabase.from('listings').select('*').order('created_at', { ascending: false }).limit(200)
  const listings = (data ?? []) as Listing[]

  const bySource = {
    au_stock: listings.filter(l => l.source === 'au_stock'),
    auction:  listings.filter(l => l.source === 'auction'),
    dealer:   listings.filter(l => l.source.startsWith('dealer')),
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-3xl text-forest-900">Listings</h1>
          <p className="text-gray-500 text-sm mt-1">{listings.length} total</p>
        </div>
        <div className="flex gap-3">
          <form action="/api/scrape" method="POST">
            <button type="submit"
              className="btn-primary btn-sm text-sm">
              ▶ Trigger NINJA Scrape
            </button>
          </form>
        </div>
      </div>

      {/* AU Stock */}
      <section className="mb-8">
        <h2 className="font-display text-xl text-forest-800 mb-3">AU Stock ({bySource.au_stock.length})</h2>
        <div className="space-y-2">
          {bySource.au_stock.map(l => <ListingRow key={l.id} listing={l} />)}
          {bySource.au_stock.length === 0 && <p className="text-gray-400 text-sm">No AU stock vans. Add via Supabase → listings table.</p>}
        </div>
      </section>

      {/* Auction */}
      <section className="mb-8">
        <h2 className="font-display text-xl text-forest-800 mb-3">Japan Auction ({bySource.auction.length})</h2>
        <div className="space-y-1">
          {bySource.auction.slice(0, 50).map(l => <ListingRow key={l.id} listing={l} />)}
          {bySource.auction.length > 50 && <p className="text-gray-400 text-sm">…and {bySource.auction.length - 50} more</p>}
          {bySource.auction.length === 0 && <p className="text-gray-400 text-sm">No auction listings. Run the NINJA scrape.</p>}
        </div>
      </section>

      {/* Dealer */}
      <section>
        <h2 className="font-display text-xl text-forest-800 mb-3">Japan Dealers ({bySource.dealer.length})</h2>
        <div className="space-y-1">
          {bySource.dealer.slice(0, 30).map(l => <ListingRow key={l.id} listing={l} />)}
          {bySource.dealer.length === 0 && <p className="text-gray-400 text-sm">No dealer listings yet. Car Sensor / Goo-Net integration in Phase 2.</p>}
        </div>
      </section>
    </div>
  )
}

function ListingRow({ listing }: { listing: Listing }) {
  const price = listing.source === 'au_stock' && listing.au_price_aud
    ? centsToAud(listing.au_price_aud)
    : listing.aud_estimate ? `~${centsToAud(listing.aud_estimate)}`
    : listing.start_price_jpy ? `¥${listing.start_price_jpy.toLocaleString()}`
    : '—'

  return (
    <div className="flex items-center gap-4 bg-white border border-gray-200 rounded-lg px-4 py-3 text-sm">
      <span className={`shrink-0 text-xs font-bold px-2 py-0.5 rounded text-white ${
        listing.source === 'au_stock' ? 'bg-forest-600' : listing.source === 'auction' ? 'bg-amber-500' : 'bg-blue-600'
      }`}>
        {sourceLabel(listing.source)}
      </span>
      <span className="flex-1 font-medium text-gray-800 truncate">{listing.model_name}</span>
      <span className="text-gray-500 shrink-0">{listing.model_year ?? '—'}</span>
      <span className="text-gray-500 shrink-0">{listing.mileage_km?.toLocaleString() ?? '—'} km</span>
      <span className="text-gray-500 shrink-0">{listing.inspection_score ?? '—'}</span>
      <span className="text-forest-700 font-semibold shrink-0">{price}</span>
      <span className={`text-xs px-2 py-0.5 rounded shrink-0 ${
        listing.status === 'available' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
      }`}>{listing.status}</span>
    </div>
  )
}
