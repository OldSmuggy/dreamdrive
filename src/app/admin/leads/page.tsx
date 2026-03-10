import { createAdminClient } from '@/lib/supabase'
import { centsToAud } from '@/lib/utils'
import type { Lead } from '@/types'

export const metadata = { title: 'Leads' }

export default async function AdminLeadsPage() {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('leads')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(200)

  const leads = (data ?? []) as Lead[]
  const newLeads = leads.filter(l => l.status === 'new')

  return (
    <div>
      <div className="flex items-baseline justify-between mb-6">
        <h1 className="font-display text-3xl text-forest-900">Leads</h1>
        <span className="text-sm text-gray-500">{newLeads.length} new · {leads.length} total</span>
      </div>

      {leads.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <div className="text-4xl mb-3">📭</div>
          <p>No leads yet. They'll appear here when customers book consultations or express interest.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {leads.map(lead => (
            <div key={lead.id} className={`bg-white border rounded-xl px-5 py-4 ${lead.status === 'new' ? 'border-forest-400 shadow-sm' : 'border-gray-200'}`}>
              <div className="flex items-start justify-between flex-wrap gap-2">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-gray-900">{lead.name ?? 'Anonymous'}</span>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                      lead.status === 'new' ? 'bg-forest-500 text-white' : 'bg-gray-200 text-gray-600'
                    }`}>{lead.status}</span>
                    <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded">{lead.type}</span>
                  </div>
                  <div className="flex gap-4 mt-1.5 text-sm text-gray-600 flex-wrap">
                    {lead.email && <a href={`mailto:${lead.email}`} className="hover:text-forest-600">{lead.email}</a>}
                    {lead.phone && <a href={`tel:${lead.phone}`} className="hover:text-forest-600">{lead.phone}</a>}
                  </div>
                  {lead.notes && <p className="text-sm text-gray-500 mt-1">{lead.notes}</p>}
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
          ))}
        </div>
      )}
    </div>
  )
}
