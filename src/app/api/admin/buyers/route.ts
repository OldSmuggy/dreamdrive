export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/api-auth'
import { createAdminClient } from '@/lib/supabase'

export async function GET() {
  const { user, error: authErr } = await requireAuth()
  if (authErr) return authErr

  const admin = createAdminClient()
  const { data: profile } = await admin
    .from('user_profiles')
    .select('is_admin')
    .eq('id', user!.id)
    .single()
  const isAdmin = profile?.is_admin || user!.email?.endsWith('@dreamdrive.life')
  if (!isAdmin) return NextResponse.json({ error: 'Admin only' }, { status: 403 })

  const { data: buyers, error } = await admin
    .from('buyers')
    .select('*')
    .eq('is_active', true)
    .order('name')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json(buyers)
}

export async function POST(request: NextRequest) {
  const { user, error: authErr } = await requireAuth()
  if (authErr) return authErr

  const admin = createAdminClient()
  const { data: profile } = await admin
    .from('user_profiles')
    .select('is_admin')
    .eq('id', user!.id)
    .single()
  const isAdmin = profile?.is_admin || user!.email?.endsWith('@dreamdrive.life')
  if (!isAdmin) return NextResponse.json({ error: 'Admin only' }, { status: 403 })

  const body = await request.json()
  const { name, email, phone, whatsapp_number, company, region, notes } = body as {
    name: string
    email: string
    phone?: string
    whatsapp_number?: string
    company?: string
    region?: string
    notes?: string
  }

  if (!name || !email) {
    return NextResponse.json({ error: 'name and email are required' }, { status: 400 })
  }

  const { data: buyer, error } = await admin
    .from('buyers')
    .insert({
      name,
      email,
      phone: phone || null,
      whatsapp_number: whatsapp_number || null,
      company: company || null,
      region: region || null,
      notes: notes || null,
      is_active: true,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json(buyer, { status: 201 })
}
