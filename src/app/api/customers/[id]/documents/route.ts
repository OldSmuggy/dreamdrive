import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: customer_id } = await params
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('customer_documents')
    .select('*')
    .eq('customer_id', customer_id)
    .order('uploaded_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: customer_id } = await params
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const description = formData.get('description') as string | null
    const vehicle_id = formData.get('vehicle_id') as string | null

    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

    const supabase = createAdminClient()
    const ext = file.name.split('.').pop() ?? ''
    const storagePath = `customers/${customer_id}/${Date.now()}-${file.name}`
    const bytes = await file.arrayBuffer()

    const { error: uploadError } = await supabase.storage
      .from('customer-documents')
      .upload(storagePath, bytes, { contentType: file.type, upsert: false })

    if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 })

    const { data: signedUrl } = supabase.storage
      .from('customer-documents')
      .getPublicUrl(storagePath)

    const { data, error } = await supabase
      .from('customer_documents')
      .insert({
        customer_id,
        customer_vehicle_id: vehicle_id || null,
        filename:    file.name,
        storage_path: storagePath,
        file_url:    signedUrl?.publicUrl ?? null,
        file_type:   ext,
        description: description || null,
      })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: customer_id } = await params
  const { searchParams } = req.nextUrl
  const docId = searchParams.get('docId')
  if (!docId) return NextResponse.json({ error: 'docId required' }, { status: 400 })

  const supabase = createAdminClient()

  // Get storage path first
  const { data: doc } = await supabase
    .from('customer_documents')
    .select('storage_path')
    .eq('id', docId)
    .eq('customer_id', customer_id)
    .single()

  if (doc?.storage_path) {
    await supabase.storage.from('customer-documents').remove([doc.storage_path])
  }

  const { error } = await supabase.from('customer_documents').delete().eq('id', docId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
