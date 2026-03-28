export const dynamic = 'force-dynamic'

import { createAdminClient } from '@/lib/supabase'
import { VanSubmission, TrustedSubmitter } from '@/types'
import VanSubmissionsClient from './VanSubmissionsClient'

export const metadata = { title: 'Van Submissions — Admin' }

export default async function VanSubmissionsPage() {
  const supabase = createAdminClient()

  const [{ data: submissions }, { data: trusted }] = await Promise.all([
    supabase
      .from('van_submissions')
      .select('*')
      .order('created_at', { ascending: false }),
    supabase
      .from('trusted_submitters')
      .select('*')
      .order('created_at', { ascending: false }),
  ])

  return (
    <div className="p-6 max-w-5xl">
      <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-charcoal">Van Submissions</h1>
          <p className="text-gray-500 text-sm mt-1">
            Customer-uploaded vans. Approve to create a live listing. Mark <strong>Trusted</strong> submitters to auto-publish future submissions.
          </p>
        </div>
        <a
          href="/submit-a-van"
          target="_blank"
          className="text-sm border border-ocean text-ocean rounded-lg px-3 py-1.5 hover:bg-ocean/5 transition-colors"
        >
          View public page →
        </a>
      </div>

      <VanSubmissionsClient
        submissions={(submissions ?? []) as VanSubmission[]}
        trustedSubmitters={(trusted ?? []) as TrustedSubmitter[]}
      />
    </div>
  )
}
