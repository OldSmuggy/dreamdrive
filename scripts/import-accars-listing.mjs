#!/usr/bin/env node
/**
 * One-shot importer for the AC Cars 2024 Hiace SLWB.
 *
 * - Scrapes high-res photos from accars.com.au
 * - Uploads them to Supabase Storage (listing-images bucket)
 * - Creates the listing record tied to the AC Cars supplier_partner
 *
 * Usage:
 *   1. Make sure AC Cars exists in /admin/partners and copy the partner ID
 *   2. AC_CARS_PARTNER_ID=xxx node scripts/import-accars-listing.mjs
 */

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const PARTNER_ID = process.env.AC_CARS_PARTNER_ID

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}
if (!PARTNER_ID) {
  console.error('Missing AC_CARS_PARTNER_ID — get it from /admin/partners (copy the UUID from the URL after clicking AC Cars)')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY)

const SOURCE_URL = 'https://www.accars.com.au/our-stock/2024-toyota-hiace-slwb-brandnewvan,fittedcampervan,toyotasafetysense,liftkit,lineassist,powerslidedoor-4wdtrh226-514775'
const ACCARS_BASE = 'https://www.accars.com.au'

const LISTING_DETAILS = {
  source: 'au_stock',
  supplier_partner_id: PARTNER_ID,
  model_name: 'Toyota Hiace',
  model_year: 2024,
  body_type: 'SLWB',
  body_colour: 'White',
  mileage_km: 50,
  transmission: 'AT',
  drive: '4WD',
  au_price_aud: 6190000,        // $61,900 in cents
  price_aud: 6190000,
  price_type: 'fixed',
  vin: '6ZZPTRH2260025815',
  description: `2024 Toyota Hiace SLWB 4WD with only 50 km on the clock — brand new with semi-fitted camper conversion.

Comes with Toyota Safety Sense, lift kit, line assist, power slide door (left), climate control, auto fold side mirrors, factory suspensions, and the 2.7L 2TR-FE petrol engine.

Sourced from AC Cars, Salisbury QLD. Stock #1788.

Bare Camper customers get this vehicle direct from AC Cars with our referral arrangement.`,
  source_url: SOURCE_URL,
  status: 'available',
  has_fitout: true,
  fit_out_level: 'basic',
}

async function main() {
  console.log('1. Fetching listing page...')
  const res = await fetch(SOURCE_URL, {
    headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120.0' },
  })
  if (!res.ok) {
    console.error('Failed to fetch listing:', res.status)
    process.exit(1)
  }
  const html = await res.text()

  // Extract unique image base paths (form: images/4400237_1/Toyota/Hiace/1788/N?t=TIMESTAMP)
  const matches = [...html.matchAll(/images\/4400237_1\/Toyota\/Hiace\/1788\/(\d+)\?t=(\d+)/g)]
  const seen = new Map()
  for (const m of matches) {
    const num = parseInt(m[1])
    const timestamp = m[2]
    if (!seen.has(num)) seen.set(num, timestamp)
  }
  const photoNums = [...seen.keys()].sort((a, b) => a - b)
  console.log(`   Found ${photoNums.length} unique photos`)

  console.log('\n2. Downloading + uploading to Supabase Storage...')
  const uploadedUrls = []
  for (const num of photoNums) {
    const timestamp = seen.get(num)
    // Request a large rendition
    const imgUrl = `${ACCARS_BASE}/images/4400237_1/Toyota/Hiace/1788/${num}?t=${timestamp}&w=1600&h=1600`
    try {
      const imgRes = await fetch(imgUrl, {
        headers: { 'User-Agent': 'Mozilla/5.0', 'Referer': SOURCE_URL },
      })
      if (!imgRes.ok) { console.warn(`  ${num}: HTTP ${imgRes.status}, skipping`); continue }
      const buf = Buffer.from(await imgRes.arrayBuffer())
      const path = `listings/accars-1788-${num}-${Date.now()}.jpg`
      const { error } = await supabase.storage.from('listing-images').upload(path, buf, {
        contentType: 'image/jpeg',
        upsert: false,
      })
      if (error) { console.warn(`  ${num}: ${error.message}`); continue }
      const { data: { publicUrl } } = supabase.storage.from('listing-images').getPublicUrl(path)
      uploadedUrls.push(publicUrl)
      process.stdout.write(`  ✓ ${num} (${Math.round(buf.length / 1024)} KB)\n`)
    } catch (err) {
      console.warn(`  ${num}: ${err.message}`)
    }
  }
  console.log(`\n   Uploaded ${uploadedUrls.length} photos`)

  console.log('\n3. Creating listing in database...')
  const { data: listing, error: listingErr } = await supabase
    .from('listings')
    .insert({ ...LISTING_DETAILS, photos: uploadedUrls })
    .select('id, model_name, model_year')
    .single()

  if (listingErr) {
    console.error('Failed to create listing:', listingErr.message)
    process.exit(1)
  }

  console.log(`\n✅ Done!`)
  console.log(`   Listing ID: ${listing.id}`)
  console.log(`   View on site: https://barecamper.com.au/van/${listing.id}`)
  console.log(`   Edit in admin: https://barecamper.com.au/admin/listings?id=${listing.id}`)
}

main().catch(err => { console.error(err); process.exit(1) })
