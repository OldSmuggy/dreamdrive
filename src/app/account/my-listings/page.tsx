import { redirect } from 'next/navigation'
import { createSupabaseServer } from '@/lib/supabase-server'
import { createAdminClient } from '@/lib/supabase'
import MyListingsClient from './MyListingsClient'

export const metadata = { title: 'My Listings | Bare Camper' }

export const dynamic = 'force-dynamic'

export default async function MyListingsPage() {
  const supabase = createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/account/my-listings')

  const admin = createAdminClient()

  // Fetch this user's existing listings (all statuses)
  const { data: listings } = await admin
    .from('listings')
    .select('id, model_name, model_year, grade, body_colour, mileage_km, transmission, au_price_aud, photos, status, is_community_find, created_at, description, source_url, source_category')
    .eq('submitted_by', user.id)
    .order('created_at', { ascending: false })

  // Is this user a trusted submitter?
  const { data: trusted } = await admin
    .from('trusted_submitters')
    .select('id')
    .eq('email', user.email!.toLowerCase().trim())
    .maybeSingle()

  return (
    <div className="min-h-screen bg-cream">
      <div className="max-w-3xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <a href="/account" className="text-gray-400 hover:text-charcoal text-sm transition-colors">
            ← My Account
          </a>
        </div>
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-charcoal">My Listings</h1>
          <p className="text-gray-500 mt-2 leading-relaxed">
            List a van for sale through Bare Camper. Earn a{' '}
            <strong className="text-charcoal">$200 finders fee</strong> when a customer buys a Japanese van you&apos;ve listed, or when an Aussie-sourced van leads to a Bare Camper conversion.
          </p>
          {!!trusted && (
            <div className="mt-3 inline-flex items-center gap-2 bg-ocean/10 text-ocean text-sm px-3 py-1.5 rounded-full">
              <span>⚡</span>
              <span className="font-medium">Trusted Lister — your listings publish instantly</span>
            </div>
          )}
        </div>

        <MyListingsClient
          userId={user.id}
          userEmail={user.email ?? ''}
          isTrusted={!!trusted}
          initialListings={(listings ?? []) as MyListing[]}
        />
      </div>
    </div>
  )
}

// Minimal type used by the client — only what we select above
export interface MyListing {
  id: string
  model_name: string
  model_year: number | null
  grade: string | null
  body_colour: string | null
  mileage_km: number | null
  transmission: string | null
  au_price_aud: number | null
  photos: string[]
  status: string
  is_community_find: boolean
  created_at: string
  description: string | null
  source_url: string | null
  source_category: string | null
}
