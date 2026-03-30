/**
 * NINJA auction scraper — Playwright-based (real browser).
 *
 * USS NINJA requires a real browser to function correctly due to:
 * - Server-side Struts session state tied to form tokens
 * - Single-session enforcement (conflict page on duplicate logins)
 * - Timestamp-based tokens that must be extracted from rendered pages
 *
 * Uses headless Chromium via Playwright. Cannot run on Vercel serverless —
 * must be triggered from a machine with Chromium installed.
 */

import { chromium, type Page, type BrowserContext } from 'playwright'
import { createAdminClient } from './supabase'

// ============================================================
// Constants
// ============================================================

const BASE = 'https://www.ninja-cartrade.jp'

const EXCLUDED_GRADES = [
  'DARK PRIME',
  'DARK PRIME S',
  'DARK PRIME2',
  'WELCAB',
  'WELCAB WELFARE',
]

// Car category codes: 146 = HIACE VAN, 198 = REGIUS ACE VAN
const CAR_CATEGORY_NOS = ['146', '198']

/** Random delay between min and max milliseconds to mimic human browsing */
function humanDelay(minMs = 800, maxMs = 2500): Promise<void> {
  const ms = Math.floor(Math.random() * (maxMs - minMs)) + minMs
  return new Promise((r) => setTimeout(r, ms))
}

// ============================================================
// Types
// ============================================================

export interface NinjaListingRef {
  carKindType: string
  KaijoCode: string
  AuctionCount: string
  BidNo: string
}

export interface ScrapedVan {
  external_id: string
  kaijo_code: string
  auction_count: string
  bid_no: string
  auction_date: string | null
  auction_site_name: string | null
  model_name: string
  grade: string | null
  chassis_code: string | null
  model_year: number | null
  transmission: 'IA' | 'AT' | 'MT' | null
  displacement_cc: number | null
  drive: '2WD' | '4WD' | null
  mileage_km: number | null
  inspection_score: string | null
  body_colour: string | null
  start_price_jpy: number | null
  has_nav: boolean
  has_leather: boolean
  has_sunroof: boolean
  has_alloys: boolean
  photos: string[]
  inspection_sheet: string | null
}

export interface ScrapeResult {
  found: number
  processed: number
  skipped: number
  errors: number
  newInserts: number
  duplicates: number
  sample: ScrapedVan[]
  logId: string | null
}

// ============================================================
// Main scraper entry point
// ============================================================

export async function runNinjaScraper(options: {
  dryRun?: boolean
  maxListings?: number
  onProgress?: (msg: string) => void
}): Promise<ScrapeResult> {
  const { dryRun = false, maxListings, onProgress = console.log } = options

  const loginId = process.env.NINJA_LOGIN_ID
  const password = process.env.NINJA_PASSWORD

  if (!loginId || !password) {
    throw new Error('NINJA_LOGIN_ID and NINJA_PASSWORD must be set in environment variables')
  }

  const browser = await chromium.launch({
    headless: true,
    args: [
      '--disable-blink-features=AutomationControlled',
      '--no-sandbox',
    ],
  })
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
    viewport: { width: 1280, height: 800 },
    locale: 'en-AU',
    timezoneId: 'Australia/Sydney',
  })

  try {
    const page = await context.newPage()

    // Remove automation detection signals
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'webdriver', { get: () => false })
    })

    // ----------------------------------------------------------
    // 1. Login
    // ----------------------------------------------------------
    onProgress('Step 1: Logging in to NINJA...')
    await page.goto(`${BASE}/ninja/`, { waitUntil: 'networkidle' })
    await humanDelay(1000, 2000)

    // Type credentials with human-like delays
    await page.fill('#loginId', loginId)
    await humanDelay(300, 800)
    await page.fill('#password', password)
    await humanDelay(500, 1200)

    await page.evaluate(({ loginId, password }) => {
      (document.getElementById('loginId') as HTMLInputElement).value = loginId;
      (document.getElementById('password') as HTMLInputElement).value = password;
      (window as any).login()
    }, { loginId, password })

    await page.waitForTimeout(3000)

    // Handle session conflict page
    const bodyText = await page.textContent('body') || ''
    if (bodyText.includes('already logged in') || bodyText.includes('seniToSearchcondition')) {
      onProgress('  Session conflict — confirming takeover...')
      await Promise.all([
        page.waitForNavigation({ waitUntil: 'load', timeout: 30000 }),
        page.click('a[onclick*="seniToSearchcondition"]'),
      ])
    }
    await page.waitForLoadState('networkidle').catch(() => {})

    if (!page.url().includes('searchcondition')) {
      throw new Error(`Login failed — ended up on ${page.url()}`)
    }
    onProgress('  ✓ Logged in successfully')
    await humanDelay(1000, 3000)

    // ----------------------------------------------------------
    // 2. Navigate to makersearch (Toyota)
    // ----------------------------------------------------------
    onProgress('Step 2: Navigating to Toyota makersearch...')
    await page.evaluate(() => {
      (document.getElementById('brandGroupingCode') as HTMLInputElement).value = '01';
      (document.getElementById('action') as HTMLInputElement).value = 'init';
      (document.getElementById('form1') as HTMLFormElement).action = 'makersearch.action';
      (document.getElementById('form1') as HTMLFormElement).submit()
    })
    await page.waitForNavigation({ waitUntil: 'load', timeout: 15000 })
    await page.waitForLoadState('networkidle').catch(() => {})

    await humanDelay(1000, 2000)

    // Log available counts
    const msText = await page.textContent('body') || ''
    for (const catNo of CAR_CATEGORY_NOS) {
      const name = catNo === '146' ? 'HIACE VAN' : 'REGIUS ACE VAN'
      const m = msText.match(new RegExp(`${name}\\s*\\((\\d+)\\)`, 'i'))
      onProgress(`  ${name}: ${m?.[1] ?? '0'} listings`)
    }

    // ----------------------------------------------------------
    // 3. Search each car category and collect listing refs
    // ----------------------------------------------------------
    onProgress('Step 3: Collecting listing references...')
    const allRefs: NinjaListingRef[] = []

    for (const catNo of CAR_CATEGORY_NOS) {
      const catName = catNo === '146' ? 'HIACE VAN' : 'REGIUS ACE VAN'
      onProgress(`  Searching ${catName} (${catNo})...`)
      await humanDelay(800, 2000)

      // Click the car category on makersearch page
      await Promise.all([
        page.waitForNavigation({ waitUntil: 'load', timeout: 15000 }),
        page.evaluate((no) => (window as any).makerListChoiceCarCat(no), catNo),
      ])
      await page.waitForLoadState('networkidle').catch(() => {})

      // Get result count
      const srText = await page.textContent('body') || ''
      const countMatch = srText.match(/Result[s\s　]*[：:]\s*(\d+)/i)
      const totalResults = parseInt(countMatch?.[1] || '0')
      onProgress(`    Results: ${totalResults}`)

      if (totalResults === 0) continue

      // carListData contains ALL listing refs for the entire search (not per-page)
      const pageRefs = await page.evaluate(() => {
        const carListData = (document.getElementById('carListData') as HTMLInputElement)?.value || ''
        const refs: Array<{ carKindType: string; KaijoCode: string; AuctionCount: string; BidNo: string }> = []
        for (const entry of carListData.split(',').filter(e => e.trim())) {
          const parts = entry.split('ж')
          if (parts.length >= 4) {
            refs.push({
              carKindType: parts[0],
              KaijoCode: parts[1],
              AuctionCount: parts[2],
              BidNo: parts[3],
            })
          }
        }
        return refs
      })

      onProgress(`    Collected ${pageRefs.length} refs from carListData`)
      allRefs.push(...pageRefs)

      // Go back to makersearch for the next category
      if (CAR_CATEGORY_NOS.indexOf(catNo) < CAR_CATEGORY_NOS.length - 1) {
        onProgress(`  Going back to makersearch...`)
        await page.evaluate(() => {
          (document.getElementById('brandGroupingCode') as HTMLInputElement).value = '01';
          (document.getElementById('action') as HTMLInputElement).value = 'init';
          (document.getElementById('form1') as HTMLFormElement).action = 'makersearch.action';
          (document.getElementById('form1') as HTMLFormElement).submit()
        })
        await page.waitForNavigation({ waitUntil: 'load', timeout: 15000 })
        await page.waitForLoadState('networkidle').catch(() => {})
      }
    }

    // Deduplicate refs
    const seen = new Set<string>()
    const uniqueRefs = allRefs.filter(r => {
      const key = `${r.KaijoCode}|${r.AuctionCount}|${r.BidNo}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })

    onProgress(`Total unique refs: ${uniqueRefs.length}`)
    const limitedRefs = maxListings ? uniqueRefs.slice(0, maxListings) : uniqueRefs

    // ----------------------------------------------------------
    // 4. Log scrape start
    // ----------------------------------------------------------
    const supabase = dryRun ? null : createAdminClient()
    let logId: string | null = null

    if (supabase) {
      const { data: log } = await supabase
        .from('scrape_logs')
        .insert({ source: 'ninja', status: 'running', listings_found: limitedRefs.length })
        .select('id')
        .single()
      logId = log?.id ?? null
    }

    // ----------------------------------------------------------
    // 5. Fetch detail pages
    // ----------------------------------------------------------
    onProgress('Step 4: Fetching detail pages...')
    const processed: ScrapedVan[] = []
    let skipped = 0
    let errors = 0
    let newInserts = 0
    let duplicates = 0

    // Navigate to the search results page first (need valid form state)
    if (!page.url().includes('searchresultlist')) {
      await Promise.all([
        page.waitForNavigation({ waitUntil: 'load', timeout: 15000 }),
        page.evaluate(() => (window as any).makerListChoiceCarCat('146')),
      ])
      await page.waitForLoadState('networkidle').catch(() => {})
    }

    for (let i = 0; i < limitedRefs.length; i++) {
      const ref = limitedRefs[i]
      const label = `[${i + 1}/${limitedRefs.length}] ${ref.KaijoCode}-${ref.AuctionCount}-${ref.BidNo}`

      try {
        // Human-like delay between detail pages (longer for first few, then vary)
        if (i > 0) await humanDelay(1500, 4000)

        // Navigate to detail page using seniCarDetail (use string eval to avoid tsx compilation artifacts)
        await Promise.all([
          page.waitForNavigation({ waitUntil: 'load', timeout: 15000 }),
          page.evaluate(
            `seniCarDetail('${ref.carKindType}','${ref.KaijoCode}','${ref.AuctionCount}','${ref.BidNo}','')`
          ),
        ])
        await page.waitForLoadState('networkidle').catch(() => {})

        // Extract van data from the detail page
        const van = await extractDetailPage(page, ref)
        if (!van) {
          onProgress(`${label} — parse failed`)
          errors++
          // Go back
          await page.goBack({ waitUntil: 'load' }).catch(() => {})
          await page.waitForLoadState('networkidle').catch(() => {})
          continue
        }

        // Grade exclusion
        const gradeUp = (van.grade || '').toUpperCase()
        const excluded = EXCLUDED_GRADES.find((ex) => gradeUp.includes(ex))
        if (excluded) {
          onProgress(`${label} — excluded grade: ${van.grade}`)
          skipped++
          await page.goBack({ waitUntil: 'load' }).catch(() => {})
          await page.waitForLoadState('networkidle').catch(() => {})
          continue
        }

        processed.push(van)
        onProgress(
          `${label} — ${van.grade || 'UNKNOWN'} ${van.model_year ?? '?'} ` +
          `${van.mileage_km ?? '?'}km score:${van.inspection_score ?? '-'} ¥${van.start_price_jpy ?? '?'}`
        )

        // Write to Supabase
        if (supabase) {
          const { data: existing } = await supabase
            .from('listings')
            .select('id')
            .eq('external_id', van.external_id)
            .maybeSingle()

          if (existing) {
            duplicates++
          } else {
            const { error: insertErr } = await supabase.from('listings').insert(toListingRow(van))
            if (insertErr) {
              onProgress(`${label} — DB error: ${insertErr.message}`)
              errors++
            } else {
              newInserts++
            }
          }
        }

        // Go back to results list
        await page.goBack({ waitUntil: 'load' }).catch(() => {})
        await page.waitForLoadState('networkidle').catch(() => {})

      } catch (err) {
        onProgress(`${label} — error: ${err}`)
        errors++
        // Try to recover by going back
        await page.goBack({ waitUntil: 'load' }).catch(() => {})
        await page.waitForLoadState('networkidle').catch(() => {})
      }

      await delay(250)
    }

    // ----------------------------------------------------------
    // 6. Update scrape log
    // ----------------------------------------------------------
    if (supabase && logId) {
      await supabase
        .from('scrape_logs')
        .update({
          completed_at: new Date().toISOString(),
          listings_found: limitedRefs.length,
          listings_new: newInserts,
          status: 'success',
        })
        .eq('id', logId)
    }

    onProgress(
      `Done. found=${limitedRefs.length} processed=${processed.length} new=${newInserts} ` +
      `dupes=${duplicates} skipped=${skipped} errors=${errors}`
    )

    return {
      found: limitedRefs.length,
      processed: processed.length,
      skipped,
      errors,
      newInserts,
      duplicates,
      sample: processed.slice(0, 10),
      logId,
    }
  } finally {
    await browser.close()
  }
}

// ============================================================
// Detail page extractor
// ============================================================

async function extractDetailPage(page: Page, ref: NinjaListingRef): Promise<ScrapedVan | null> {
  // Use string-based evaluate to avoid tsx/esbuild __name injection.
  // DOM structure: data is in CSS-classed divs, NOT in labelled th/td pairs.
  //   .vehicleDetailLeftBox → year (text), .vehicleDetailName (model + grade)
  //   .vehicleDetailPlace → auction site, date, bid no
  //   .vehicleDetailEvaluationPoint → inspection score (full-width chars)
  //   .vehicleDetailPrice → start price
  //   .vehicleDetailTable th/td → Type(chassis), Mileage, Body color, Displacement, Transmission
  //   .vehicleDetailEqTable td.onBack → equipment flags
  //   hidden inputs photo1-photo6 → photo file paths
  //   img[src*="get_ex_image"] → inspection sheet image
  interface DetailPageData {
    grade: string | null; chassisCode: string | null; yearRaw: string | null
    mileageRaw: string | null; colourRaw: string | null; transRaw: string | null
    dispRaw: string | null; scoreRaw: string | null; priceRaw: string | null
    driveRaw: string | null; auctionDateRaw: string | null; auctionSiteRaw: string | null
    sessionRaw: string | null; nameText: string; photos: string[]
    inspectionSheet: string | null; hasNav: boolean; hasLeather: boolean
    hasSunroof: boolean; hasAlloys: boolean
  }

  const data = await page.evaluate(`(function() {
    function getTableVal(label) {
      var ths = document.querySelectorAll('.vehicleDetailTable th');
      for (var i = 0; i < ths.length; i++) {
        if (ths[i].textContent && ths[i].textContent.trim().indexOf(label) !== -1) {
          var td = ths[i].nextElementSibling;
          if (td && td.tagName === 'TD') return td.textContent.trim() || null;
        }
      }
      return null;
    }

    // Header section: year, model name, grade
    var leftBox = document.querySelector('.vehicleDetailLeftBox');
    var leftBoxText = leftBox ? leftBox.textContent : '';
    var yearMatch = leftBoxText.match(/\\b(19|20)\\d{2}\\b/);
    var yearRaw = yearMatch ? yearMatch[0] : null;

    var nameEl = document.querySelector('.vehicleDetailName');
    var nameText = nameEl ? nameEl.textContent.trim().replace(/\\s+/g, ' ') : '';
    // nameText is like "TOYOTA HIACE VAN 4D 4WD DX" or "TOYOTA HIACE VAN 4D 2WD DX GL PACKAGE"
    // Extract drive from name
    var driveRaw = null;
    if (nameText.indexOf('4WD') !== -1) driveRaw = '4WD';
    else if (nameText.indexOf('2WD') !== -1 || nameText.indexOf('FR') !== -1) driveRaw = '2WD';

    // Extract grade: everything after "4WD" or "2WD" or "FR"
    var grade = null;
    var driveMatch = nameText.match(/(?:4WD|2WD|FR)\\s+(.+)/);
    if (driveMatch) {
      grade = driveMatch[1].trim();
    }

    // Auction info: site, date, session
    var placeEl = document.querySelector('.vehicleDetailPlace');
    var placeText = placeEl ? placeEl.textContent.trim().replace(/\\s+/g, ' ') : '';
    // e.g. "Yokohama 1087times 2026/03/31 Bid No.50076"
    var siteMatch = placeText.match(/^([A-Za-z]+)/);
    var auctionSiteRaw = siteMatch ? siteMatch[1] : null;
    var sessionMatch = placeText.match(/(\\d+)times/);
    var sessionRaw = sessionMatch ? sessionMatch[1] : null;
    var dateMatch = placeText.match(/(\\d{4}\\/\\d{2}\\/\\d{2})/);
    var auctionDateRaw = dateMatch ? dateMatch[1] : null;

    // Score (may be full-width like Ｓ)
    var scoreEl = document.querySelector('.vehicleDetailEvaluationPoint');
    var scoreRaw = scoreEl ? scoreEl.textContent.trim() : null;
    // Convert full-width to half-width
    if (scoreRaw) {
      scoreRaw = scoreRaw.replace(/[Ａ-Ｚａ-ｚ０-９．]/g, function(c) {
        return String.fromCharCode(c.charCodeAt(0) - 0xFEE0);
      });
    }

    // Price
    var priceEl = document.querySelector('.vehicleDetailPrice');
    var priceRaw = priceEl ? priceEl.textContent.trim() : null;

    // Table values
    var chassisCode = getTableVal('Type');
    var mileageRaw = getTableVal('Mileage');
    var colourRaw = getTableVal('Body color');
    var dispRaw = getTableVal('Displacement');
    var transRaw = getTableVal('Transmission');

    // Photos from hidden inputs (photo1-photo6)
    var photos = [];
    for (var i = 1; i <= 6; i++) {
      var input = document.getElementById('photo' + i);
      if (input && input.value) {
        photos.push('https://www.ninja-cartrade.jp/ninja/cardetail.action?action=get_image&FilePath=' + encodeURIComponent(input.value) + '&carKindType=1');
      }
    }

    // Inspection sheet: img with get_ex_image
    var inspectionSheet = null;
    var exImgs = document.querySelectorAll('img[src*="get_ex_image"]');
    if (exImgs.length > 0) {
      inspectionSheet = exImgs[0].src;
    }

    // Equipment flags from .vehicleDetailEqTable
    var eqCells = document.querySelectorAll('.vehicleDetailEqTable td');
    var hasNav = false, hasLeather = false, hasSunroof = false, hasAlloys = false;
    for (var i = 0; i < eqCells.length; i++) {
      var cell = eqCells[i];
      var isOn = cell.className.indexOf('onBack') !== -1;
      var txt = cell.textContent.toLowerCase();
      if (txt.indexOf('navigation') !== -1 || txt.indexOf('navi') !== -1) hasNav = isOn;
      if (txt.indexOf('leather') !== -1) hasLeather = isOn;
      if (txt.indexOf('sunroof') !== -1) hasSunroof = isOn;
      if (txt.indexOf('aluminum') !== -1 || txt.indexOf('alloy') !== -1) hasAlloys = isOn;
    }

    return {
      grade: grade,
      chassisCode: chassisCode,
      yearRaw: yearRaw,
      mileageRaw: mileageRaw,
      colourRaw: colourRaw,
      transRaw: transRaw,
      dispRaw: dispRaw,
      scoreRaw: scoreRaw,
      priceRaw: priceRaw,
      driveRaw: driveRaw,
      auctionDateRaw: auctionDateRaw,
      auctionSiteRaw: auctionSiteRaw,
      sessionRaw: sessionRaw,
      nameText: nameText,
      photos: photos,
      inspectionSheet: inspectionSheet,
      hasNav: hasNav,
      hasLeather: hasLeather,
      hasSunroof: hasSunroof,
      hasAlloys: hasAlloys,
    };
  })()`) as DetailPageData | null

  if (!data) return null

  // Parse year
  let modelYear: number | null = null
  if (data.yearRaw) {
    const yearMatch = data.yearRaw.match(/(\d{4})/)
    if (yearMatch) modelYear = parseInt(yearMatch[1])
  }

  // Parse transmission (may be full-width like ＩＡ)
  let transmission: 'IA' | 'AT' | 'MT' | null = null
  if (data.transRaw) {
    // Convert full-width to half-width first
    const t = data.transRaw.replace(/[Ａ-Ｚａ-ｚ]/g, (c: string) =>
      String.fromCharCode(c.charCodeAt(0) - 0xFEE0)
    ).toUpperCase()
    if (t.includes('IA') || t.includes('CVT') || t.includes('DCT')) transmission = 'IA'
    else if (t.includes('AT')) transmission = 'AT'
    else if (t.includes('MT')) transmission = 'MT'
  }

  // Parse drive from header name text
  let drive: '2WD' | '4WD' | null = null
  if (data.driveRaw) {
    drive = data.driveRaw === '4WD' ? '4WD' : '2WD'
  }

  // Parse score
  const validScores = ['S', '6', '5.5', '5', '4.5', '4', '3.5', '3', 'R', 'RA', 'X']
  const scoreClean = (data.scoreRaw || '').trim().toUpperCase()
  const inspectionScore = validScores.includes(scoreClean) ? scoreClean : null

  // Parse auction date
  let auctionDate: string | null = null
  if (data.auctionDateRaw) {
    auctionDate = data.auctionDateRaw.replace(/\//g, '-')
    if (!/^\d{4}-\d{2}-\d{2}$/.test(auctionDate)) auctionDate = null
  }

  // Parse chassis code (may be full-width like ＧＤＨ２０６Ｖ)
  let chassisCode = data.chassisCode || null
  if (chassisCode) {
    chassisCode = chassisCode.replace(/[Ａ-Ｚａ-ｚ０-９]/g, (c: string) =>
      String.fromCharCode(c.charCodeAt(0) - 0xFEE0)
    )
  }

  const bodyColour = data.colourRaw ? data.colourRaw.split(/[（(]/)[0].trim().replace(/\u00a0/g, ' ').trim() : null
  const grade = data.grade || null
  const gradeUpper = (grade || '').toUpperCase()

  // Build model name from header text
  let modelName = 'TOYOTA HIACE VAN'
  if (data.nameText) {
    // nameText is like "TOYOTA HIACE VAN 4D 4WD DX"
    const cleaned = data.nameText.replace(/\u00a0/g, ' ').trim()
    // Use the full name (without grade suffix) as model_name
    const parts = cleaned.split(/\s+/)
    // Find where grade starts (after 4WD/2WD/FR)
    const driveIdx = parts.findIndex((p: string) => /^(4WD|2WD|FR)$/.test(p))
    if (driveIdx >= 0) {
      modelName = parts.slice(0, driveIdx + 1).join(' ')
    } else {
      modelName = cleaned
    }
  }

  return {
    external_id: `${ref.KaijoCode}-${ref.AuctionCount}-${ref.BidNo}`,
    kaijo_code: ref.KaijoCode,
    auction_count: data.sessionRaw || ref.AuctionCount,
    bid_no: ref.BidNo,
    auction_date: auctionDate,
    auction_site_name: data.auctionSiteRaw || null,
    model_name: modelName,
    grade,
    chassis_code: chassisCode,
    model_year: modelYear,
    transmission,
    displacement_cc: extractNumber(data.dispRaw),
    drive,
    mileage_km: extractNumber(data.mileageRaw),
    inspection_score: inspectionScore,
    body_colour: bodyColour,
    start_price_jpy: extractNumber(data.priceRaw),
    has_nav: data.hasNav,
    has_leather: data.hasLeather,
    has_sunroof: data.hasSunroof,
    has_alloys: data.hasAlloys,
    photos: data.photos,
    inspection_sheet: data.inspectionSheet,
  }
}

// ============================================================
// Helpers
// ============================================================

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}

function extractNumber(str: string | null): number | null {
  if (!str) return null
  const cleaned = str.replace(/[^\d]/g, '')
  const n = parseInt(cleaned, 10)
  return isNaN(n) ? null : n
}

// ============================================================
// Map ScrapedVan → listings table row
// ============================================================

function toListingRow(van: ScrapedVan) {
  const audEstimate = van.start_price_jpy
    ? Math.round((van.start_price_jpy * 0.0095 + 10000) * 100)
    : null

  return {
    source: 'auction',
    external_id: van.external_id,
    kaijo_code: van.kaijo_code,
    auction_count: van.auction_count,
    bid_no: van.bid_no,
    auction_date: van.auction_date,
    model_name: van.model_name,
    grade: van.grade,
    chassis_code: van.chassis_code,
    model_year: van.model_year,
    transmission: van.transmission,
    displacement_cc: van.displacement_cc,
    drive: van.drive,
    mileage_km: van.mileage_km,
    inspection_score: van.inspection_score,
    body_colour: van.body_colour,
    start_price_jpy: van.start_price_jpy,
    aud_estimate: audEstimate,
    status: 'available',
    has_nav: van.has_nav,
    has_leather: van.has_leather,
    has_sunroof: van.has_sunroof,
    has_alloys: van.has_alloys,
    photos: van.photos,
    inspection_sheet: van.inspection_sheet,
    raw_data: {
      auction_site_name: van.auction_site_name,
    },
    scraped_at: new Date().toISOString(),
  }
}
