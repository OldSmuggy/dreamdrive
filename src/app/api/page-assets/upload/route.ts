export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const path = formData.get('path') as string | null

    if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 })
    if (file.size > 20 * 1024 * 1024) return NextResponse.json({ error: 'Max 20MB' }, { status: 400 })

    const supabase = createAdminClient()
    const ext = file.name.split('.').pop() ?? 'jpg'
    const storagePath = path || `uploads/${Date.now()}.${ext}`
    const bytes = await file.arrayBuffer()

    const { error: uploadErr } = await supabase.storage
      .from('page-assets')
      .upload(storagePath, bytes, { contentType: file.type, upsert: true })

    if (uploadErr) return NextResponse.json({ error: uploadErr.message }, { status: 500 })

    const { data } = supabase.storage.from('page-assets').getPublicUrl(storagePath)
    return NextResponse.json({ url: data.publicUrl })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
