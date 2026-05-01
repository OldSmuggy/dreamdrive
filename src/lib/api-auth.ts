import { NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase-server'
import { createAdminClient } from '@/lib/supabase'

/**
 * Require an authenticated user for API routes.
 * Returns the user object, or a 404 NextResponse if unauthenticated.
 * We return 404 (not 401/403) to avoid confirming resource existence.
 */
export async function requireAuth() {
  const supabase = createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { user: null, error: NextResponse.json({ error: 'Not found' }, { status: 404 }) }
  return { user, error: null }
}

/**
 * Require an authenticated ADMIN user for API routes.
 * Checks: (1) user is logged in, (2) email ends with @dreamdrive.life OR is_admin in profiles.
 * Returns 404 for non-admins to avoid confirming route existence.
 */
export async function requireAdmin() {
  const supabase = createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { user: null, error: NextResponse.json({ error: 'Not found' }, { status: 404 }) }

  // Fast path: dreamdrive.life emails are always admin
  if (user.email?.endsWith('@dreamdrive.life')) return { user, error: null }

  // Check profiles table for is_admin flag
  const admin = createAdminClient()
  const { data: profile } = await admin
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  if (!profile?.is_admin) {
    return { user: null, error: NextResponse.json({ error: 'Not found' }, { status: 404 }) }
  }

  return { user, error: null }
}

/**
 * Require an authenticated DEALER user for API routes.
 * Returns 404 if not logged in or not a dealer (or if dealer is inactive).
 */
export async function requireDealer() {
  const supabase = createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { user: null, profile: null, error: NextResponse.json({ error: 'Not found' }, { status: 404 }) }

  const admin = createAdminClient()
  const { data: profile } = await admin
    .from('profiles')
    .select('id, role, dealer_company_name, dealer_territory, dealer_active, is_admin')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'dealer' || profile.dealer_active === false) {
    return { user: null, profile: null, error: NextResponse.json({ error: 'Not found' }, { status: 404 }) }
  }

  return { user, profile, error: null }
}
