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

/**
 * Browser-side JS to submit form1 to makersearch.action.
 * Must be a plain string to avoid tsx/esbuild injecting __name helpers
 * into function declarations inside page.evaluate().
 */
const SUBMIT_TO_MAKERSEARCH_JS = `(function() {
  var form = document.getElementById('form1');
  if (!form) return;
  var setOrCreate = function(id, value) {
    var el = document.getElementById(id);
    if (!el) { el = document.createElement('input'); el.type = 'hidden'; el.id = id; el.name = id; form.appendChild(el); }
    el.value = value;
  };
  setOrCreate('brandGroupingCode', '01');
  setOrCreate('action', 'init');
  form.action = 'makersearch.action';
  form.submit();
})()`

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

export interface NinjaFilterOptions {
  yearFrom?: number    // e.g. 2015
  yearTo?: number      // e.g. 2024
  driveType?: '2WD' | '4WD' | 'any'
}

export async function runNinjaScraper(options: {
  maxListings?: number
  filters?: NinjaFilterOptions
  onProgress?: (msg: string) => void
}): Promise<ScrapeResult> {
  const { maxListings, filters, onProgress = console.log } = options

  // Log active filters
  if (filters?.yearFrom || filters?.yearTo || (filters?.driveType && filters.driveType !== 'any')) {
    onProgress(`Filters: year ${filters.yearFrom ?? 'any'}–${filters.yearTo ?? 'any'}, drive: ${filters.driveType ?? 'any'}`)
  }

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
    // 2. Set search filters and navigate to makersearch (Toyota)
    // ----------------------------------------------------------
    onProgress('Step 2: Setting filters & navigating to Toyota makersearch...')

    // Set year range filters (real field IDs: modelYearFrom, modelYearTo — SELECT elements)
    if (filters?.yearFrom) {
      await page.evaluate((y) => {
        const el = document.getElementById('modelYearFrom') as HTMLSelectElement
        if (el) el.value = String(y)
      }, filters.yearFrom)
      onProgress(`  Set year from: ${filters.yearFrom}`)
    }
    if (filters?.yearTo) {
      await page.evaluate((y) => {
        const el = document.getElementById('modelYearTo') as HTMLSelectElement
        if (el) el.value = String(y)
      }, filters.yearTo)
      onProgress(`  Set year to: ${filters.yearTo}`)
    }

    // Set drive type filter (radio buttons: driveType1=99/any, driveType2=2WD, driveType3=4WD)
    // Also set the hidden field driveType_hid which carries the value through
    if (filters?.driveType && filters.driveType !== 'any') {
      const radioId = filters.driveType === '4WD' ? 'driveType3' : 'driveType2'
      await page.evaluate(({ rid, val }: { rid: string; val: string }) => {
        const radio = document.getElementById(rid) as HTMLInputElement
        if (radio) { radio.checked = true; radio.click() }
        const hid = document.getElementById('driveType_hid') as HTMLInputElement
        if (hid) hid.value = val
      }, { rid: radioId, val: filters.driveType })
      onProgress(`  Set drive type: ${filters.driveType}`)
    }

    await Promise.all([
      page.waitForNavigation({ waitUntil: 'load', timeout: 15000 }),
      page.evaluate(SUBMIT_TO_MAKERSEARCH_JS),
    ])
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
        page.evaluate(`makerListChoiceCarCat('${catNo}')`),
      ])
      await page.waitForLoadState('networkidle').catch(() => {})

      // Get result count
      const srText = await page.textContent('body') || ''
      const countMatch = srText.match(/Result[s\s　]*[：:]\s*(\d+)/i)
      const totalResults = parseInt(countMatch?.[1] || '0')
      onProgress(`    Results: ${totalResults}`)

      if (totalResults === 0) continue

      // carListData contains ALL listing refs for the entire search (not per-page)
      const pageRefs = await page.evaluate(`(function() {
        var carListData = (document.getElementById('carListData') || {}).value || '';
        var refs = [];
        var entries = carListData.split(',');
        for (var i = 0; i < entries.length; i++) {
          var entry = entries[i].trim();
          if (!entry) continue;
          var parts = entry.split('\\u0436');
          if (parts.length >= 4) {
            refs.push({ carKindType: parts[0], KaijoCode: parts[1], AuctionCount: parts[2], BidNo: parts[3] });
          }
        }
        return refs;
      })()`) as NinjaListingRef[]

      onProgress(`    Collected ${pageRefs.length} refs from carListData`)
      allRefs.push(...pageRefs)

      // Go back to makersearch for the next category
      if (CAR_CATEGORY_NOS.indexOf(catNo) < CAR_CATEGORY_NOS.length - 1) {
        onProgress(`  Going back to makersearch...`)
        await Promise.all([
          page.waitForNavigation({ waitUntil: 'load', timeout: 15000 }),
          page.evaluate(SUBMIT_TO_MAKERSEARCH_JS),
        ])
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
    // Don't pre-slice refs — iterate all and stop when we've processed enough
    const limitedRefs = uniqueRefs

    // ----------------------------------------------------------
    // 4. Log scrape start
    // ----------------------------------------------------------
    const supabase = createAdminClient()
    let logId: string | null = null

    // Ensure storage bucket exists for photo uploads
    await supabase.storage.createBucket('listing-images', { public: true }).catch(() => {})

    const { data: log } = await supabase
      .from('scrape_logs')
      .insert({ source: 'ninja', status: 'running', listings_found: uniqueRefs.length })
      .select('id')
      .single()
    logId = log?.id ?? null

    // ----------------------------------------------------------
    // 5. Fetch detail pages — click detail → scrape → recover
    //
    // After Step 3 we're on a search results page.
    // For each listing: seniCarDetail() → scrape → back-to-list or re-login.
    // Struts form tokens are single-use, so after visiting a detail page
    // we try the "Back to the list" link first, then fall back to
    // full re-login → searchcondition → makersearch → category.
    // ----------------------------------------------------------
    onProgress('Step 4: Fetching detail pages...')
    const processed: ScrapedVan[] = []
    let skipped = 0
    let errors = 0
    let newInserts = 0
    let duplicates = 0
    const visited = new Set<string>()

    // Helper: check if seniCarDetail function is available on the current page
    const hasSeniCarDetail = () =>
      page.evaluate('typeof seniCarDetail === "function"') as Promise<boolean>

    // Helper: check if we hit sessionTimeOut and need to re-login
    const isSessionTimedOut = async () => {
      const text = await page.textContent('body') || ''
      return text.includes('sessionTimeOut') || text.includes('Back to login')
    }

    // Helper: re-login from scratch (when session times out)
    const reLogin = async (logLabel: string) => {
      onProgress(`${logLabel} — session timed out, re-logging in...`)
      await page.goto(`${BASE}/ninja/`, { waitUntil: 'networkidle', timeout: 30000 })
      await humanDelay(500, 1000)
      await page.fill('#loginId', loginId)
      await humanDelay(200, 500)
      await page.fill('#password', password)
      await humanDelay(200, 500)
      await page.evaluate(`(function() {
        document.getElementById('loginId').value = '${loginId}';
        document.getElementById('password').value = '${password}';
        login();
      })()`)
      await page.waitForTimeout(3000)

      // Handle session conflict
      const bText = await page.textContent('body') || ''
      if (bText.includes('already logged in') || bText.includes('seniToSearchcondition')) {
        await Promise.all([
          page.waitForNavigation({ waitUntil: 'load', timeout: 30000 }),
          page.click('a[onclick*="seniToSearchcondition"]'),
        ])
        await page.waitForLoadState('networkidle').catch(() => {})
      }

      const url = page.url()
      if (!url.includes('searchcondition')) {
        onProgress(`${logLabel} — re-login failed, ended on ${url}`)
        return false
      }
      onProgress(`${logLabel} — re-login succeeded`)
      return true
    }

    // Helper: navigate back to results from a detail page using the "Back to the list" link
    // This uses the proper Struts form flow, keeping tokens valid
    const goBackToList = async (logLabel: string): Promise<boolean> => {
      // Try the "Back to the list" link first — it's a proper Struts navigation
      const backLink = await page.$('a[href*="javascript:seniBackToList"]')
        || await page.$('a:has-text("Back to the list")')
        || await page.$('a:has-text("back to the list")')

      if (backLink) {
        onProgress(`${logLabel} — clicking "Back to the list"...`)
        await Promise.all([
          page.waitForNavigation({ waitUntil: 'load', timeout: 30000 }),
          backLink.click(),
        ])
        await page.waitForLoadState('networkidle').catch(() => {})
        const ok = await hasSeniCarDetail()
        if (ok) return true
      }

      // Fallback: try evaluating seniBackToList() directly
      const hasFn = await page.evaluate('typeof seniBackToList === "function"')
      if (hasFn) {
        onProgress(`${logLabel} — calling seniBackToList()...`)
        await Promise.all([
          page.waitForNavigation({ waitUntil: 'load', timeout: 30000 }),
          page.evaluate('seniBackToList()'),
        ])
        await page.waitForLoadState('networkidle').catch(() => {})
        const ok = await hasSeniCarDetail()
        if (ok) return true
      }

      // Fallback: try goBack()
      onProgress(`${logLabel} — no back-to-list found, trying goBack()...`)
      await page.goBack({ waitUntil: 'networkidle', timeout: 30000 }).catch(() => {})
      await page.waitForFunction('typeof seniCarDetail === "function"', { timeout: 5000 }).catch(() => {})
      return await hasSeniCarDetail()
    }

    // Helper: full recovery — re-login and navigate from scratch to a search results page
    let recoveryCount = 0
    const recoverToResultsPage = async (logLabel: string) => {
      recoveryCount++
      onProgress(`${logLabel} — full recovery #${recoveryCount}: re-login → results...`)

      // Always re-login since direct URL navigation doesn't work with Struts
      const loggedIn = await reLogin(logLabel)
      if (!loggedIn) return false

      // We're on searchcondition now. Set up form1 and submit to makersearch
      const hasForm = await page.evaluate('!!document.getElementById("form1")')
      if (!hasForm) {
        onProgress(`${logLabel} — no form1 on searchcondition, recovery failed`)
        return false
      }

      await humanDelay(500, 1000)

      // Submit to makersearch
      await Promise.all([
        page.waitForNavigation({ waitUntil: 'load', timeout: 30000 }),
        page.evaluate(SUBMIT_TO_MAKERSEARCH_JS),
      ])
      await page.waitForLoadState('networkidle').catch(() => {})
      await humanDelay(500, 1000)

      // Click HIACE VAN category
      await Promise.all([
        page.waitForNavigation({ waitUntil: 'load', timeout: 30000 }),
        page.evaluate("makerListChoiceCarCat('146')"),
      ])
      await page.waitForLoadState('networkidle').catch(() => {})

      const ok = await hasSeniCarDetail()
      onProgress(`${logLabel} — recovery ${ok ? 'succeeded' : 'FAILED'}`)
      return ok
    }

    // After Step 3 we're on the last category's results page.
    // Verify seniCarDetail is available before starting the loop.
    let ready = await hasSeniCarDetail()
    if (!ready) {
      onProgress('  Not on a results page after Step 3, recovering...')
      ready = await recoverToResultsPage('setup')
      if (!ready) throw new Error('Cannot reach search results page')
    }
    onProgress('  ✓ On search results page — starting detail scrape')

    for (let i = 0; i < limitedRefs.length; i++) {
      // Stop when we've processed enough listings
      if (maxListings && processed.length >= maxListings) break

      const ref = limitedRefs[i]
      const refKey = `${ref.KaijoCode}|${ref.AuctionCount}|${ref.BidNo}`
      const label = `[${processed.length + 1}/${maxListings ?? limitedRefs.length}] ${ref.KaijoCode}-${ref.AuctionCount}-${ref.BidNo}`

      if (visited.has(refKey)) {
        onProgress(`${label} — already visited, skipping`)
        continue
      }

      try {
        // Human-like delay between listings
        if (i > 0) await humanDelay(2000, 5000)

        // Verify seniCarDetail is available before clicking
        const fnReady = await hasSeniCarDetail()
        if (!fnReady) {
          onProgress(`${label} — seniCarDetail not available, recovering...`)
          const recovered = await recoverToResultsPage(label)
          if (!recovered) {
            onProgress(`${label} — recovery failed, skipping`)
            errors++
            continue
          }
        }

        // CLICK INTO DETAIL PAGE
        onProgress(`${label} — clicking into detail...`)
        await Promise.all([
          page.waitForNavigation({ waitUntil: 'load', timeout: 30000 }),
          page.evaluate(
            `seniCarDetail('${ref.carKindType}','${ref.KaijoCode}','${ref.AuctionCount}','${ref.BidNo}','')`
          ),
        ])
        await page.waitForLoadState('networkidle').catch(() => {})
        visited.add(refKey)

        // Verify we actually landed on a detail page (not redirected/timed out)
        const pageUrl = page.url()
        if (await isSessionTimedOut()) {
          onProgress(`${label} — session timed out on detail navigation, will recover`)
          errors++
          continue
        }
        if (pageUrl.includes('searchcondition') || pageUrl.includes('makersearch')) {
          onProgress(`${label} — landed on ${pageUrl} instead of detail page, skipping`)
          errors++
          continue
        }

        // Take a screenshot of the detail page
        const screenshotPath = `screenshots/ninja-${ref.KaijoCode}-${ref.BidNo}.png`
        await page.screenshot({ path: screenshotPath, fullPage: true }).catch(() => {})

        // Extract van data from the detail page
        const van = await extractDetailPage(page, ref)
        if (!van) {
          onProgress(`${label} — parse failed (screenshot: ${screenshotPath})`)
          errors++
          // Try back-to-list, then full recovery if that fails
          if (!await goBackToList(label)) {
            await recoverToResultsPage(label)
          }
          await humanDelay(1000, 2000)
          continue
        }

        // Grade exclusion check
        const gradeUp = (van.grade || '').toUpperCase()
        const excluded = EXCLUDED_GRADES.find((ex) => gradeUp.includes(ex))
        if (excluded) {
          onProgress(`${label} — excluded grade: ${van.grade}`)
          skipped++
          if (!await goBackToList(label)) {
            await recoverToResultsPage(label)
          }
          await humanDelay(1000, 2000)
          continue
        }

        // Download photos by extracting pixel data from already-loaded <img> elements via canvas.
        // We can't use context.request.get() because the cardetail.action image URLs require
        // the exact session state from the page view — separate HTTP requests get HTML instead.
        const originalPhotoCount = van.photos.length
        if (van.photos.length > 0) {
          onProgress(`${label} — extracting ${van.photos.length} photos via canvas...`)
          const uploadedPhotos: string[] = []

          // Extract all photos as base64 data URLs in one evaluate call
          const photoDataUrls = await page.evaluate(`(function() {
            var results = [];
            var seenSrc = {};
            var imgs = document.querySelectorAll('img.vehicleDetailImage, .vehicleDetailImageBox img.imgboder');
            for (var i = 0; i < imgs.length; i++) {
              var img = imgs[i];
              if (!img.src || img.src.indexOf('get_image') === -1) continue;
              if (seenSrc[img.src]) continue;
              seenSrc[img.src] = true;
              if (img.naturalWidth === 0 || img.naturalHeight === 0) continue;
              try {
                var canvas = document.createElement('canvas');
                canvas.width = img.naturalWidth;
                canvas.height = img.naturalHeight;
                var ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0);
                results.push(canvas.toDataURL('image/jpeg', 0.92));
              } catch (e) {
                // CORS or tainted canvas — skip
                results.push(null);
              }
            }
            // Fallback: try thumbnail strip
            if (results.length === 0) {
              var thumbImgs = document.querySelectorAll('.photoThumb img');
              for (var i = 0; i < thumbImgs.length; i++) {
                var img = thumbImgs[i];
                if (!img.src || img.src.indexOf('get_image') === -1) continue;
                if (seenSrc[img.src]) continue;
                seenSrc[img.src] = true;
                if (img.naturalWidth === 0 || img.naturalHeight === 0) continue;
                try {
                  var canvas = document.createElement('canvas');
                  canvas.width = img.naturalWidth;
                  canvas.height = img.naturalHeight;
                  var ctx = canvas.getContext('2d');
                  ctx.drawImage(img, 0, 0);
                  results.push(canvas.toDataURL('image/jpeg', 0.92));
                } catch (e) {
                  results.push(null);
                }
              }
            }
            return results;
          })()`) as (string | null)[]

          for (let pi = 0; pi < photoDataUrls.length; pi++) {
            const dataUrl = photoDataUrls[pi]
            if (!dataUrl) continue
            try {
              // Convert data URL to buffer
              const base64 = dataUrl.split(',')[1]
              const buffer = Buffer.from(base64, 'base64')
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
            } catch (photoErr) {
              onProgress(`${label} — photo ${pi + 1} error: ${photoErr}`)
            }
          }
          van.photos = uploadedPhotos
          onProgress(`${label} — ${uploadedPhotos.length}/${originalPhotoCount} photos saved`)
        } else {
          onProgress(`${label} — no photos found on detail page`)
        }

        // Download inspection sheet via canvas extraction (same session issue as photos)
        if (van.inspection_sheet) {
          try {
            const sheetDataUrl = await page.evaluate(`(function() {
              var exImgs = document.querySelectorAll('img[src*="get_ex_image"]');
              if (exImgs.length === 0) return null;
              var img = exImgs[0];
              if (img.naturalWidth === 0 || img.naturalHeight === 0) return null;
              try {
                var canvas = document.createElement('canvas');
                canvas.width = img.naturalWidth;
                canvas.height = img.naturalHeight;
                var ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0);
                return canvas.toDataURL('image/jpeg', 0.92);
              } catch (e) {
                return null;
              }
            })()`) as string | null

            if (sheetDataUrl) {
              const base64 = sheetDataUrl.split(',')[1]
              const buffer = Buffer.from(base64, 'base64')
              const filename = `inspection-${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`
              const storagePath = `listings/${filename}`

              const { error: uploadErr } = await supabase.storage
                .from('listing-images')
                .upload(storagePath, buffer, { contentType: 'image/jpeg', upsert: false })

              if (!uploadErr) {
                const { data: { publicUrl } } = supabase.storage.from('listing-images').getPublicUrl(storagePath)
                van.inspection_sheet = publicUrl
                onProgress(`${label} — inspection sheet saved`)
              }
            } else {
              onProgress(`${label} — inspection sheet could not be extracted via canvas`)
              van.inspection_sheet = null
            }
          } catch (sheetErr) {
            onProgress(`${label} — inspection sheet error: ${sheetErr}`)
          }
        }

        processed.push(van)
        onProgress(
          `${label} ✓ ${van.grade || 'UNKNOWN'} ${van.model_year ?? '?'} ` +
          `${van.mileage_km ?? '?'}km score:${van.inspection_score ?? '-'} ¥${van.start_price_jpy ?? '?'} [${van.photos.length} photos]`
        )

        // Write to Supabase
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

        // Navigate back to results using "Back to the list" link
        onProgress(`${label} — navigating back to results...`)
        if (!await goBackToList(label)) {
          await recoverToResultsPage(label)
        }
        await humanDelay(1000, 2500)

      } catch (err) {
        onProgress(`${label} — error: ${err}`)
        errors++
        // Try back-to-list, then full recovery
        const backOk = await goBackToList(label).catch(() => false)
        if (!backOk) await recoverToResultsPage(label).catch(() => {})
        await humanDelay(1000, 2000)
      }
    }

    // ----------------------------------------------------------
    // 6. Update scrape log
    // ----------------------------------------------------------
    if (logId) {
      await supabase
        .from('scrape_logs')
        .update({
          completed_at: new Date().toISOString(),
          listings_found: uniqueRefs.length,
          listings_new: newInserts,
          status: 'success',
        })
        .eq('id', logId)
    }

    const attempted = processed.length + skipped + errors
    onProgress(
      `Done. found=${uniqueRefs.length} attempted=${attempted} processed=${processed.length} new=${newInserts} ` +
      `dupes=${duplicates} skipped=${skipped} errors=${errors}`
    )

    return {
      found: uniqueRefs.length,
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

    // Photos: get from rendered <img> tags in the gallery (class="vehicleDetailImage")
    // These have working src URLs resolved by the browser with session cookies.
    // Also grab the first large image (parent class="vehicleDetailImageBox") as fallback.
    var photos = [];
    var seenSrc = {};
    var photoImgs = document.querySelectorAll('img.vehicleDetailImage, .vehicleDetailImageBox img.imgboder');
    for (var i = 0; i < photoImgs.length; i++) {
      var src = photoImgs[i].src;
      if (src && src.indexOf('get_image') !== -1 && !seenSrc[src]) {
        seenSrc[src] = true;
        photos.push(src);
      }
    }
    // Fallback: if no vehicleDetailImage found, try thumbnail strip
    if (photos.length === 0) {
      var thumbImgs = document.querySelectorAll('.photoThumb img');
      for (var i = 0; i < thumbImgs.length; i++) {
        var src = thumbImgs[i].src;
        if (src && src.indexOf('get_image') !== -1 && !seenSrc[src]) {
          seenSrc[src] = true;
          photos.push(src);
        }
      }
    }

    // Inspection sheet: get rendered src from img[src*="get_ex_image"]
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
    status: 'draft',
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
