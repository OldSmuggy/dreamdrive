import { redirect } from 'next/navigation'
import { createSupabaseServer } from '@/lib/supabase-server'
import { createAdminClient } from '@/lib/supabase'
import DealerNav from './DealerNav'

export const metadata = { title: { template: '%s | Dealer Portal — Bare Camper', default: 'Dealer Portal' } }

export default async function DealerLayout({ children }: { children: React.ReactNode }) {
  const supabase = createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/dealer')

  const admin = createAdminClient()
  const { data: profile } = await admin
    .from('profiles')
    .select('role, dealer_active, dealer_company_name, dealer_territory')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'dealer' || profile.dealer_active === false) {
    // Not a dealer — bounce them somewhere safe (404 page would be nicer)
    redirect('/account')
  }

  return (
    <div className="min-h-screen flex">
      <DealerNav companyName={profile.dealer_company_name} territory={profile.dealer_territory} />
      <main className="flex-1 bg-gray-50 overflow-auto min-w-0">
        <div className="max-w-5xl mx-auto px-4 md:px-6 py-8 pt-16 md:pt-8">
          {children}
        </div>
      </main>
    </div>
  )
}
