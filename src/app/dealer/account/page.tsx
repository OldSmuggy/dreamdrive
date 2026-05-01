import { redirect } from 'next/navigation'
import { createSupabaseServer } from '@/lib/supabase-server'
import { createAdminClient } from '@/lib/supabase'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Account' }

export default async function DealerAccountPage() {
  const supabase = createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const admin = createAdminClient()
  const { data: profile } = await admin
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-charcoal">Account</h1>
        <p className="text-gray-500 text-sm mt-1">Your dealer profile and territory.</p>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-4">
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Company</p>
          <p className="font-bold text-charcoal text-lg">{profile?.dealer_company_name ?? '—'}</p>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Contact name</p>
            <p className="text-charcoal">{[profile?.first_name, profile?.last_name].filter(Boolean).join(' ') || '—'}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Email</p>
            <p className="text-charcoal">{user.email}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Phone</p>
            <p className="text-charcoal">{profile?.phone ?? '—'}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Territory</p>
            <p className="text-charcoal">{profile?.dealer_territory ?? '—'}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">ABN</p>
            <p className="text-charcoal">{profile?.dealer_abn ?? '—'}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Member since</p>
            <p className="text-charcoal">{profile?.created_at ? new Date(profile.created_at).toLocaleDateString('en-AU') : '—'}</p>
          </div>
        </div>
        <p className="text-xs text-gray-400 pt-3 border-t border-gray-100">
          To update your details or territory, email <a href="mailto:jared@dreamdrive.life" className="text-ocean hover:underline">jared@dreamdrive.life</a>.
        </p>
      </div>
    </div>
  )
}
