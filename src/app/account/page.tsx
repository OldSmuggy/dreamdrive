import { redirect } from 'next/navigation'
import { createSupabaseServer } from '@/lib/supabase-server'
import AccountClient from './AccountClient'
import type { Listing } from '@/types'

export const metadata = { title: 'My Account' }

export default async function AccountPage() {
  const supabase = createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/account')

  const [savedVansRes, buildsRes, depositsRes, importsRes, profileRes] = await Promise.all([
    supabase.from('saved_vans').select('*, listing:listings(*)').eq('user_id', user.id).order('created_at', { ascending: false }),
    supabase.from('saved_builds').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
    supabase.from('deposit_holds').select('*, listing:listings(id, model_name, model_year, photos, source)').eq('user_id', user.id).order('created_at', { ascending: false }),
    supabase.from('import_orders').select('*, listing:listings(id, model_name, model_year, photos)').eq('user_id', user.id).order('created_at', { ascending: false }),
    supabase.from('profiles').select('*').eq('id', user.id).single(),
  ])

  return (
    <AccountClient
      user={{ id: user.id, email: user.email ?? '' }}
      profile={profileRes.data}
      savedVans={(savedVansRes.data ?? []) as Array<{ id: string; listing_id: string; created_at: string; listing: Listing | null }>}
      builds={buildsRes.data ?? []}
      depositHolds={depositsRes.data ?? []}
      importOrders={importsRes.data ?? []}
    />
  )
}
