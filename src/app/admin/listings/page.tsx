import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase'
import type { Listing } from '@/types'
import ListingEditor from './ListingEditor'

export const metadata = { title: 'Listings' }
export const dynamic = 'force-dynamic'

export default async function AdminListingsPage() {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('listings')
    .select('*')
    .neq('status', 'draft')
    .order('created_at', { ascending: false })
    .limit(200)
  const listings = (data ?? []) as Listing[]

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-3xl text-forest-900">Listings</h1>
          <p className="text-gray-500 text-sm mt-1">{listings.length} listings · click Edit on any row to update details, images or status</p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/listings/upload" className="btn-primary btn-sm text-sm">
            📄 Upload Auction PDF
          </Link>
          <form action="/api/scrape" method="POST">
            <button type="submit" className="btn-primary btn-sm text-sm">
              ▶ Trigger NINJA Scrape
            </button>
          </form>
        </div>
      </div>

      <ListingEditor initial={listings} />
    </div>
  )
}
