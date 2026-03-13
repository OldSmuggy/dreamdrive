import { chromium } from 'playwright-core'
import { createAdminClient } from './supabase'

// On Vercel/Lambda: use @sparticuz/chromium (Lambda-compatible binary, fits within 250MB limit).
// Locally: playwright's own installed Chromium via the standard PLAYWRIGHT_BROWSERS_PATH.
async function launchBrowser() {
  if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
    const sparticuz = (await import('@sparticuz/chromium')).default
    return chromium.launch({
      args: sparticuz.args,
      executablePath: await sparticuz.executablePath(),
      headless: true,
    })
  }
  // Local dev — uses the browser installed by `playwright install chromium`
  return chromium.launch({ headless: true, args: ['--no-sandbox'] })
}

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

// ============================================================
// Types
// ============================================================

export interface NinjaListingRef {
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

  const browser = await launchBrowser()

  try {
    // ----------------------------------------------------------
    // 1. Login via Playwright to obtain session cookies
    // ----------------------------------------------------------
    onProgress('Launching browser and logging in to NINJA...')

    const context = await browser.newContext({
      userAgent:
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      locale: 'ja-JP',
    })

    // ----------------------------------------------------------
    // Use a Playwright page to load the login page so the server
    // sets a JSESSIONID cookie. Then use context.request for all
    // further calls (shares the same cookie jar as the browser).
    // ----------------------------------------------------------
    const page = await context.newPage()
    onProgress('Loading NINJA login page to establish session...')
    await page.goto(`${BASE}/ninja/`, { waitUntil: 'domcontentloaded', timeout: 30000 })
    await page.close()

    // context.request shares the browser's cookie jar (including JSESSIONID)
    const req = context.request

    // ----------------------------------------------------------
    // AJAX login — replicates exactly what login.js does:
    //   $.ajax({ type:'POST', url:'login.action', data:{ action:'login', loginId, password } })
    // Returns JSON with errflg, memberCode, buyerId, etc.
    // ----------------------------------------------------------
    onProgress('Sending AJAX login request...')
    const loginAjaxRes = await req.post(`${BASE}/ninja/login.action`, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'X-Requested-With': 'XMLHttpRequest',
        Referer: `${BASE}/ninja/`,
      },
      form: {
        action: 'login',
        loginId,
        password,
        isFlg: '',
        language: '1',
      },
    })

    const loginJson = await loginAjaxRes.json().catch(() => null) as Record<string, string> | null
    onProgress(`Login AJAX status: ${loginAjaxRes.status()} errflg="${loginJson?.errflg ?? 'N/A'}"`)

    if (!loginJson) {
      throw new Error('Login AJAX returned non-JSON response — check credentials or site availability')
    }
    if (loginJson.errflg === '1') {
      throw new Error(
        `Login rejected: ${loginJson.errLoginId ?? ''} ${loginJson.errPassword ?? ''}`.trim() ||
          'Invalid credentials'
      )
    }

    // ----------------------------------------------------------
    // When errflg==9 (concurrent session), the login.js "Login" button
    // calls seniToSearchcondition() which:
    //   1. Already did loginPrimary POST → form has all member data
    //   2. Sets gamenGroup="22", action="" and submits to searchcondition.action
    //
    // We replicate that exact form submission here.
    // ----------------------------------------------------------
    onProgress('Submitting loginPrimary to establish session...')
    const lpRes = await req.post(`${BASE}/ninja/login.action`, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Referer: `${BASE}/ninja/`,
      },
      form: {
        action: 'loginPrimary',
        loginPrimaryGamen: '1',
        site: '2',
        memberCode: loginJson.memberCode ?? '',
        branchCode: loginJson.branchCode ?? '',
        memberName: loginJson.memberName ?? '',
        buyerId: loginJson.buyerId ?? '',
        buyerName: loginJson.buyerName ?? '',
        buyerImagePath: loginJson.buyerImagePath ?? '',
        buyerKaijoNameOpenFlg: loginJson.buyerKaijoNameOpenFlg ?? '',
        language: '1',
        errflg: '',
        ID: '',
        gamenGroup: '',
        token: '',
      },
    })
    onProgress(`loginPrimary status: ${lpRes.status()}`)

    // Now invoke seniToSearchcondition(): gamenGroup="22", action="", submit to searchcondition.action
    onProgress('Navigating to search condition page...')
    const scRes = await req.post(`${BASE}/ninja/searchcondition.action`, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Referer: `${BASE}/ninja/login.action`,
      },
      form: {
        action: '',
        loginPrimaryGamen: '1',
        site: '2',
        memberCode: loginJson.memberCode ?? '',
        branchCode: loginJson.branchCode ?? '',
        memberName: loginJson.memberName ?? '',
        buyerId: loginJson.buyerId ?? '',
        buyerName: loginJson.buyerName ?? '',
        buyerImagePath: loginJson.buyerImagePath ?? '',
        buyerKaijoNameOpenFlg: loginJson.buyerKaijoNameOpenFlg ?? '',
        language: '1',
        errflg: '',
        ID: '',
        gamenGroup: '22',
        token: '',
      },
    })
    const scHtml = await scRes.text()
    onProgress(`searchcondition status: ${scRes.status()} len: ${scHtml.length} sessionTimeout: ${scHtml.includes('sessionTimeOut')}`)

    if (scHtml.includes('sessionTimeOut') || scRes.status() >= 400) {
      throw new Error(`Failed to establish search session (status ${scRes.status()})`)
    }

    onProgress(`Login successful. buyerId=${loginJson.buyerId ?? '?'} memberCode=${loginJson.memberCode ?? '?'}`)

    // ----------------------------------------------------------
    // 2. Extract ALL form1 fields from searchcondition page, then
    //    POST to makersearch.action (replicates seniBrand('01'))
    //    Requires ALL hidden fields from the previous page.
    // ----------------------------------------------------------
    onProgress('Priming makersearch state (seniBrand flow)...')
    const scFormFields = extractFormFields(scHtml)
    scFormFields['brandGroupingCode'] = '01'
    scFormFields['bodyType'] = ''
    scFormFields['cornerSearchCheckCorner'] = ''
    scFormFields['action'] = 'init'

    const msRes = await req.post(`${BASE}/ninja/makersearch.action`, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Referer: `${BASE}/ninja/searchcondition.action`,
      },
      form: scFormFields,
    })
    const msHtml = await msRes.text()
    onProgress(`makersearch status: ${msRes.status()} len: ${msHtml.length} sessionTimeout: ${msHtml.includes('sessionTimeOut')}`)

    if (msHtml.includes('sessionTimeOut') || msRes.status() >= 400) {
      throw new Error(`makersearch failed (status ${msRes.status()})`)
    }

    // Extract ALL form1 fields from makersearch page for use in searchresultlist
    const msFormFields = extractFormFields(msHtml)

    // ----------------------------------------------------------
    // 3. Paginate through search results for each car category
    //    (146=HIACE VAN, 198=REGIUS ACE VAN) and collect listing refs
    // ----------------------------------------------------------
    onProgress('Collecting listing references...')
    const allListingRefs: NinjaListingRef[] = []

    for (const carCategoryNo of CAR_CATEGORY_NOS) {
      onProgress(`Searching carCategoryNo=${carCategoryNo}...`)

      for (let pg = 1; pg <= 10; pg++) {
        onProgress(`  Page ${pg}...`)

        const srFormFields = { ...msFormFields }
        srFormFields['carCategoryNo'] = carCategoryNo
        srFormFields['action'] = 'seniSearch'
        srFormFields['page'] = String(pg)
        // Remove checkbox-style fields that cause server issues
        delete srFormFields['evaluation']

        const srRes = await req.post(`${BASE}/ninja/searchresultlist.action`, {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Referer: `${BASE}/ninja/makersearch.action`,
          },
          form: srFormFields,
        })

        const html = await srRes.text()

        if (!html || srRes.status() >= 400) {
          onProgress(`  Page ${pg}: HTTP ${srRes.status()} — stopping`)
          break
        }

        if (isLoginPage(html) || html.includes('sessionTimeOut')) {
          onProgress(`  Page ${pg}: session expired — stopping`)
          break
        }

        const refs = extractListingRefs(html)
        if (refs.length === 0) {
          onProgress(`  Page ${pg}: 0 listings — end of results`)
          if (pg === 1) {
            onProgress(`  HTML snippet: ${html.substring(0, 300).replace(/\s+/g, ' ')}`)
          }
          break
        }

        onProgress(`  Page ${pg}: ${refs.length} listings`)
        allListingRefs.push(...refs)

        if (!html.includes('次へ') && !html.includes('next') && refs.length < 100) break
      }
    }

    onProgress(`Total listing refs collected: ${allListingRefs.length}`)

    const limitedRefs = maxListings ? allListingRefs.slice(0, maxListings) : allListingRefs

    // ----------------------------------------------------------
    // 4. Log scrape start in Supabase
    // ----------------------------------------------------------
    const supabase = createAdminClient()
    let logId: string | null = null

    if (!dryRun) {
      const { data: log } = await supabase
        .from('scrape_logs')
        .insert({
          source: 'ninja',
          status: 'running',
          listings_found: limitedRefs.length,
        })
        .select('id')
        .single()
      logId = log?.id ?? null
    }

    // ----------------------------------------------------------
    // 5. Fetch detail page for each listing ref
    // ----------------------------------------------------------
    const processed: ScrapedVan[] = []
    let skipped = 0
    let errors = 0
    let newInserts = 0
    let duplicates = 0

    for (let i = 0; i < limitedRefs.length; i++) {
      const ref = limitedRefs[i]
      const label = `[${i + 1}/${limitedRefs.length}] ${ref.KaijoCode}-${ref.AuctionCount}-${ref.BidNo}`

      try {
        const detailRes = await req.post(`${BASE}/ninja/cardetail.action`, {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Referer: `${BASE}/ninja/searchresultlist.action`,
          },
          form: {
            KaijoCode: ref.KaijoCode,
            AuctionCount: ref.AuctionCount,
            BidNo: ref.BidNo,
            carKindType: '1',
          },
        })
        const html = await detailRes.text()

        if (!html || html.length < 500) {
          onProgress(`${label} — empty response, skipping`)
          errors++
          continue
        }

        if (
          html.includes('action="/ninja/logincheck.action"') ||
          (html.includes('loginId') && html.length < 5000)
        ) {
          onProgress(`${label} — session expired`)
          errors++
          continue
        }

        const van = parseDetailPage(html, ref)
        if (!van) {
          onProgress(`${label} — parse failed`)
          errors++
          continue
        }

        // Grade exclusion filter
        const gradeUp = (van.grade || '').toUpperCase()
        const excluded = EXCLUDED_GRADES.find((ex) => gradeUp.includes(ex))
        if (excluded) {
          onProgress(`${label} — excluded grade: ${van.grade}`)
          skipped++
          continue
        }

        processed.push(van)

        onProgress(
          `${label} — ${van.grade || 'UNKNOWN'} ${van.model_year ?? '?'} ` +
            `${van.mileage_km ?? '?'}km score:${van.inspection_score ?? '-'} ¥${van.start_price_jpy ?? '?'}`
        )

        // Write to Supabase (skip in dryRun)
        if (!dryRun) {
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
      } catch (err) {
        onProgress(`${label} — error: ${err}`)
        errors++
      }

      // Polite delay between requests
      await delay(250)
    }

    // ----------------------------------------------------------
    // 6. Update scrape log
    // ----------------------------------------------------------
    if (!dryRun && logId) {
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

    await context.close()

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
// ============================================================
// Helpers
// ============================================================

function isLoginPage(html: string): boolean {
  return (
    html.includes('action="/ninja/logincheck.action"') ||
    html.includes('name="loginId"') ||
    (html.includes('loginId') && html.includes('password') && html.length < 8000)
  )
}

// HTTP helper
// ============================================================


function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}

// ============================================================
// Extract all <input name=... value=...> fields from a form page
// ============================================================

function extractFormFields(html: string): Record<string, string> {
  const fields: Record<string, string> = {}
  const re = /<input[^>]+name="([^"]+)"[^>]*value="([^"]*)"[^>]*/gi
  let m: RegExpExecArray | null
  while ((m = re.exec(html)) !== null) {
    fields[m[1]] = m[2]
  }
  return fields
}

// ============================================================
// Search result HTML parser — extract listing refs
// ============================================================

function extractListingRefs(html: string): NinjaListingRef[] {
  const refs: NinjaListingRef[] = []
  const seen = new Set<string>()

  const addRef = (k: string, ac: string, bn: string) => {
    const key = `${k}|${ac}|${bn}`
    if (!seen.has(key)) {
      seen.add(key)
      refs.push({ KaijoCode: k, AuctionCount: ac, BidNo: bn })
    }
  }

  // Match cardetail.action query string links
  const linkRe = /cardetail\.action[^"'>\s]*KaijoCode=([^&"'>\s]+)[^"'>\s]*AuctionCount=([^&"'>\s]+)[^"'>\s]*BidNo=([^&"'>\s]+)/gi
  let m: RegExpExecArray | null
  while ((m = linkRe.exec(html)) !== null) addRef(m[1], m[2], m[3])

  // Extract all cardetail.action hrefs and parse individually
  const hrefRe = /(?:href|action)="([^"]*cardetail\.action[^"]*)"/gi
  while ((m = hrefRe.exec(html)) !== null) {
    try {
      const href = m[1].replace(/&amp;/g, '&')
      const fullUrl = href.startsWith('http') ? href : `${BASE}${href}`
      const u = new URL(fullUrl)
      const k = u.searchParams.get('KaijoCode')
      const ac = u.searchParams.get('AuctionCount')
      const bn = u.searchParams.get('BidNo')
      if (k && ac && bn) addRef(k, ac, bn)
    } catch {}
  }

  // Match onclick/JS handlers with 3 string args:
  // seniToCardetail('TK','1234','001'), showDetail(...), cardetailView(...)
  const onclickRe = /(?:seniToCardetail|showDetail|cardetailView|carDetail)\s*\(\s*'([^']+)'\s*,\s*'([^']+)'\s*,\s*'([^']+)'\s*\)/gi
  while ((m = onclickRe.exec(html)) !== null) addRef(m[1], m[2], m[3])

  return refs
}

// ============================================================
// Detail page HTML parser
// ============================================================

function extractField(html: string, label: string): string | null {
  // Match <th>LABEL</th><td>VALUE</td> or <td class="label">LABEL</td><td>VALUE</td>
  const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const patterns = [
    new RegExp(
      `${escaped}[^<]*</th>\\s*<td[^>]*>\\s*([^<\\r\\n]+?)\\s*(?:<|$)`,
      'is'
    ),
    new RegExp(
      `${escaped}[^<]*</td>\\s*<td[^>]*>\\s*([^<\\r\\n]+?)\\s*(?:<|$)`,
      'is'
    ),
    // Some sites wrap in spans
    new RegExp(
      `${escaped}[^<]*</[^>]+>\\s*<[^>]+>\\s*<[^>]+>\\s*([^<\\r\\n]+?)\\s*<`,
      'is'
    ),
  ]
  for (const re of patterns) {
    const match = html.match(re)
    const val = match?.[1]?.trim()
    if (val && val.length > 0 && val.length < 200) return val
  }
  return null
}

function extractNumber(str: string | null): number | null {
  if (!str) return null
  const cleaned = str.replace(/[^\d]/g, '')
  const n = parseInt(cleaned, 10)
  return isNaN(n) ? null : n
}

function extractPhotos(html: string): { photos: string[]; inspectionSheet: string | null } {
  const photos: string[] = []
  let inspectionSheet: string | null = null
  const seen = new Set<string>()

  const addPhoto = (url: string) => {
    if (!url || seen.has(url) || url.includes('noimage') || url.includes('nophoto')) return
    seen.add(url)
    // Separate inspection sheet (hyoka = 評価, assessment)
    if (/hyoka|inspection|sheet|hyouka/i.test(url)) {
      if (!inspectionSheet) inspectionSheet = url
    } else {
      photos.push(url)
    }
  }

  // Main photo
  const mainRe = /id="mainPhoto"[^>]*src="([^"]+)"/i
  const mainMatch = html.match(mainRe)
  if (mainMatch) addPhoto(mainMatch[1])

  // All img srcs from ninja-cartrade domain
  const imgRe = /src="(https?:\/\/[^"]*ninja-cartrade\.jp[^"]*\.(jpg|jpeg|png|gif))"/gi
  let m: RegExpExecArray | null
  while ((m = imgRe.exec(html)) !== null) {
    addPhoto(m[1])
    if (photos.length >= 6) break
  }

  // Relative image paths (common on Japanese auction sites)
  const relImgRe = /src="(\/[^"]*\.(jpg|jpeg|png))"/gi
  while ((m = relImgRe.exec(html)) !== null) {
    addPhoto(`${BASE}${m[1]}`)
    if (photos.length >= 6) break
  }

  return { photos: photos.slice(0, 6), inspectionSheet }
}

function parseDetailPage(html: string, ref: NinjaListingRef): ScrapedVan | null {
  if (!html || html.length < 500) return null

  const grade = extractField(html, 'グレード')
  const chassisCode = extractField(html, '型式')
  const yearRaw = extractField(html, '年式')
  const mileageRaw = extractField(html, '走行距離')
  const colourRaw = extractField(html, 'ボディカラー')
  const transRaw = extractField(html, 'ミッション') || extractField(html, 'トランスミッション')
  const dispRaw = extractField(html, '排気量')
  const scoreRaw = extractField(html, '評価点') || extractField(html, '評価')
  const priceRaw = extractField(html, '開始価格') || extractField(html, '開始金額')
  const driveRaw = extractField(html, '駆動') || extractField(html, '駆動方式')
  const auctionDateRaw = extractField(html, '開催日')
  const auctionSiteRaw = extractField(html, '会場') || extractField(html, '開催場所')
  const sessionRaw = extractField(html, '開催回') || extractField(html, '回')

  // Model year: prefer 4-digit year, also handle Japanese era formats
  let modelYear: number | null = null
  if (yearRaw) {
    const yearMatch = yearRaw.match(/(\d{4})/)
    if (yearMatch) {
      modelYear = parseInt(yearMatch[1])
    } else {
      // Reiwa (R) era: R1=2019, R2=2020, etc.
      const reiwaMatch = yearRaw.match(/R(\d+)|令和(\d+)/)
      if (reiwaMatch) {
        const yr = parseInt(reiwaMatch[1] || reiwaMatch[2])
        modelYear = 2018 + yr
      }
      // Heisei (H) era: H1=1989
      const heiseiMatch = yearRaw.match(/H(\d+)|平成(\d+)/)
      if (heiseiMatch) {
        const yr = parseInt(heiseiMatch[1] || heiseiMatch[2])
        modelYear = 1988 + yr
      }
    }
  }

  let transmission: 'IA' | 'AT' | 'MT' | null = null
  if (transRaw) {
    const t = transRaw.toUpperCase()
    if (t.includes('IA') || t.includes('CVT') || t.includes('DCT')) transmission = 'IA'
    else if (t.includes('AT') || t.includes('オートマ')) transmission = 'AT'
    else if (t.includes('MT') || t.includes('マニュアル')) transmission = 'MT'
  }

  let drive: '2WD' | '4WD' | null = null
  if (driveRaw) {
    drive = /4WD|4×4|AWD|四駆/i.test(driveRaw) ? '4WD' : '2WD'
  }

  const validScores = ['S', '6', '5.5', '5', '4.5', '4', '3.5', '3', 'R', 'RA', 'X']
  const scoreClean = (scoreRaw || '').trim().toUpperCase()
  const inspectionScore = validScores.includes(scoreClean) ? scoreClean : null

  // Auction date: normalise 2024/03/21 → 2024-03-21
  let auctionDate: string | null = null
  if (auctionDateRaw) {
    auctionDate = auctionDateRaw.replace(/\//g, '-').split(/\s/)[0]
    // Validate it looks like a date
    if (!/^\d{4}-\d{2}-\d{2}$/.test(auctionDate)) auctionDate = null
  }

  const bodyColour = colourRaw ? colourRaw.split(/[（(]/)[0].trim() : null

  const { photos, inspectionSheet } = extractPhotos(html)

  // Equipment detection from Japanese text in full page HTML
  const hasNav =
    html.includes('ナビ') ||
    html.includes('ナビゲーション') ||
    html.includes('カーナビ') ||
    html.includes('フルセグ')
  const hasLeather = html.includes('レザー') || html.includes('本革')
  const hasSunroof =
    html.includes('サンルーフ') || html.includes('ガラスルーフ') || html.includes('ムーンルーフ')
  const hasAlloys = html.includes('アルミ') || html.includes('アルミホイール')

  const gradeUpper = (grade || '').toUpperCase()
  const modelName = gradeUpper ? `TOYOTA HIACE ${gradeUpper}` : 'TOYOTA HIACE VAN'

  return {
    external_id: `${ref.KaijoCode}-${ref.AuctionCount}-${ref.BidNo}`,
    kaijo_code: ref.KaijoCode,
    auction_count: sessionRaw || ref.AuctionCount,
    bid_no: ref.BidNo,
    auction_date: auctionDate,
    auction_site_name: auctionSiteRaw || null,
    model_name: modelName,
    grade: grade || null,
    chassis_code: chassisCode || null,
    model_year: modelYear,
    transmission,
    displacement_cc: extractNumber(dispRaw),
    drive,
    mileage_km: extractNumber(mileageRaw),
    inspection_score: inspectionScore,
    body_colour: bodyColour,
    start_price_jpy: extractNumber(priceRaw),
    has_nav: hasNav,
    has_leather: hasLeather,
    has_sunroof: hasSunroof,
    has_alloys: hasAlloys,
    photos,
    inspection_sheet: inspectionSheet,
  }
}

// ============================================================
// Map ScrapedVan → listings table row
// ============================================================

function toListingRow(van: ScrapedVan) {
  // AUD rough estimate: JPY × ~0.0095 exchange + ~$8,500 shipping/compliance overhead
  const audEstimate = van.start_price_jpy
    ? Math.round((van.start_price_jpy * 0.0095 + 8500) * 100)
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
