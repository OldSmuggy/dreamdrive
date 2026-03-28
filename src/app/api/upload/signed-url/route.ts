export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'

const BUCKET = 'listing-images'

export async function POST(req: NextRequest) {
  try {
    const { filename, contentType } = await req.json()
    if (!filename || !contentType) {
      return NextResponse.json({ error: 'Missing filename or contentType' }, { status: 400 })
    }

    const ext = filename.split('.').pop()?.toLowerCase() || 'mp4'
    const safeName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
    const path = `listings/${safeName}`

    const supabase = createAdminClient()

    const { data, error } = await supabase.storage
      .from(BUCKET)
      .createSignedUploadUrl(path)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Also return the final public URL so the client knows what to save
    const { data: { publicUrl } } = supabase.storage.from(BUCKET).getPublicUrl(path)

    return NextResponse.json({
      signedUrl: data.signedUrl,
      token: data.token,
      path,
      publicUrl,
    })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
