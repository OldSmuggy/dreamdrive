export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { renderToBuffer } from '@react-pdf/renderer'
import React from 'react'
import { createAdminClient } from '@/lib/supabase'
import { centsToAud } from '@/lib/utils'
import { listingDisplayPrice } from '@/lib/pricing'
import { getJpyRate } from '@/lib/settings'
import OrderFormPDF from '@/lib/pdf/order-form-pdf'
import type { Listing, Product } from '@/types'

async function fetchAsDataUrl(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) })
    if (!res.ok) return null
    const buf = await res.arrayBuffer()
    const mime = res.headers.get('content-type') || 'image/jpeg'
    return `data:${mime};base64,${Buffer.from(buf).toString('base64')}`
  } catch {
    return null
  }
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admin = createAdminClient()

    // Fetch the build
    const { data: build, error: buildErr } = await admin
      .from('builds')
      .select('*')
      .eq('id', params.id)
      .single()

    if (buildErr || !build) {
      return NextResponse.json({ error: 'Build not found' }, { status: 404 })
    }

    // Fetch related records in parallel
    const [
      listingResult,
      fitoutResult,
      electricalResult,
      poptopResult,
      leadResult,
      jpyRate,
    ] = await Promise.all([
      build.listing_id
        ? admin.from('listings').select('*').eq('id', build.listing_id).single()
        : Promise.resolve({ data: null }),
      build.fitout_product_id
        ? admin.from('products').select('*').eq('id', build.fitout_product_id).single()
        : Promise.resolve({ data: null }),
      build.elec_product_id
        ? admin.from('products').select('*').eq('id', build.elec_product_id).single()
        : Promise.resolve({ data: null }),
      build.poptop_product_id
        ? admin.from('products').select('*').eq('id', build.poptop_product_id).single()
        : Promise.resolve({ data: null }),
      // Get most recent lead linked to this build for customer info
      admin.from('leads').select('name, email, phone, notes').eq('build_id', params.id).order('created_at', { ascending: false }).limit(1).maybeSingle(),
      getJpyRate(),
    ])

    const listing = listingResult.data as Listing | null
    const fitout  = fitoutResult.data as Product | null
    const elec    = electricalResult.data as Product | null
    const poptop  = poptopResult.data as Product | null
    const lead    = leadResult.data

    // Fetch images as base64 in parallel
    const [vanPhoto, fitoutImage, electricalImage, popTopImage] = await Promise.all([
      listing?.photos?.[0] ? fetchAsDataUrl(listing.photos[0]) : Promise.resolve(null),
      fitout?.images?.[0]  ? fetchAsDataUrl(fitout.images[0])  : Promise.resolve(null),
      elec?.images?.[0]    ? fetchAsDataUrl(elec.images[0])    : Promise.resolve(null),
      poptop?.images?.[0]  ? fetchAsDataUrl(poptop.images[0])  : Promise.resolve(null),
    ])

    // Build price lines
    const priceLines: { label: string; note: string | null; price: string }[] = []

    if (listing) {
      const { priceCents, isEstimate } = listingDisplayPrice(listing, jpyRate)
      if (priceCents) {
        priceLines.push({
          label: listing.model_name,
          note: isEstimate ? 'Estimate incl. import costs, GST, compliance & rego' : null,
          price: `${isEstimate ? '~' : ''}${centsToAud(priceCents)}`,
        })
      }
    }

    if (fitout && build.total_aud_min) {
      // Approximate conversion fee as total minus van price
      const { priceCents: vanCents } = listing ? listingDisplayPrice(listing, jpyRate) : { priceCents: 0 }
      const conversionCents = build.total_aud_min - (vanCents ?? 0)
      if (conversionCents > 0) {
        priceLines.push({ label: `${fitout.name} Conversion`, note: null, price: centsToAud(conversionCents) })
      }
    }

    if (elec) {
      priceLines.push({ label: elec.name, note: null, price: elec.rrp_aud ? centsToAud(elec.rrp_aud) : '—' })
    }

    if (poptop || build.poptop_japan) {
      priceLines.push({
        label: 'Pop Top Conversion',
        note: poptop ? 'Fitted in Brisbane' : null,
        price: poptop ? centsToAud(poptop.rrp_aud) : 'Included',
      })
    }

    const { priceCents: vanPriceCents, isEstimate } = listing ? listingDisplayPrice(listing, jpyRate) : { priceCents: null, isEstimate: false }

    const doc = React.createElement(OrderFormPDF, {
      buildId:          build.id,
      shareSlug:        build.share_slug,
      createdAt:        build.created_at,
      customerName:     lead?.name ?? null,
      customerEmail:    lead?.email ?? null,
      customerPhone:    lead?.phone ?? null,
      vanName:          listing?.model_name ?? null,
      vanYear:          listing?.model_year ?? null,
      vanMileage:       listing?.mileage_km ?? null,
      vanPrice:         vanPriceCents ? `${isEstimate ? '~' : ''}${centsToAud(vanPriceCents)}` : null,
      vanPhoto,
      fitoutName:       fitout?.name ?? null,
      fitoutImage,
      electricalName:   elec?.name ?? null,
      electricalImage,
      hasPopTop:        !!(poptop || build.poptop_japan),
      popTopImage,
      buildLocation:    build.build_location ?? null,
      priceLines,
      totalAud:         build.total_aud_min ? centsToAud(build.total_aud_min) : null,
      notes:            build.notes ?? lead?.notes ?? null,
    })

    const buffer = await renderToBuffer(doc as React.ReactElement<any>)

    const slug = (lead?.name ?? 'build')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 40)

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="barecamper-order-${slug}.pdf"`,
        'Cache-Control': 'private, no-cache',
      },
    })
  } catch (err) {
    console.error('[builds pdf] generation failed:', err)
    return NextResponse.json({ error: 'PDF generation failed' }, { status: 500 })
  }
}
