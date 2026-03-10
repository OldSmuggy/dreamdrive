import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const supabase = createAdminClient()

  let q = supabase.from('listings').select('*').eq('status', 'available').order('featured', { ascending: false }).order('auction_date').limit(200)

  const source = searchParams.get('source')
  if (source) q = q.in('source', source.split(','))

  const { data, error } = await q
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
