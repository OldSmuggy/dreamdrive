export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/api-auth'
import { createAdminClient } from '@/lib/supabase'

async function requireAdmin() {
  const { user, error: authErr } = await requireAuth()
  if (authErr) return { user: null, error: authErr }

  const admin = createAdminClient()
  const { data: profile } = await admin
    .from('user_profiles')
    .select('is_admin')
    .eq('id', user!.id)
    .single()
  const isAdmin = profile?.is_admin || user!.email?.endsWith('@dreamdrive.life')
  if (!isAdmin) return { user: null, error: NextResponse.json({ error: 'Admin only' }, { status: 403 }) }

  return { user: user!, error: null }
}

// ── GET: Single deal with all joins ──
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error: authErr } = await requireAdmin()
  if (authErr) return authErr

  const { id } = await params
  const admin = createAdminClient()

  const { data: deal, error } = await admin
    .from('deals')
    .select(`
      *,
      listing:listings(*),
      customer:user_profiles!deals_customer_id_fkey(id, first_name, last_name, phone),
      buyer:buyers(*)
    `)
    .eq('id', id)
    .single()

  if (error || !deal) {
    return NextResponse.json({ error: 'Deal not found' }, { status: 404 })
  }

  // Enrich with customer email from auth
  const { data: authUser } = await admin.auth.admin.getUserById(deal.customer_id)
  const enriched = {
    ...deal,
    customer: {
      ...(deal.customer as Record<string, unknown> || {}),
      email: authUser?.user?.email || null,
    },
  }

  return NextResponse.json(enriched)
}

// ── PATCH: Update deal fields ──
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error: authErr } = await requireAdmin()
  if (authErr) return authErr

  const { id } = await params
  const admin = createAdminClient()
  const body = await request.json()

  // Only allow updating safe fields
  const allowedFields = [
    'notes',
    'admin_notes',
    'buyer_id',
    'purchase_price_jpy',
    'purchase_price_aud',
  ]
  const updates: Record<string, unknown> = {}
  for (const field of allowedFields) {
    if (field in body) {
      updates[field] = body[field]
    }
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
  }

  updates.updated_at = new Date().toISOString()

  const { data: deal, error } = await admin
    .from('deals')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error || !deal) {
    return NextResponse.json({ error: error?.message || 'Deal not found' }, { status: error ? 500 : 404 })
  }

  return NextResponse.json(deal)
}
