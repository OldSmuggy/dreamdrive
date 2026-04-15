export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { renderToBuffer } from '@react-pdf/renderer'
import React from 'react'
import { createAdminClient } from '@/lib/supabase'
import { centsToAud, scoreLabel } from '@/lib/utils'
import { listingDisplayPrice, tamaConversionAud, manaAuConversionAud, kumaQConversionAud } from '@/lib/pricing'
import { getJpyRate } from '@/lib/settings'
import VehiclePDF from '@/lib/pdf/vehicle-pdf'
import type { Listing } from '@/types'

const POP_TOP_PRICE_AUD = 13_090

// Fetch an image URL and return it as a base64 data URL.
// Returns null on any error so the PDF can still render without the image.
async function fetchAsDataUrl(url: string, attempt = 1): Promise<string | null> {
  const MAX_RETRIES = 2
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(15_000),
      headers: { 'Accept': 'image/*' },
    })
    if (!res.ok) {
      console.warn(`[pdf] image fetch ${res.status}: ${url}`)
      return null
    }
    const buf = await res.arrayBuffer()
    if (buf.byteLength === 0) {
      console.warn(`[pdf] empty image body: ${url}`)
      return null
    }
    const mime = res.headers.get('content-type') || 'image/jpeg'
    const base64 = Buffer.from(buf).toString('base64')
    return `data:${mime};base64,${base64}`
  } catch (err) {
    if (attempt < MAX_RETRIES) {
      // Brief backoff then retry
      await new Promise(r => setTimeout(r, 500 * attempt))
      return fetchAsDataUrl(url, attempt + 1)
    }
    console.warn(`[pdf] image failed after ${MAX_RETRIES} attempts: ${url}`, err)
    return null
  }
}

// Fetch images in small batches to avoid overwhelming the CDN / hitting timeouts
async function fetchImagesInBatches(
  urls: string[],
  batchSize = 4
): Promise<(string | null)[]> {
  const results: (string | null)[] = []
  for (let i = 0; i < urls.length; i += batchSize) {
    const batch = urls.slice(i, i + batchSize)
    const batchResults = await Promise.all(batch.map(url => fetchAsDataUrl(url)))
    results.push(...batchResults)
  }
  return results
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createAdminClient()
    const [{ data, error }, jpyRate] = await Promise.all([
      supabase.from('listings').select('*').eq('id', params.id).single(),
      getJpyRate(),
    ])

    if (error || !data) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 })
    }

    const listing = data as Listing

    // Build price string
    const { priceCents, isEstimate } = listingDisplayPrice(listing, null)
    const priceStr = priceCents ? centsToAud(priceCents) : null
    const priceNote = isEstimate ? 'Estimate — landed in Brisbane' : null

    // Conversion prices
    const tamaAud = tamaConversionAud(jpyRate)
    const manaAud = manaAuConversionAud()
    const kumaQAud = kumaQConversionAud(jpyRate)
    const isSLWB = listing.size === 'SLWB' || listing.size === 'Super Long (SLWB)'

    // Fetch all photos as embedded base64 (no URLs exposed in PDF)
    const allPhotos: string[] = listing.photos ?? []
    const MAX_PHOTOS = 25

    console.log(`[pdf] fetching ${Math.min(allPhotos.length, MAX_PHOTOS)} photos for ${listing.id}`)
    const dataUrls = await fetchImagesInBatches(allPhotos.slice(0, MAX_PHOTOS), 4)
    const validDataUrls = dataUrls.filter((u): u is string => u !== null)
    console.log(`[pdf] ${validDataUrls.length}/${Math.min(allPhotos.length, MAX_PHOTOS)} photos embedded OK`)

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
      priceCents:  priceCents,
      priceNote,
      grade:       listing.inspection_score,
      gradeLabel:  listing.inspection_score ? scoreLabel(listing.inspection_score) : null,
      description: listing.description,
      source:      listing.source,
      heroImage,
      photoImages: validDataUrls,
      isDealer:    listing.source === 'dealer_goonet' || listing.source === 'dealer_carsensor',
      popTopPrice: POP_TOP_PRICE_AUD,
      manaPrice:   manaAud,
      tamaPrice:   tamaAud,
      kumaQPrice:  kumaQAud,
      isSLWB,
    })

    const buffer = await renderToBuffer(doc as React.ReactElement<any>)

    const slug = listing.model_name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 60)

    return new NextResponse(new Uint8Array(buffer), {
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
