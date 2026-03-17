import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: customer_id } = await params
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('customer_documents')
    .select('*')
    .eq('customer_id', customer_id)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: customer_id } = await params
  try {
    const formData = await req.formData()
    const file          = formData.get('file')          as File | null
    const name          = formData.get('name')          as string | null
    const document_type = formData.get('document_type') as string | null
    const vehicle_id    = formData.get('vehicle_id')    as string | null
    const notes         = formData.get('notes')         as string | null

    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

    const supabase = createAdminClient()
    const ext = file.name.split('.').pop()?.toLowerCase() ?? ''
    const storagePath = `customers/${customer_id}/${Date.now()}-${file.name}`
    const bytes = await file.arrayBuffer()

    const { error: uploadErr } = await supabase.storage
      .from('customer-documents')
      .upload(storagePath, bytes, { contentType: file.type, upsert: false })

    if (uploadErr) return NextResponse.json({ error: uploadErr.message }, { status: 500 })

    const { data: urlData } = supabase.storage
      .from('customer-documents')
      .getPublicUrl(storagePath)

    const fileType = ['pdf'].includes(ext)
      ? 'pdf'
      : ['jpg', 'jpeg', 'png', 'webp'].includes(ext)
        ? 'image'
        : 'other'

    const { data, error } = await supabase
      .from('customer_documents')
      .insert({
        customer_id,
        customer_vehicle_id: vehicle_id || null,
        name:                name || file.name,
        file_url:            urlData?.publicUrl ?? storagePath,
        file_type:           fileType,
        file_size_bytes:     file.size,
        document_type:       document_type || 'other',
        notes:               notes || null,
        customer_visible:    formData.get('customer_visible') === 'true',
      })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: customer_id } = await params
  try {
    const body = await req.json()
    if (!body.doc_id) return NextResponse.json({ error: 'doc_id required' }, { status: 400 })

    const supabase = createAdminClient()
    const payload: Record<string, unknown> = {}
    if (body.customer_visible !== undefined) payload.customer_visible = body.customer_visible
    if (body.name             !== undefined) payload.name             = body.name
    if (body.document_type    !== undefined) payload.document_type    = body.document_type
    if (body.notes            !== undefined) payload.notes            = body.notes

    const { data, error } = await supabase
      .from('customer_documents')
      .update(payload)
      .eq('id', body.doc_id)
      .eq('customer_id', customer_id)
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: customer_id } = await params
  const docId = req.nextUrl.searchParams.get('docId')
  if (!docId) return NextResponse.json({ error: 'docId required' }, { status: 400 })

  const supabase = createAdminClient()

  const { data: doc } = await supabase
    .from('customer_documents')
    .select('file_url')
    .eq('id', docId)
    .eq('customer_id', customer_id)
    .single()

  // Extract storage path from URL and delete from bucket
  if (doc?.file_url) {
    const match = doc.file_url.match(/\/customer-documents\/(.+)/)
    if (match) {
      await supabase.storage.from('customer-documents').remove([match[1]])
    }
  }

  const { error } = await supabase.from('customer_documents').delete().eq('id', docId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
