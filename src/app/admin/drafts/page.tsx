import { createAdminClient } from '@/lib/supabase'
import type { Listing } from '@/types'
import DraftEditor from './DraftEditor'

export const metadata = { title: 'Draft Listings' }
export const dynamic = 'force-dynamic'

export default async function AdminDraftsPage() {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('listings')
    .select('*')
    .eq('status', 'draft')
    .order('created_at', { ascending: false })

  const drafts = (data ?? []) as Listing[]

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-3xl text-forest-900">Draft Listings</h1>
        <p className="text-gray-500 text-sm mt-1">
          {drafts.length > 0
            ? `${drafts.length} listing${drafts.length > 1 ? 's' : ''} waiting for review. Edit the content, then click Approve & Publish to make it live.`
            : 'No drafts — all listings are published.'}
        </p>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 text-sm text-amber-900">
        <p className="font-semibold mb-1">Manual entry mode</p>
        <p className="text-amber-800">
          AI extraction is currently disabled. Use CoWork to fill in fields automatically, or edit manually using the form below.
        </p>
      </div>

      <DraftEditor initial={drafts} />
    </div>
  )
}
