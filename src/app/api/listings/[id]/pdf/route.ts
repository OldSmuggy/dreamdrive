export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { renderToBuffer } from '@react-pdf/renderer'
import React from 'react'
import { createAdminClient } from '@/lib/supabase'
import { centsToAud, scoreLabel } from '@/lib/utils'
import { listingDisplayPrice } from '@/lib/pricing'
import VehiclePDF from '@/lib/pdf/vehicle-pdf'
import type { Listing } from '@/types'

// Fetch an image URL and return it as a base64 data URL.
// Returns null on any error so the PDF can still render without the image.
async function fetchAsDataUrl(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) })
    if (!res.ok) return null
    const buf = await res.arrayBuffer()
    const mime = res.headers.get('content-type') || 'image/jpeg'
    const base64 = Buffer.from(buf).toString('base64')
    return `data:${mime};base64,${base64}`
  } catch {
    return null
  }
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from('listings')
      .select('*')
      .eq('id', params.id)
      .single()

    if (error || !data) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 })
    }

    const listing = data as Listing

    // Build price string
    const { priceCents, isEstimate } = listingDisplayPrice(listing, null)
    const priceStr = priceCents ? centsToAud(priceCents) : null
    const priceNote = isEstimate ? 'Estimate — landed in Brisbane' : null

    // Fetch all photos as embedded base64 (no URLs exposed in PDF)
    const allPhotos: string[] = listing.photos ?? []
    const MAX_PHOTOS = 25 // cap to avoid very long generation times

    const dataUrls = await Promise.all(
      allPhotos.slice(0, MAX_PHOTOS).map(url => fetchAsDataUrl(url))
    )
    const validDataUrls = dataUrls.filter((u): u is string => u !== null)

    const heroImage = validDataUrls[0] ?? null

    // Build the PDF document
    const doc = React.createElement(VehiclePDF, {
      id:          listing.id,
      modelName:   listing.model_name,
      modelYear:   listing.model_year,
      mileageKm:   listing.mileage_km,
      drive:       listing.drive,
      engine:      (listing as any).engine ?? null,
      size:        listing.size,
      location:    listing.location_status,
      price:       priceStr,
      priceNote,
      grade:       listing.inspection_score,
      gradeLabel:  listing.inspection_score ? scoreLabel(listing.inspection_score) : null,
      description: listing.description,
      source:      listing.source,
      heroImage,
      photoImages: validDataUrls,
      isDealer:    listing.source === 'dealer_goonet' || listing.source === 'dealer_carsensor',
    })

    const buffer = await renderToBuffer(doc as React.ReactElement<any>)

    const slug = listing.model_name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 60)

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="barecamper-${slug}.pdf"`,
        'Cache-Control': 'public, max-age=300, s-maxage=300',
      },
    })
  } catch (err) {
    console.error('[pdf] generation failed:', err)
    return NextResponse.json({ error: 'PDF generation failed' }, { status: 500 })
  }
}
