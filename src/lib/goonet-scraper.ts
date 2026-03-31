/**
 * Goo-net dealer scraper — Playwright-based (real browser).
 *
 * Searches goo-net.com for Toyota Hiace vans, paginates through results,
 * clicks into each listing for full specs and high-res photos, downloads
 * photos to Supabase storage, and inserts listings into the database.
 *
 * Uses headless Chromium via Playwright. Cannot run on Vercel serverless —
 * must be triggered from a local machine with Chromium installed.
 */

import { chromium, type Page } from 'playwright'
import { createAdminClient } from './supabase'
import { translateListing, parseTransmission, parseDrive } from './dealer-parsers'
import type { ParsedListing } from './dealer-parsers'

// ============================================================
// Constants
// ============================================================

const BASE = 'https://www.goo-net.com'

// Goo-net search URL for Toyota Hiace Van (used cars)
// brand-TOYOTA = Toyota, car-HIACE_VAN = Hiace Van model
const SEARCH_BASE = `${BASE}/usedcar/brand-TOYOTA/car-HIACE_VAN`

const EXCLUDED_GRADES = [
  'WELCAB',
  'ウェルキャブ',
  '福祉車両',
]

/** Random delay between min and max milliseconds to mimic human browsing */
function humanDelay(minMs = 800, maxMs = 2500): Promise<void> {
  const ms = Math.floor(Math.random() * (maxMs - minMs)) + minMs
  return new Promise((r) => setTimeout(r, ms))
}

// ============================================================
// Types
// ============================================================

export interface GoonetScrapedVan {
  external_id: string
  source_url: string
  model_name: string
  grade: string | null
  chassis_code: string | null
  model_year: number | null
  transmission: 'IA' | 'AT' | 'MT' | null
  displacement_cc: number | null
  drive: '2WD' | '4WD' | null
  engine: string | null
  mileage_km: number | null
  body_colour: string | null
  start_price_jpy: number | null
  buy_price_jpy: number | null
  size: 'LWB' | 'SLWB' | null
  has_nav: boolean
  has_leather: boolean
  has_sunroof: boolean
  has_alloys: boolean
  has_power_steering: boolean
  has_power_windows: boolean
  has_rear_ac: boolean
  condition_notes: string | null
  seller_notes: string | null
  interior_score: number | null
  exterior_score: number | null
  photos: string[]
  raw_grade: string | null
  raw_colour: string | null
  fuel_type: string | null
  seating_capacity: number | null
  shaken_expiry: string | null
  accident_history: boolean | null
}

export interface ScrapeResult {
  found: number
  processed: number
  skipped: number
  errors: number
  newInserts: number
  duplicates: number
}

export interface GoonetFilterOptions {
  yearFrom?: number
  yearTo?: number
  driveType?: '2WD' | '4WD' | 'any'
  maxPrice?: number // in 万円 (e.g. 500 = ¥5,000,000)
}

// ============================================================
// Main scraper entry point
// ============================================================

export async function runGoonetScraper(options: {
  maxListings?: number
  urls?: string[]           // Direct URL list mode — skip search, process these URLs
  filters?: GoonetFilterOptions
  onProgress?: (msg: string) => void
}): Promise<ScrapeResult> {
  const { maxListings, urls, filters, onProgress = console.log } = options

  if (filters?.yearFrom || filters?.yearTo || (filters?.driveType && filters.driveType !== 'any') || filters?.maxPrice) {
    onProgress(`Filters: year ${filters.yearFrom ?? 'any'}–${filters.yearTo ?? 'any'}, drive: ${filters.driveType ?? 'any'}, max price: ${filters.maxPrice ? filters.maxPrice + '万円' : 'any'}`)
  }

  const supabase = createAdminClient()

  // Ensure storage bucket exists
  await supabase.storage.createBucket('listing-images', { public: true }).catch(() => {})

  const browser = await chromium.launch({
    headless: true,
    args: [
      '--disable-blink-features=AutomationControlled',
      '--no-sandbox',
    ],
  })
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
    viewport: { width: 1280, height: 900 },
    locale: 'ja-JP',
    timezoneId: 'Asia/Tokyo',
  })

  let found = 0
  let processed = 0
  let skipped = 0
  let errors = 0
  let newInserts = 0
  let duplicates = 0

  try {
    const page = await context.newPage()

    // Remove automation detection signals
    await page.addInitScript(`Object.defineProperty(navigator, 'webdriver', { get: () => false })`)

    let allListingUrls: string[]

    if (urls && urls.length > 0) {
      // ----------------------------------------------------------
      // URL list mode — skip search, use provided URLs directly
      // ----------------------------------------------------------
      onProgress(`URL list mode: ${urls.length} URLs provided`)
      allListingUrls = urls
    } else {
      // ----------------------------------------------------------
      // Search mode — search Goo-net and paginate results
      // ----------------------------------------------------------
      onProgress('Step 1: Building search URL...')
      const searchUrl = buildSearchUrl(filters)
      onProgress(`  Search URL: ${searchUrl}`)

      onProgress('Step 2: Loading search results...')
      await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 30000 })
      await page.waitForLoadState('networkidle').catch(() => {})
      await humanDelay(1500, 3000)

      // Get total result count
      const totalText = await page.textContent('.search_result_head .hit-num, .list_result_pager .hit-num, .num_result').catch(() => null)
      const totalCount = totalText ? parseInt(totalText.replace(/[^\d]/g, '')) : 0
      onProgress(`  Found ${totalCount} total Hiace Van listings on Goo-net`)

      // Collect all listing URLs across pages
      allListingUrls = []
      let pageNum = 1
      const maxPages = 20 // safety limit

      while (pageNum <= maxPages) {
        const pageUrls = await page.evaluate(`(function() {
          var links = [];
          var items = document.querySelectorAll('.box_item_detail .heading_inner a[href*="/usedcar/spread/"]');
          if (items.length === 0) {
            items = document.querySelectorAll('a[href*="/usedcar/spread/goo/"]');
          }
          items.forEach(function(a) {
            var href = a.getAttribute('href');
            if (href && href.includes('.html') && !links.includes(href)) {
              links.push(href.startsWith('http') ? href : 'https://www.goo-net.com' + href);
            }
          });
          return links;
        })()`) as string[]

        if (pageUrls.length === 0) {
          onProgress(`  Page ${pageNum}: no listings found, stopping pagination`)
          break
        }

        allListingUrls.push(...pageUrls)
        onProgress(`  Page ${pageNum}: ${pageUrls.length} listings (${allListingUrls.length} total)`)

        // Check if we have enough
        if (maxListings && allListingUrls.length >= maxListings) break

        // Try next page
        const nextLink = await page.$('a.next, .list_result_pager a:has-text("次へ"), a:has-text("次の")')
        if (!nextLink) {
          onProgress(`  No more pages`)
          break
        }

        await nextLink.click()
        await page.waitForLoadState('domcontentloaded', { timeout: 15000 }).catch(() => {})
        await page.waitForLoadState('networkidle').catch(() => {})
        await humanDelay(1500, 3000)
        pageNum++
      }
    }

    found = allListingUrls.length
    const toProcess = maxListings ? allListingUrls.slice(0, maxListings) : allListingUrls
    onProgress(`\nProcessing ${toProcess.length} listings...`)

    // ----------------------------------------------------------
    // 3. Visit each listing detail page
    // ----------------------------------------------------------
    for (let i = 0; i < toProcess.length; i++) {
      const url = toProcess[i]
      const label = `[${i + 1}/${toProcess.length}]`

      try {
        // Extract external ID from URL
        const idMatch = url.match(/\/(\d{10,})\.html/)
        const externalId = idMatch ? `goo-${idMatch[1]}` : `goo-${Date.now()}`

        // Duplicate check
        const { data: existing } = await supabase
          .from('listings')
          .select('id')
          .eq('external_id', externalId)
          .maybeSingle()

        if (existing) {
          onProgress(`${label} — duplicate, skipping: ${externalId}`)
          duplicates++
          continue
        }

        onProgress(`${label} — loading detail page...`)
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 })
        await page.waitForLoadState('networkidle').catch(() => {})
        await humanDelay(1500, 3000)

        // Extract all data from the detail page
        const van = await extractDetailPage(page, url, externalId)

        if (!van) {
          onProgress(`${label} — could not extract data, skipping`)
          errors++
          continue
        }

        // Check grade exclusions
        const gradeStr = (van.grade || van.model_name || '').toUpperCase()
        if (EXCLUDED_GRADES.some(g => gradeStr.includes(g.toUpperCase()))) {
          onProgress(`${label} — excluded grade: ${van.grade ?? van.model_name}`)
          skipped++
          continue
        }

        // Download photos to Supabase storage
        const uploadedPhotos: string[] = []
        if (van.photos.length > 0) {
          onProgress(`${label} — downloading ${van.photos.length} photos...`)
          for (let pi = 0; pi < van.photos.length; pi++) {
            try {
              const photoUrl = van.photos[pi]
              const response = await page.context().request.get(photoUrl)
              if (response.ok()) {
                const buffer = await response.body()
                const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`
                const storagePath = `listings/${filename}`

                const { error: uploadErr } = await supabase.storage
                  .from('listing-images')
                  .upload(storagePath, buffer, { contentType: 'image/jpeg', upsert: false })

                if (!uploadErr) {
                  const { data: { publicUrl } } = supabase.storage.from('listing-images').getPublicUrl(storagePath)
                  uploadedPhotos.push(publicUrl)
                } else {
                  onProgress(`${label} — photo ${pi + 1} upload error: ${uploadErr.message}`)
                }
              }
            } catch (photoErr) {
              onProgress(`${label} — photo ${pi + 1} error: ${photoErr}`)
            }
          }
          onProgress(`${label} — ${uploadedPhotos.length}/${van.photos.length} photos saved`)
        }

        // Translate Japanese fields with AI
        const parsed: ParsedListing = {
          modelName: van.model_name,
          grade: van.raw_grade,
          modelYear: van.model_year,
          mileageKm: van.mileage_km,
          transmission: van.transmission,
          drive: van.drive,
          displacementCc: van.displacement_cc,
          bodyColour: van.raw_colour,
          priceJpy: van.start_price_jpy,
          sellerNotes: van.seller_notes,
          hasNav: van.has_nav,
          hasLeather: van.has_leather,
          hasSunroof: van.has_sunroof,
          hasAlloys: van.has_alloys,
        }
        const translated = await translateListing(parsed)

        // Calculate AUD estimate
        const jpyPrice = van.start_price_jpy
        const audEstimate = jpyPrice
          ? Math.round((jpyPrice * 0.0095 + 10000) * 100)
          : null

        // Insert into database
        const { error: insertErr } = await supabase.from('listings').insert({
          source: 'dealer_goonet',
          external_id: externalId,
          source_url: url,
          model_name: translated.modelName,
          grade: translated.grade ?? null,
          chassis_code: van.chassis_code,
          model_year: van.model_year,
          transmission: van.transmission,
          displacement_cc: van.displacement_cc,
          drive: van.drive,
          engine: van.engine,
          mileage_km: van.mileage_km,
          body_colour: translated.bodyColour,
          description: translated.description || null,
          start_price_jpy: van.start_price_jpy,
          buy_price_jpy: van.buy_price_jpy,
          aud_estimate: audEstimate,
          size: van.size,
          status: 'draft',
          has_nav: van.has_nav,
          has_leather: van.has_leather,
          has_sunroof: van.has_sunroof,
          has_alloys: van.has_alloys,
          has_power_steering: van.has_power_steering,
          has_power_windows: van.has_power_windows,
          has_rear_ac: van.has_rear_ac,
          condition_notes: van.condition_notes,
          photos: uploadedPhotos,
          raw_data: {
            url,
            source: 'dealer_goonet',
            raw_grade: van.raw_grade,
            raw_colour: van.raw_colour,
            fuel_type: van.fuel_type,
            seating_capacity: van.seating_capacity,
            shaken_expiry: van.shaken_expiry,
            accident_history: van.accident_history,
            interior_score: van.interior_score,
            exterior_score: van.exterior_score,
            seller_notes: van.seller_notes,
          },
          scraped_at: new Date().toISOString(),
        })

        if (insertErr) {
          onProgress(`${label} — DB error: ${insertErr.message}`)
          errors++
        } else {
          newInserts++
        }

        processed++
        onProgress(
          `${label} ✓ ${translated.grade || van.raw_grade || '?'} ${van.model_year ?? '?'} ` +
          `${van.mileage_km ?? '?'}km ${van.drive ?? '?'} ¥${van.start_price_jpy?.toLocaleString() ?? '?'} ` +
          `[${uploadedPhotos.length} photos]`
        )

        await humanDelay(1500, 3500)
      } catch (err) {
        onProgress(`${label} — error: ${err}`)
        errors++
        await humanDelay(1000, 2000)
      }
    }

    onProgress(
      `\nDone. found=${found} processed=${processed} new=${newInserts} ` +
      `dupes=${duplicates} skipped=${skipped} errors=${errors}`
    )

    return { found, processed, skipped, errors, newInserts, duplicates }
  } finally {
    await browser.close()
  }
}

// ============================================================
// Search URL builder
// ============================================================

function buildSearchUrl(filters?: GoonetFilterOptions): string {
  // Goo-net uses URL path segments for filters
  // Base: /usedcar/brand-TOYOTA/car-HIACE_VAN/index.html
  // With filters appended as query params or path segments

  const params = new URLSearchParams()

  // Year range
  if (filters?.yearFrom) params.set('year_min', filters.yearFrom.toString())
  if (filters?.yearTo) params.set('year_max', filters.yearTo.toString())

  // Drive type
  if (filters?.driveType === '4WD') params.set('drive', '4WD')
  else if (filters?.driveType === '2WD') params.set('drive', '2WD')

  // Max price (万円)
  if (filters?.maxPrice) params.set('price_max', filters.maxPrice.toString())

  // Sort by newest
  params.set('sort', 'new')

  const qs = params.toString()
  return `${SEARCH_BASE}/index.html${qs ? '?' + qs : ''}`
}

// ============================================================
// Detail page extractor
// ============================================================

async function extractDetailPage(
  page: Page,
  url: string,
  externalId: string,
): Promise<GoonetScrapedVan | null> {
  // Extract all data using string-based evaluate to avoid tsx __name injection
  const data = await page.evaluate(`(function() {
    // Helper to get text from a table cell by its label
    function getField() {
      var labels = Array.prototype.slice.call(arguments);
      var ths = document.querySelectorAll('th');
      for (var i = 0; i < ths.length; i++) {
        var text = (ths[i].textContent || '').trim();
        for (var j = 0; j < labels.length; j++) {
          if (text.indexOf(labels[j]) !== -1) {
            var td = ths[i].nextElementSibling;
            if (td) {
              var val = (td.textContent || '').trim().replace(/\\s+/g, ' ');
              if (val && val !== '－' && val !== '-' && val !== '---') return val;
            }
          }
        }
      }
      // Also check <dt>/<dd> pairs
      var dts = document.querySelectorAll('dt');
      for (var i = 0; i < dts.length; i++) {
        var text = (dts[i].textContent || '').trim();
        for (var j = 0; j < labels.length; j++) {
          if (text.indexOf(labels[j]) !== -1) {
            var dd = dts[i].nextElementSibling;
            if (dd) {
              var val = (dd.textContent || '').trim().replace(/\\s+/g, ' ');
              if (val && val !== '－' && val !== '-') return val;
            }
          }
        }
      }
      return null;
    }

    // Model name from title/heading
    var modelName = 'TOYOTA HIACE VAN';
    var h1 = document.querySelector('h1');
    if (h1) {
      var h1Text = (h1.textContent || '').trim();
      if (h1Text.length > 3) modelName = h1Text;
    }

    // Grade
    var grade = getField('グレード', 'グレード名');

    // Year
    var yearRaw = getField('年式', '初度登録', '初年度登録');
    var yearMatch = yearRaw ? yearRaw.match(/(\\d{4})/) : null;
    var modelYear = yearMatch ? parseInt(yearMatch[1]) : null;

    // Mileage
    var mileageRaw = getField('走行距離', '走行');
    var mileageKm = null;
    if (mileageRaw) {
      var mileNum = mileageRaw.replace(/[^\\d]/g, '');
      if (mileNum) {
        mileageKm = parseInt(mileNum);
        // If value includes 万km, multiply
        if (mileageRaw.indexOf('万') !== -1) mileageKm = mileageKm * 10000;
      }
    }

    // Transmission
    var transRaw = getField('ミッション', 'トランスミッション');

    // Displacement
    var dispRaw = getField('排気量', 'エンジン排気量');
    var displacementCc = null;
    if (dispRaw) {
      var dispNum = dispRaw.replace(/[^\\d]/g, '');
      if (dispNum) displacementCc = parseInt(dispNum);
    }

    // Drive
    var driveRaw = getField('駆動方式', '駆動');

    // Fuel type
    var fuelRaw = getField('燃料');
    var fuelType = null;
    if (fuelRaw) {
      if (fuelRaw.indexOf('軽油') !== -1 || fuelRaw.indexOf('ディーゼル') !== -1) fuelType = 'diesel';
      else if (fuelRaw.indexOf('ガソリン') !== -1) fuelType = 'petrol';
      else fuelType = fuelRaw;
    }

    // Engine type (combine displacement + fuel)
    var engine = null;
    if (displacementCc && fuelType) {
      var litres = (displacementCc / 1000).toFixed(1);
      engine = litres + 'L ' + (fuelType === 'diesel' ? 'Diesel' : fuelType === 'petrol' ? 'Petrol' : fuelType);
    }

    // Body colour
    var colourRaw = getField('車体色', 'ボディカラー', 'カラー');

    // Chassis code (last 3 digits)
    var chassisRaw = getField('車台番号下3桁', '車台番号');

    // Seating capacity
    var capacityRaw = getField('乗車定員');
    var seatingCapacity = null;
    if (capacityRaw) {
      var capNum = capacityRaw.replace(/[^\\d]/g, '');
      if (capNum) seatingCapacity = parseInt(capNum);
    }

    // Shaken expiry
    var shakenRaw = getField('車検', '車検整備');

    // Accident history
    var repairRaw = getField('修復歴');
    var accidentHistory = null;
    if (repairRaw) {
      accidentHistory = repairRaw.indexOf('なし') === -1 && repairRaw.indexOf('無') === -1;
    }

    // Doors
    var doorsRaw = getField('ドア');

    // Size classification (from doors or other hints)
    var size = null;
    var pageText = document.body.textContent || '';
    if (pageText.indexOf('スーパーロング') !== -1 || pageText.indexOf('SLWB') !== -1) {
      size = 'SLWB';
    } else if (pageText.indexOf('ロング') !== -1 || pageText.indexOf('ワイドボディ') !== -1) {
      size = 'LWB';
    }

    // Price - total price (本体価格 + 諸費用)
    var startPriceJpy = null;
    var buyPriceJpy = null;
    // Try total price first
    var priceNums = document.querySelectorAll('.mainDataList .num, .hontai-price .num');
    for (var i = 0; i < priceNums.length; i++) {
      var priceText = (priceNums[i].textContent || '').trim();
      var manMatch = priceText.match(/([\\d,.]+)\\s*万/);
      if (manMatch) {
        var val = Math.round(parseFloat(manMatch[1].replace(/,/g, '')) * 10000);
        if (val > 0) {
          if (!startPriceJpy) startPriceJpy = val;
          else if (!buyPriceJpy) buyPriceJpy = val;
        }
      }
    }
    // Fallback: search for price patterns in page
    if (!startPriceJpy) {
      var allText = document.body.innerHTML;
      var manRe = /([\\d,]+(?:\\.\\d+)?)\\s*万円/g;
      var m;
      while ((m = manRe.exec(allText)) !== null) {
        var v = Math.round(parseFloat(m[1].replace(/,/g, '')) * 10000);
        if (v > 500000 && v < 50000000) { // reasonable vehicle price range
          startPriceJpy = v;
          break;
        }
      }
    }

    // Condition scores (interior/exterior)
    var interiorScore = null;
    var exteriorScore = null;
    var interiorEl = document.querySelector('.interior span, .interior em');
    if (interiorEl) {
      var s = parseFloat((interiorEl.textContent || '').trim());
      if (!isNaN(s)) interiorScore = s;
    }
    var exteriorEl = document.querySelector('.exterior span, .exterior em');
    if (exteriorEl) {
      var s = parseFloat((exteriorEl.textContent || '').trim());
      if (!isNaN(s)) exteriorScore = s;
    }

    // Equipment detection from item lists
    var itemText = '';
    var onItems = document.querySelectorAll('.itemList li.on, .itemList .item.on');
    for (var i = 0; i < onItems.length; i++) {
      itemText += ' ' + (onItems[i].textContent || '');
    }
    // Also check full page for keyword detection
    var fullText = document.body.textContent || '';

    var hasNav = itemText.indexOf('ナビ') !== -1 || itemText.indexOf('カーナビ') !== -1;
    var hasLeather = itemText.indexOf('レザー') !== -1 || itemText.indexOf('本革') !== -1;
    var hasSunroof = itemText.indexOf('サンルーフ') !== -1 || itemText.indexOf('ムーンルーフ') !== -1;
    var hasAlloys = itemText.indexOf('アルミ') !== -1;
    var hasPowerSteering = itemText.indexOf('パワステ') !== -1 || itemText.indexOf('パワーステアリング') !== -1;
    var hasPowerWindows = itemText.indexOf('パワーウィンドウ') !== -1 || itemText.indexOf('パワーウインドウ') !== -1;
    var hasRearAc = itemText.indexOf('リアエアコン') !== -1 || itemText.indexOf('リヤエアコン') !== -1;

    // Seller notes / condition notes
    var sellerNotes = null;
    var commentEls = document.querySelectorAll('.seller_comment, .notes, .pr_comment, [class*="comment"]');
    for (var i = 0; i < commentEls.length; i++) {
      var t = (commentEls[i].textContent || '').trim();
      if (t.length > 20 && t.length < 1000) {
        sellerNotes = t.slice(0, 500);
        break;
      }
    }

    // Photos — collect full-size image URLs
    var photos = [];
    var seen = {};

    // Main gallery images (slick slider)
    var galleryImgs = document.querySelectorAll('.list-slick img, .slick-slide img, .mainphoto img');
    for (var i = 0; i < galleryImgs.length; i++) {
      var src = galleryImgs[i].getAttribute('data-lazy') || galleryImgs[i].getAttribute('data-src') || galleryImgs[i].getAttribute('src') || '';
      if (src && !seen[src] && src.indexOf('nophoto') === -1 && src.indexOf('noimage') === -1) {
        // Upgrade to full-size (J) if not already
        src = src.replace(/\\/[PQSO]\\//, '/J/');
        if (src.startsWith('//')) src = 'https:' + src;
        seen[src] = true;
        photos.push(src);
      }
    }

    // Thumbnail gallery as fallback
    if (photos.length === 0) {
      var thumbImgs = document.querySelectorAll('.list-thumb img, .thumbnail img, .sub_img');
      for (var i = 0; i < thumbImgs.length; i++) {
        var src = thumbImgs[i].getAttribute('data-lazy') || thumbImgs[i].getAttribute('data-src') || thumbImgs[i].getAttribute('src') || '';
        if (src && !seen[src] && src.indexOf('nophoto') === -1 && src.indexOf('noimage') === -1) {
          src = src.replace(/\\/[PQSO]\\//, '/J/');
          if (src.startsWith('//')) src = 'https:' + src;
          seen[src] = true;
          photos.push(src);
        }
      }
    }

    // Also try to find any other car images
    if (photos.length < 3) {
      var allImgs = document.querySelectorAll('img[src*="picture1.goo-net.com"]');
      for (var i = 0; i < allImgs.length; i++) {
        var src = allImgs[i].getAttribute('src') || '';
        if (src && !seen[src] && src.indexOf('nophoto') === -1 && src.indexOf('noimage') === -1 && src.indexOf('logo') === -1 && src.indexOf('icon') === -1 && src.indexOf('banner') === -1) {
          src = src.replace(/\\/[PQSO]\\//, '/J/');
          if (src.startsWith('//')) src = 'https:' + src;
          seen[src] = true;
          photos.push(src);
        }
      }
    }

    // Limit to 20 photos max
    photos = photos.slice(0, 20);

    return {
      modelName: modelName,
      grade: grade,
      modelYear: modelYear,
      mileageKm: mileageKm,
      transRaw: transRaw,
      driveRaw: driveRaw,
      displacementCc: displacementCc,
      engine: engine,
      colourRaw: colourRaw,
      chassisCode: chassisRaw,
      fuelType: fuelType,
      seatingCapacity: seatingCapacity,
      shakenExpiry: shakenRaw,
      accidentHistory: accidentHistory,
      size: size,
      startPriceJpy: startPriceJpy,
      buyPriceJpy: buyPriceJpy,
      interiorScore: interiorScore,
      exteriorScore: exteriorScore,
      hasNav: hasNav,
      hasLeather: hasLeather,
      hasSunroof: hasSunroof,
      hasAlloys: hasAlloys,
      hasPowerSteering: hasPowerSteering,
      hasPowerWindows: hasPowerWindows,
      hasRearAc: hasRearAc,
      sellerNotes: sellerNotes,
      photos: photos,
    };
  })()`) as {
    modelName: string
    grade: string | null
    modelYear: number | null
    mileageKm: number | null
    transRaw: string | null
    driveRaw: string | null
    displacementCc: number | null
    engine: string | null
    colourRaw: string | null
    chassisCode: string | null
    fuelType: string | null
    seatingCapacity: number | null
    shakenExpiry: string | null
    accidentHistory: boolean | null
    size: 'LWB' | 'SLWB' | null
    startPriceJpy: number | null
    buyPriceJpy: number | null
    interiorScore: number | null
    exteriorScore: number | null
    hasNav: boolean
    hasLeather: boolean
    hasSunroof: boolean
    hasAlloys: boolean
    hasPowerSteering: boolean
    hasPowerWindows: boolean
    hasRearAc: boolean
    sellerNotes: string | null
    photos: string[]
  } | null

  if (!data) return null

  return {
    external_id: externalId,
    source_url: url,
    model_name: data.modelName,
    grade: data.grade,
    raw_grade: data.grade,
    raw_colour: data.colourRaw,
    chassis_code: data.chassisCode,
    model_year: data.modelYear,
    transmission: parseTransmission(data.transRaw),
    displacement_cc: data.displacementCc,
    drive: parseDrive(data.driveRaw),
    engine: data.engine,
    mileage_km: data.mileageKm,
    body_colour: data.colourRaw,
    start_price_jpy: data.startPriceJpy,
    buy_price_jpy: data.buyPriceJpy,
    size: data.size,
    has_nav: data.hasNav,
    has_leather: data.hasLeather,
    has_sunroof: data.hasSunroof,
    has_alloys: data.hasAlloys,
    has_power_steering: data.hasPowerSteering,
    has_power_windows: data.hasPowerWindows,
    has_rear_ac: data.hasRearAc,
    condition_notes: null,
    seller_notes: data.sellerNotes,
    interior_score: data.interiorScore,
    exterior_score: data.exteriorScore,
    photos: data.photos,
    fuel_type: data.fuelType,
    seating_capacity: data.seatingCapacity,
    shaken_expiry: data.shakenExpiry,
    accident_history: data.accidentHistory,
  }
}
