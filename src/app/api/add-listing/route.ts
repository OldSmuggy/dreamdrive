import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    const {
      source,
      model_name,
      grade,
      chassis_code,
      model_year,
      body_colour,
      transmission,
      drive,
      displacement_cc,
      mileage_km,
      inspection_score,
      start_price_jpy,
      buy_price_jpy,
      au_price_aud,
      aud_estimate,
      auction_date,
      kaijo_code,
      auction_count,
      bid_no,
      description,
      photos,
      has_nav,
      has_leather,
      has_sunroof,
      has_alloys,
      au_status,
      eta_date,
      featured,
    } = body

    if (!model_name) {
      return NextResponse.json({ error: 'Model name is required' }, { status: 400 })
    }
    if (!source) {
      return NextResponse.json({ error: 'Source is required' }, { status: 400 })
    }

    // Parse photo URLs — split by newline or comma
    const photoList = typeof photos === 'string'
      ? photos.split(/[\n,]/).map((u: string) => u.trim()).filter(Boolean)
      : (photos ?? [])

    // Convert AUD price to cents
    const auPriceCents = au_price_aud ? Math.round(parseFloat(au_price_aud) * 100) : null
    const audEstimateCents = aud_estimate ? Math.round(parseFloat(aud_estimate) * 100) : null

    const supabase = createAdminClient()

    const { data, error } = await supabase
      .from('listings')
      .insert({
        source,
        model_name: model_name.trim().toUpperCase(),
        grade: grade?.trim() || null,
        chassis_code: chassis_code?.trim() || null,
        model_year: model_year ? parseInt(model_year) : null,
        body_colour: body_colour?.trim() || null,
        transmission: transmission || null,
        drive: drive || null,
        displacement_cc: displacement_cc ? parseInt(displacement_cc) : null,
        mileage_km: mileage_km ? parseInt(mileage_km) : null,
        inspection_score: inspection_score || null,
        start_price_jpy: start_price_jpy ? parseInt(start_price_jpy) : null,
        buy_price_jpy: buy_price_jpy ? parseInt(buy_price_jpy) : null,
        au_price_aud: auPriceCents,
        aud_estimate: audEstimateCents,
        auction_date: auction_date || null,
        kaijo_code: kaijo_code || null,
        auction_count: auction_count || null,
        bid_no: bid_no || null,
        description: description?.trim() || null,
        photos: photoList,
        has_nav: has_nav ?? false,
        has_leather: has_leather ?? false,
        has_sunroof: has_sunroof ?? false,
        has_alloys: has_alloys ?? false,
        au_status: au_status || null,
        eta_date: eta_date || null,
        featured: featured ?? false,
        status: 'available',
        scraped_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, id: data.id })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
