export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function POST(req: NextRequest) {
  try {
    // Auth check
    const cookieStore = cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { get(name: string) { return cookieStore.get(name)?.value }, set() {}, remove() {} } }
    )
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const admin = createAdminClient()

    // Check role
    const { data: profile } = await admin.from('user_profiles').select('role').eq('id', user.id).single()
    const isAgent = profile?.role === 'buyer_agent'
    const isAdmin = profile?.role === 'admin' || user.email?.endsWith('@dreamdrive.life')
    if (!isAgent && !isAdmin) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
    }

    const body = await req.json()
    const {
      source, model_name, grade, chassis_code, model_year, body_colour,
      transmission, drive, displacement_cc, mileage_km, inspection_score,
      start_price_jpy, buy_price_jpy, aud_estimate,
      auction_date, auction_time, kaijo_code, auction_count, bid_no,
      description, photos, assign_customer_id,
    } = body

    if (!model_name) {
      return NextResponse.json({ error: 'Model name is required' }, { status: 400 })
    }

    // Parse photo URLs
    const photoList = typeof photos === 'string'
      ? photos.split(/[\n,]/).map((u: string) => u.trim()).filter(Boolean)
      : (photos ?? [])

    const audEstimateCents = aud_estimate ? Math.round(parseFloat(aud_estimate) * 100) : null

    // Build auction_time timestamp if provided
    let auctionTimeStamp = null
    if (auction_date && auction_time) {
      auctionTimeStamp = `${auction_date}T${auction_time}:00+09:00` // JST
    } else if (auction_date) {
      auctionTimeStamp = `${auction_date}T10:00:00+09:00` // Default 10am JST
    }

    // Insert listing
    const { data: listing, error: listingErr } = await admin
      .from('listings')
      .insert({
        source: source || 'auction',
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
        aud_estimate: audEstimateCents,
        auction_date: auction_date || null,
        auction_time: auctionTimeStamp,
        auction_time_zone: 'Asia/Tokyo',
        kaijo_code: kaijo_code || null,
        auction_count: auction_count || null,
        bid_no: bid_no || null,
        description: description?.trim() || null,
        photos: photoList,
        status: 'available',
        added_by_agent: user.id,
        scraped_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (listingErr) {
      return NextResponse.json({ error: listingErr.message }, { status: 500 })
    }

    // If assigning to a customer, create a customer_vehicle record
    if (assign_customer_id && listing) {
      await admin.from('customer_vehicles').insert({
        customer_id: assign_customer_id,
        listing_id: listing.id,
        agent_id: user.id,
        auction_status: source === 'auction' ? 'watching' : null,
        vehicle_status: 'vehicle_selection',
      })
    }

    return NextResponse.json({ success: true, id: listing.id })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
