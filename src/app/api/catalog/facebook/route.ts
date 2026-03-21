import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'
import { getJpyRate } from '@/lib/settings'
import { listingDisplayPrice } from '@/lib/pricing'
import type { Listing } from '@/types'

/**
 * Facebook / Meta Product Catalog feed.
 * Format: XML (RSS 2.0 with g: namespace) compatible with Meta Commerce Manager.
 * URL: /api/catalog/facebook
 *
 * Add this URL as a "Data Feed" in Meta Business Suite → Commerce Manager → Catalog → Data Sources.
 * Set it to update daily or hourly.
 */
export async function GET() {
  const supabase = createAdminClient()
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://barecamper.com'

  const [{ data: listings }, jpyRate] = await Promise.all([
    supabase
      .from('listings')
      .select('*')
      .in('status', ['available', 'reserved'])
      .eq('is_active', true)
      .order('created_at', { ascending: false }),
    getJpyRate(),
  ])

  const items = (listings ?? []).map((listing: Listing) => {
    const { priceCents } = listingDisplayPrice(listing, jpyRate)
    const price = priceCents ? (priceCents / 100).toFixed(2) : null
    const title = `${listing.model_year ?? ''} ${listing.model_name}`.trim()
    const description = listing.description
      || `${title} — imported from Japan by Bare Camper. ${listing.mileage_km ? `${listing.mileage_km.toLocaleString()} km.` : ''} ${listing.transmission === 'IA' ? 'Automatic.' : listing.transmission === 'MT' ? 'Manual.' : ''}`
    const image = listing.photos?.[0] ?? ''
    const link = `${baseUrl}/van/${listing.id}`
    const availability = listing.status === 'available' ? 'in stock' : 'available for order'

    const condition = 'used'
    const brand = 'Toyota'
    const vehicleType = listing.has_fitout ? 'Campervan' : 'Van'

    return `    <item>
      <g:id>${escapeXml(listing.id)}</g:id>
      <g:title>${escapeXml(title)}</g:title>
      <g:description>${escapeXml(description.slice(0, 5000))}</g:description>
      <g:link>${escapeXml(link)}</g:link>
      <g:image_link>${escapeXml(image)}</g:image_link>
${listing.photos?.slice(1, 10).map(p => `      <g:additional_image_link>${escapeXml(p)}</g:additional_image_link>`).join('\n')}
      <g:availability>${availability}</g:availability>
${price ? `      <g:price>${price} AUD</g:price>` : ''}
      <g:condition>${condition}</g:condition>
      <g:brand>${brand}</g:brand>
      <g:product_type>${escapeXml(vehicleType)}</g:product_type>
${listing.model_year ? `      <g:custom_label_0>${listing.model_year}</g:custom_label_0>` : ''}
${listing.mileage_km ? `      <g:custom_label_1>${listing.mileage_km.toLocaleString()} km</g:custom_label_1>` : ''}
${listing.source ? `      <g:custom_label_2>${escapeXml(listing.source)}</g:custom_label_2>` : ''}
    </item>`
  })

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>Bare Camper — Vehicles</title>
    <link>${baseUrl}</link>
    <description>Toyota Hiace campervans imported from Japan by Bare Camper</description>
${items.join('\n')}
  </channel>
</rss>`

  return new NextResponse(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=600',
    },
  })
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}
