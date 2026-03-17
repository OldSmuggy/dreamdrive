import { NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase-server'

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
