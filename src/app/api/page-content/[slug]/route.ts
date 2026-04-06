export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'
import { requireAdmin } from '@/lib/api-auth'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('page_content')
    .select('content_key, value')
    .eq('page_slug', slug)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const content: Record<string, string> = {}
  for (const row of data ?? []) {
    content[row.content_key] = row.value ?? ''
  }
  return NextResponse.json(content)
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { error } = await requireAdmin()
  if (error) return error

  const { slug } = await params
  try {
    const body = await req.json() as Record<string, string>
    const supabase = createAdminClient()

    for (const [key, value] of Object.entries(body)) {
      await supabase
        .from('page_content')
        .upsert(
          { page_slug: slug, content_key: key, value: value ?? '', updated_at: new Date().toISOString() },
          { onConflict: 'page_slug,content_key' },
        )
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
