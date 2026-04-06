export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'
import { requireAdmin } from '@/lib/api-auth'
import {
  detectSource,
  extractExternalId,
  parseGooNet,
  parseCarSensor,
  extractPhotos,
  translateListing,
} from '@/lib/dealer-parsers'
import { scrapeUrl } from '@/lib/firecrawl'

// ============================================================
// POST /api/import-dealer
// Scrapes a single listing from goo-net.com or carsensor.net
// and inserts it into the listings table.
//
// Body: { url: string }
// No auth cookie needed — these are public pages.
// ============================================================

export async function POST(req: NextRequest) {
  const { error: authErr } = await requireAdmin()
  if (authErr) return authErr

  try {
    const { url } = await req.json()
    if (!url?.trim()) return NextResponse.json({ error: 'No URL provided' }, { status: 400 })

    const source = detectSource(url)
    if (!source) {
      return NextResponse.json(
        { error: 'URL must be from goo-net.com or carsensor.net' },
        { status: 400 }
      )
    }

    const external_id = extractExternalId(url, source)

    // Duplicate check
    const supabase = createAdminClient()
    const { data: existing } = await supabase
      .from('listings').select('id').eq('external_id', external_id).single()
    if (existing) {
      return NextResponse.json(
        { error: 'This listing is already in your database' },
        { status: 409 }
      )
    }

    // Fetch the public page via Firecrawl (with fetch fallback)
    let html: string
    try {
      const result = await scrapeUrl(url)
      html = result.html
      console.log(`[import-dealer] Scraped via ${result.source}: ${html.length} chars`)
    } catch (err) {
      return NextResponse.json(
        { error: `Failed to fetch page: ${String(err)}` },
        { status: 502 }
      )
    }

    // Check for JS-only / bot-blocked pages
    if (html.length < 2000 || (html.includes('<script') && !html.includes('<table') && !html.includes('<div'))) {
      return NextResponse.json(
        { error: 'Page appears to require JavaScript or is bot-protected. Try the manual Add Listing form instead.' },
        { status: 422 }
      )
    }

    const parsed = source === 'dealer_goonet'
      ? parseGooNet(html)
      : parseCarSensor(html)

    const photos = extractPhotos(html, source)
    const audEstimate = parsed.priceJpy
      ? Math.round(parsed.priceJpy * 0.0095 + 8500) * 100
      : null

    // Translate Japanese fields and generate English description
    const translated = await translateListing(parsed)

    const { data: inserted, error: insertError } = await supabase
      .from('listings')
      .insert({
        source,
        external_id,
        model_name: translated.modelName,
        grade: translated.grade ?? null,
        model_year: parsed.modelYear,
        mileage_km: parsed.mileageKm,
        transmission: parsed.transmission,
        drive: parsed.drive,
        displacement_cc: parsed.displacementCc,
        body_colour: translated.bodyColour,
        description: translated.description || null,
        start_price_jpy: parsed.priceJpy,
        aud_estimate: audEstimate,
        status: 'draft',
        has_nav: parsed.hasNav,
        has_leather: parsed.hasLeather,
        has_sunroof: parsed.hasSunroof,
        has_alloys: parsed.hasAlloys,
        photos,
        raw_data: { url, source, raw_grade: parsed.grade, raw_colour: parsed.bodyColour },
        scraped_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (insertError) {
      return NextResponse.json(
        { error: `Database error: ${insertError.message}` },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      listing: {
        id: inserted.id,
        model_name: inserted.model_name,
        model_year: inserted.model_year,
        mileage_km: inserted.mileage_km,
        photos: inserted.photos,
        aud_estimate: inserted.aud_estimate,
        source: inserted.source,
        price_jpy: inserted.start_price_jpy,
      },
    })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
