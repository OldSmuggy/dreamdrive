export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase-server'
import { createAdminClient } from '@/lib/supabase'
import { sendEmail, emailTemplates } from '@/lib/email'

// GET — fetch the logged-in user's own listings
export async function GET() {
  const supabase = createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('listings')
    .select('id, model_name, model_year, body_colour, mileage_km, transmission, au_price_aud, photos, status, is_community_find, created_at, description, location_status')
    .eq('submitted_by', user.id)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// POST — create a new draft listing for the logged-in user
export async function POST(req: NextRequest) {
  const supabase = createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  try {
    const body = await req.json()
    const {
      model_name, model_year, body_type, body_colour,
      mileage_km, transmission, drive,
      au_price_aud, location, notes, photos,
    } = body

    if (!model_name) return NextResponse.json({ error: 'Model name is required' }, { status: 400 })
    if (!photos || photos.length < 6) return NextResponse.json({ error: 'Please upload at least 6 photos' }, { status: 400 })

    const admin = createAdminClient()

    // Check if this user's email is a trusted submitter → go live immediately
    const { data: trusted } = await admin
      .from('trusted_submitters')
      .select('id')
      .eq('email', user.email!.toLowerCase().trim())
      .maybeSingle()

    const isTrusted = !!trusted
    const listingStatus = isTrusted ? 'available' : 'draft'

    const auPriceCents = au_price_aud ? Math.round(parseFloat(au_price_aud) * 100) : null

    const { data: listing, error } = await admin
      .from('listings')
      .insert({
        source: 'customer_upload',
        model_name: model_name.trim(),
        model_year: model_year ? parseInt(model_year) : null,
        grade: body_type || null,
        body_colour: body_colour || null,
        mileage_km: mileage_km ? parseInt(mileage_km) : null,
        transmission: transmission || null,
        drive: drive || null,
        description: notes || null,
        au_price_aud: auPriceCents,
        photos,
        status: listingStatus,
        is_community_find: true,
        featured: false,
        submitted_by: user.id,
      })
      .select('id')
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // Notify Jared
    sendEmail({
      to: 'jared@dreamdrive.life',
      subject: `New customer listing ${isTrusted ? '(auto-published)' : '(draft)'} — ${model_year ? `${model_year} ` : ''}${model_name}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 2rem;">
          <h2 style="color: #2C2C2A;">New Customer Listing</h2>
          ${isTrusted ? '<p style="color: #3D6B73; font-weight: 600;">Auto-published (trusted submitter)</p>' : '<p style="color: #888;">Saved as draft — needs your approval to go live.</p>'}
          <p><strong>Submitted by:</strong> ${user.email}</p>
          <p><strong>Van:</strong> ${model_year ? `${model_year} ` : ''}${model_name}</p>
          <p><strong>Location:</strong> ${location || '—'}</p>
          <p><strong>Asking price:</strong> ${auPriceCents ? `$${(auPriceCents / 100).toLocaleString()} AUD` : '—'}</p>
          <p><strong>Photos:</strong> ${photos.length}</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 1rem 0;">
          <a href="https://barecamper.com.au/admin/listings" style="color: #3D6B73;">View in admin →</a>
        </div>
      `,
    }).catch(() => {})

    return NextResponse.json({ ok: true, id: listing.id, status: listingStatus, auto_published: isTrusted })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
