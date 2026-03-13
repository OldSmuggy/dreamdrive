import { NextResponse } from 'next/server'

// GET /api/health
// Returns env var presence (not values) and a Supabase connectivity check.
// Useful for diagnosing blank-page issues on Vercel.
export async function GET() {
  const env = {
    NEXT_PUBLIC_SUPABASE_URL:    !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY:   !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    SCRAPE_SECRET:               !!process.env.SCRAPE_SECRET,
    NINJA_LOGIN_ID:              !!process.env.NINJA_LOGIN_ID,
    NINJA_PASSWORD:              !!process.env.NINJA_PASSWORD,
  }

  // Quick Supabase ping
  let supabaseOk = false
  let supabaseError: string | null = null
  try {
    const { createAdminClient } = await import('@/lib/supabase')
    const supabase = createAdminClient()
    const { error } = await supabase.from('listings').select('id').limit(1)
    supabaseOk = !error
    if (error) supabaseError = error.message
  } catch (e) {
    supabaseError = String(e)
  }

  return NextResponse.json({
    ok: true,
    timestamp: new Date().toISOString(),
    env,
    supabase: { ok: supabaseOk, error: supabaseError },
  })
}
