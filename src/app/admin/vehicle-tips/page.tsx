export const dynamic = 'force-dynamic'

import { createAdminClient } from '@/lib/supabase'
import { VehicleTip } from '@/types'
import VehicleTipsClient from './VehicleTipsClient'

export const metadata = { title: 'Vehicle Tips — Admin' }

export default async function VehicleTipsPage() {
  const supabase = createAdminClient()

  const { data: tips } = await supabase
    .from('vehicle_tips')
    .select('*, listing:matched_listing_id(id, model_name, model_year)')
    .order('created_at', { ascending: false })

  return (
    <div className="p-6 max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-charcoal">Van Tips — Finders Fee</h1>
          <p className="text-gray-500 text-sm mt-1">
            Customer-submitted vans. Mark as <strong>Paid</strong> to trigger the $200 fee email.
          </p>
        </div>
        <a
          href="/tip-a-van"
          target="_blank"
          className="btn-sm border border-ocean text-ocean rounded-lg px-3 py-1.5 text-sm hover:bg-ocean/5 transition-colors"
        >
          View public page →
        </a>
      </div>
      <VehicleTipsClient tips={(tips ?? []) as VehicleTip[]} />
    </div>
  )
}
