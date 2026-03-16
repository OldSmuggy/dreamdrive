import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase'
import { centsToAud } from '@/lib/utils'
import type { Lead } from '@/types'

export const metadata = { title: 'Leads' }

const TABS = [
  { label: 'All',            value: '' },
  { label: 'Consultation',   value: 'consultation' },
  { label: 'Deposit Intent', value: 'deposit_intent' },
  { label: 'Pop Top',        value: 'pop_top_booking' },
  { label: 'Enquiry',        value: 'enquiry' },
]

export default async function AdminLeadsPage({
  searchParams,
}: {
  searchParams: { type?: string }
}) {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('leads')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(200)

  const allLeads = (data ?? []) as Lead[]
  const activeTab = searchParams.type ?? ''
  const leads = activeTab
    ? allLeads.filter(l => (l.lead_type ?? l.type) === activeTab)
    : allLeads

  const newLeads = allLeads.filter(l => l.status === 'new')

  return (
    <div>
      <div className="flex items-baseline justify-between mb-6">
        <h1 className="font-display text-3xl text-forest-900">Leads</h1>
        <span className="text-sm text-gray-500">{newLeads.length} new · {allLeads.length} total</span>
      </div>

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {TABS.map(tab => (
          <Link
            key={tab.value}
            href={tab.value ? `/admin/leads?type=${tab.value}` : '/admin/leads'}
            className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${
              activeTab === tab.value
                ? 'bg-forest-700 text-white border-forest-700'
                : 'bg-white text-gray-600 border-gray-300 hover:border-forest-400'
            }`}
          >
            {tab.label}
            {tab.value === 'deposit_intent' && (
              <span className="ml-1.5 bg-amber-400 text-amber-900 text-xs font-bold px-1.5 py-0.5 rounded-full">
                {allLeads.filter(l => (l.lead_type ?? l.type) === 'deposit_intent').length}
              </span>
            )}
          </Link>
        ))}
      </div>

      {leads.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <div className="text-4xl mb-3">📭</div>
          <p>No leads yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {leads.map(lead => {
            const leadType = lead.lead_type ?? lead.type
            const isDeposit = leadType === 'deposit_intent'
            return (
              <div
                key={lead.id}
                className={`bg-white border rounded-xl px-5 py-4 ${
                  isDeposit
                    ? 'border-amber-400 bg-amber-50 shadow-sm'
                    : lead.status === 'new'
                    ? 'border-forest-400 shadow-sm'
                    : 'border-gray-200'
                }`}
              >
                <div className="flex items-start justify-between flex-wrap gap-2">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-gray-900">{lead.name ?? 'Anonymous'}</span>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                        lead.status === 'new' ? 'bg-forest-500 text-white' : 'bg-gray-200 text-gray-600'
                      }`}>{lead.status}</span>
                      {isDeposit && (
                        <span className="text-xs font-bold px-2 py-0.5 rounded bg-amber-400 text-amber-900">
                          Deposit Intent
                        </span>
                      )}
                      {!isDeposit && leadType && leadType !== 'consultation' && (
                        <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded">{leadType}</span>
                      )}
                    </div>
                    <div className="flex gap-4 mt-1.5 text-sm text-gray-600 flex-wrap">
                      {lead.email && <a href={`mailto:${lead.email}`} className="hover:text-forest-600">{lead.email}</a>}
                      {lead.phone && <a href={`tel:${lead.phone}`} className="hover:text-forest-600">{lead.phone}</a>}
                      {lead.state && <span className="text-gray-400">{lead.state}</span>}
                    </div>
                    {lead.notes && <p className="text-sm text-gray-500 mt-1">{lead.notes}</p>}
                    {lead.build_slug && (
                      <a
                        href={`/build/${lead.build_slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 mt-1.5 text-xs text-forest-600 hover:underline font-medium"
                      >
                        View Build →
                      </a>
                    )}
                  </div>
                  <div className="text-right text-sm shrink-0">
                    {lead.estimated_value && (
                      <p className="font-semibold text-forest-700">{centsToAud(lead.estimated_value)}</p>
                    )}
                    <p className="text-gray-400 text-xs mt-0.5">
                      {new Date(lead.created_at).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                    {lead.source && <p className="text-gray-400 text-xs">{lead.source}</p>}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
