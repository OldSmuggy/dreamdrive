import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q')?.trim() ?? ''
  if (!q) return NextResponse.json([])

  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('listings')
    .select('id, model_name, model_year, chassis_code, photos, bid_no')
    .or(`model_name.ilike.%${q}%,chassis_code.ilike.%${q}%,bid_no.ilike.%${q}%`)
    .order('model_year', { ascending: false })
    .limit(10)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
