export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const files = formData.getAll('file') as File[]
    const addedBy = formData.get('added_by') as string | null
    const addedByRole = formData.get('added_by_role') as string | null

    if (!files.length) return NextResponse.json({ error: 'No files provided' }, { status: 400 })

    const supabase = createAdminClient()
    const results: { id: string; filename: string; pdfUrl: string }[] = []

    for (const file of files) {
      if (file.type !== 'application/pdf') continue
      if (file.size > 20 * 1024 * 1024) continue // skip files over 20MB

      const buffer = await file.arrayBuffer()
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
      const storagePath = `${Date.now()}-${safeName}`

      // Upload PDF to public bucket so it's viewable inline
      const { error: uploadErr } = await supabase.storage
        .from('customer-documents')
        .upload(`auction-sheets/${storagePath}`, buffer, {
          contentType: 'application/pdf',
          upsert: false,
        })

      if (uploadErr) {
        console.error(`[extract-pdf] Upload failed for ${file.name}:`, uploadErr.message)
        continue
      }

      const { data: urlData } = supabase.storage
        .from('customer-documents')
        .getPublicUrl(`auction-sheets/${storagePath}`)

      const pdfUrl = urlData?.publicUrl ?? ''

      // Create empty draft listing with PDF attached
      const { data: listing, error: insertErr } = await supabase
        .from('listings')
        .insert({
          source: 'auction',
          status: 'draft',
          model_name: file.name.replace(/\.pdf$/i, '').replace(/[_-]/g, ' ').trim() || 'New Upload — Fill Details',
          inspection_sheet: pdfUrl,
          auction_sheet_url: pdfUrl,
          auction_result: 'pending',
          photos: [],
          ...(addedBy && { added_by: addedBy }),
          ...(addedByRole && { added_by_role: addedByRole }),
        })
        .select('id')
        .single()

      if (insertErr) {
        console.error(`[extract-pdf] Insert failed for ${file.name}:`, insertErr.message)
        continue
      }

      results.push({ id: listing.id, filename: file.name, pdfUrl })
    }

    return NextResponse.json({
      count: results.length,
      listings: results,
    })
  } catch (err) {
    console.error('PDF upload error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
