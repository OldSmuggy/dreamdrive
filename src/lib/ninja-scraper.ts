/**
 * NINJA auction scraper — pure fetch based (no Playwright, no Firecrawl).
 *
 * Performs the full login flow (session → AJAX login → loginPrimary →
 * searchcondition → makersearch) using plain fetch with cookie tracking,
 * then paginates search results and fetches detail pages.
 *
 * Works reliably on Vercel serverless — no browser binary needed.
 */

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
// Cookie-based fetch helper
// ============================================================

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'

/** Mutable cookie jar — updated by ninjaFetch after each response */
let _cookies: Record<string, string> = {}

function cookieStr() {
  return Object.entries(_cookies).map(([k, v]) => `${k}=${v}`).join('; ')
}

/** Merge new Set-Cookie values into the cookie jar */
function absorbCookies(res: Response) {
  // Try getSetCookie (Node 20+)
  const setCookies = res.headers.getSetCookie?.() ?? []
  if (setCookies.length > 0) {
    for (const sc of setCookies) {
      const [pair] = sc.split(';')
      const [k, ...v] = pair.split('=')
      if (k?.trim()) _cookies[k.trim()] = v.join('=').trim()
    }
  } else {
    // Fallback: parse raw set-cookie header
    const raw = res.headers.get('set-cookie') || ''
    for (const part of raw.split(/,(?=\s*\w+=)/)) {
      const [pair] = part.split(';')
      const [k, ...v] = pair.split('=')
      if (k?.trim()) _cookies[k.trim()] = v.join('=').trim()
    }
  }
}

async function ninjaFetch(
  url: string,
  options?: {
    form?: Record<string, string>
    headers?: Record<string, string>
    referer?: string
  }
): Promise<{ text: string; status: number }> {
  const headers: Record<string, string> = {
    'User-Agent': UA,
    Cookie: cookieStr(),
    ...(options?.headers ?? {}),
  }
  if (options?.referer) headers['Referer'] = options.referer

  const init: RequestInit = { headers, redirect: 'manual' }

  if (options?.form) {
    init.method = 'POST'
    headers['Content-Type'] = 'application/x-www-form-urlencoded'
    init.body = new URLSearchParams(options.form).toString()
  }

  let res = await fetch(url, init)
  absorbCookies(res)

  // Follow redirects manually so we capture cookies at each hop
  let redirects = 0
  while (res.status >= 300 && res.status < 400 && redirects < 5) {
    const loc = res.headers.get('location')
    if (!loc) break
    await res.text() // consume body
    const redirectUrl = loc.startsWith('http') ? loc : `${BASE}${loc}`
    res = await fetch(redirectUrl, {
      headers: { 'User-Agent': UA, Cookie: cookieStr(), Referer: url },
      redirect: 'manual',
    })
    absorbCookies(res)
    redirects++
  }

  const text = await res.text()
  return { text, status: res.status }
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

  // Reset cookie jar for fresh session
  _cookies = {}

  // ----------------------------------------------------------
  // 1. Login via plain fetch
  // ----------------------------------------------------------
  onProgress('Step 1: Logging in...')
  const { loginJson, scHtml } = await performLogin(loginId, password, onProgress)

  if (!cookieStr().includes('JSESSIONID')) {
    throw new Error('No session cookie obtained — cannot proceed')
  }

  // ----------------------------------------------------------
  // 2. Extract form fields and POST to makersearch.action
  // ----------------------------------------------------------
  onProgress('Step 2: Navigating to makersearch (Toyota)...')

  const scFormFields = extractFormFields(scHtml)
  scFormFields['brandGroupingCode'] = '01' // Toyota
  scFormFields['bodyType'] = ''
  scFormFields['cornerSearchCheckCorner'] = ''
  scFormFields['action'] = 'init'

  const { text: msHtml, status: msStatus } = await ninjaFetch(
    `${BASE}/ninja/makersearch.action`,
    {
      form: scFormFields,
      referer: `${BASE}/ninja/searchcondition.action`,
    }
  )

  onProgress(`makersearch: status=${msStatus} len=${msHtml.length} timeout=${msHtml.includes('sessionTimeOut')}`)

  if (msHtml.includes('sessionTimeOut') || msStatus >= 400) {
    throw new Error(`makersearch failed (status ${msStatus})`)
  }

  const msFormFields = extractFormFields(msHtml)

  // ----------------------------------------------------------
  // 3. Check listing counts before attempting search
  // ----------------------------------------------------------
  onProgress('Step 3: Checking listing counts...')

  for (const catNo of CAR_CATEGORY_NOS) {
    const catName = catNo === '146' ? 'HIACE VAN' : 'REGIUS ACE VAN'
    // Look for count in makersearch page: "HIACE VAN (123)"
    const countMatch = msHtml.match(new RegExp(`${catName}\\s*\\((\\d+)\\)`, 'i'))
    const count = countMatch ? parseInt(countMatch[1]) : -1
    onProgress(`  ${catName} (${catNo}): ${count >= 0 ? count + ' listings' : 'count unknown'}`)
  }

  // ----------------------------------------------------------
  // 4. Paginate through search results for each car category
  // ----------------------------------------------------------
  onProgress('Step 4: Collecting listing references...')
  const allListingRefs: NinjaListingRef[] = []

  for (const carCategoryNo of CAR_CATEGORY_NOS) {
    onProgress(`Searching carCategoryNo=${carCategoryNo}...`)

    for (let pg = 1; pg <= 10; pg++) {
      onProgress(`  Page ${pg}...`)

      // Follow the same flow as the browser:
      // makerListChoiceCarCat() sets carCategoryNo, action=seniSearch,
      // submits form1 to searchresultlist.action
      const srFormFields = { ...msFormFields }
      srFormFields['carCategoryNo'] = carCategoryNo
      srFormFields['action'] = 'seniSearch'
      srFormFields['page'] = String(pg)

      const { text: html, status: srStatus } = await ninjaFetch(
        `${BASE}/ninja/searchresultlist.action`,
        {
          form: srFormFields,
          referer: `${BASE}/ninja/makersearch.action`,
        }
      )

      if (!html || srStatus >= 400) {
        onProgress(`  Page ${pg}: HTTP ${srStatus} — stopping`)
        break
      }

      if (isLoginPage(html) || html.includes('sessionTimeOut')) {
        onProgress(`  Page ${pg}: session expired — stopping`)
        break
      }

      const refs = extractListingRefs(html)
      if (refs.length === 0) {
        onProgress(`  Page ${pg}: 0 listings — end of results`)
        break
      }

      onProgress(`  Page ${pg}: ${refs.length} listings`)
      allListingRefs.push(...refs)

      if (!html.includes('次へ') && !html.includes('next') && refs.length < 100) break

      await delay(300)
    }
  }

  onProgress(`Total listing refs collected: ${allListingRefs.length}`)

  const limitedRefs = maxListings ? allListingRefs.slice(0, maxListings) : allListingRefs

  // ----------------------------------------------------------
  // 5. Log scrape start in Supabase
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
  // 6. Fetch detail page for each listing ref
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
      // Navigate to car detail using the panCarDetail pattern:
      // set hidden fields then POST to cardetail.action with action=search
      const detailForm = { ...msFormFields }
      detailForm['action'] = 'search'
      detailForm['KaijoCode'] = ref.KaijoCode
      detailForm['AuctionCount'] = ref.AuctionCount
      detailForm['BidNo'] = ref.BidNo
      detailForm['carKindType'] = '1'

      const { text: html } = await ninjaFetch(
        `${BASE}/ninja/cardetail.action`,
        {
          form: detailForm,
          referer: `${BASE}/ninja/searchresultlist.action`,
        }
      )

      if (!html || html.length < 500) {
        onProgress(`${label} — empty response, skipping`)
        errors++
        continue
      }

      if (isLoginPage(html)) {
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

    await delay(250)
  }

  // ----------------------------------------------------------
  // 7. Update scrape log
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
}

// ============================================================
// Login flow — pure fetch
// ============================================================

async function performLogin(
  loginId: string,
  password: string,
  onProgress: (msg: string) => void
): Promise<{ loginJson: Record<string, string>; scHtml: string }> {

  // Get JSESSIONID
  const sessionRes = await fetch(`${BASE}/ninja/`, {
    headers: { 'User-Agent': UA },
    redirect: 'manual',
  })
  absorbCookies(sessionRes)
  await sessionRes.text()

  // Follow redirect if any
  const loc = sessionRes.headers.get('location')
  if (loc) {
    const redirectUrl = loc.startsWith('http') ? loc : `${BASE}${loc}`
    const r2 = await fetch(redirectUrl, {
      headers: { 'User-Agent': UA, Cookie: cookieStr() },
      redirect: 'manual',
    })
    absorbCookies(r2)
    await r2.text()
  }

  const hasSession = cookieStr().includes('JSESSIONID')
  onProgress(`Session: JSESSIONID ${hasSession ? 'obtained' : 'NOT FOUND'} (cookie: ${cookieStr().slice(0, 60)}...)`)

  // AJAX login
  const { text: loginText } = await ninjaFetch(`${BASE}/ninja/login.action`, {
    form: { action: 'login', loginId, password, isFlg: '', language: '1' },
    headers: { 'X-Requested-With': 'XMLHttpRequest' },
    referer: `${BASE}/ninja/`,
  })

  let loginJson: Record<string, string>
  try {
    loginJson = JSON.parse(loginText)
  } catch {
    onProgress(`Login response (not JSON): ${loginText.slice(0, 300)}`)
    throw new Error('Login returned non-JSON — check credentials')
  }

  if (loginJson.errflg === '1') {
    throw new Error(`Login rejected: ${loginJson.errLoginId ?? ''} ${loginJson.errPassword ?? ''}`)
  }

  onProgress(`Login: errflg=${loginJson.errflg} buyerId=${loginJson.buyerId ?? '?'}`)

  // loginPrimary — establishes full session
  const { text: primaryHtml } = await ninjaFetch(`${BASE}/ninja/login.action`, {
    form: {
      action: 'loginPrimary', loginPrimaryGamen: '1', site: '2',
      memberCode: loginJson.memberCode ?? '', branchCode: loginJson.branchCode ?? '',
      memberName: loginJson.memberName ?? '', buyerId: loginJson.buyerId ?? '',
      buyerName: loginJson.buyerName ?? '', buyerImagePath: loginJson.buyerImagePath ?? '',
      buyerKaijoNameOpenFlg: loginJson.buyerKaijoNameOpenFlg ?? '',
      language: '1', errflg: '', ID: '', gamenGroup: '', token: '',
    },
    referer: `${BASE}/ninja/`,
  })

  // Extract form1 fields from loginPrimary response — these are the BASE
  // for all subsequent navigation (same pattern as browser form1)
  const form1 = extractFormFields(primaryHtml)
  onProgress(`loginPrimary: ${primaryHtml.length} chars, ${Object.keys(form1).length} form fields`)

  // Navigate to searchcondition (search mode)
  form1['gamenGroup'] = '22'
  form1['action'] = ''

  const { text: scHtml, status: scStatus } = await ninjaFetch(`${BASE}/ninja/searchcondition.action`, {
    form: form1,
    referer: `${BASE}/ninja/login.action`,
  })

  onProgress(`searchcondition: status=${scStatus} len=${scHtml.length} timeout=${scHtml.includes('sessionTimeOut')}`)

  if (scHtml.includes('sessionTimeOut') || scStatus >= 400) {
    onProgress(`scHtml snippet: ${scHtml.slice(0, 300).replace(/\s+/g, ' ')}`)
    throw new Error(`Search session failed (status ${scStatus})`)
  }

  return { loginJson, scHtml }
}

// ============================================================
// Helpers
// ============================================================

function isLoginPage(html: string): boolean {
  return (
    html.includes('action="/ninja/logincheck.action"') ||
    html.includes('sessionTimeOut') ||
    (html.includes('loginId') && html.includes('password') && html.length < 8000)
  )
}

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}

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

  let m: RegExpExecArray | null

  // Pattern 1: URL query params — cardetail.action?KaijoCode=X&AuctionCount=Y&BidNo=Z
  const linkRe = /cardetail\.action[^"'>\s]*KaijoCode=([^&"'>\s]+)[^"'>\s]*AuctionCount=([^&"'>\s]+)[^"'>\s]*BidNo=([^&"'>\s]+)/gi
  while ((m = linkRe.exec(html)) !== null) addRef(m[1], m[2], m[3])

  // Pattern 2: href/action attributes with cardetail URLs
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
    } catch { /* ignore malformed URLs */ }
  }

  // Pattern 3: seniCarDetail(carKindType, kaijoCode, auctionCount, bidNo, zaikoNo)
  // Defined in carlist.js — params are: 1=carKindType, 2=KaijoCode, 3=AuctionCount, 4=BidNo, 5=zaikoNo
  const seniDetailRe = /seniCarDetail\s*\(\s*'([^']+)'\s*,\s*'([^']+)'\s*,\s*'([^']+)'\s*,\s*'([^']+)'\s*(?:,\s*'([^']+)')?\s*\)/gi
  while ((m = seniDetailRe.exec(html)) !== null) addRef(m[2], m[3], m[4])

  // Pattern 4: Other onclick patterns with 3+ params (KaijoCode, AuctionCount, BidNo)
  const onclickRe = /(?:seniToCardetail|showDetail|cardetailView|carDetail|panCarDetailWith)\s*\(\s*'([^']+)'\s*,\s*'([^']+)'\s*,\s*'([^']+)'\s*\)/gi
  while ((m = onclickRe.exec(html)) !== null) addRef(m[1], m[2], m[3])

  // Pattern 5: Inline JS setting hidden fields before panCarDetail()
  // e.g.: $('#KaijoCode').val('TK');$('#AuctionCount').val('1234');$('#BidNo').val('5678');panCarDetail()
  const inlineRe = /\$\('#KaijoCode'\)\.val\('([^']+)'\)[^;]*\$\('#AuctionCount'\)\.val\('([^']+)'\)[^;]*\$\('#BidNo'\)\.val\('([^']+)'\)/gi
  while ((m = inlineRe.exec(html)) !== null) addRef(m[1], m[2], m[3])

  // Pattern 6: carListData hidden field — pipe-delimited entries separated by ж
  // Format: carKindType|KaijoCode|AuctionCount|BidNo per entry
  const cldMatch = html.match(/name="carListData"[^>]*value="([^"]+)"/)
  if (cldMatch) {
    for (const entry of cldMatch[1].split(',').filter((e: string) => e.trim())) {
      const parts = entry.split('ж')
      if (parts.length >= 4) {
        addRef(parts[1], parts[2], parts[3])
      }
    }
  }

  return refs
}

// ============================================================
// Detail page HTML parser
// ============================================================

function extractField(html: string, label: string): string | null {
  const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const patterns = [
    new RegExp(`${escaped}[^<]*</th>\\s*<td[^>]*>\\s*([^<\\r\\n]+?)\\s*(?:<|$)`, 'is'),
    new RegExp(`${escaped}[^<]*</td>\\s*<td[^>]*>\\s*([^<\\r\\n]+?)\\s*(?:<|$)`, 'is'),
    new RegExp(`${escaped}[^<]*</[^>]+>\\s*<[^>]+>\\s*<[^>]+>\\s*([^<\\r\\n]+?)\\s*<`, 'is'),
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
    if (/hyoka|inspection|sheet|hyouka/i.test(url)) {
      if (!inspectionSheet) inspectionSheet = url
    } else {
      photos.push(url)
    }
  }

  const mainRe = /id="mainPhoto"[^>]*src="([^"]+)"/i
  const mainMatch = html.match(mainRe)
  if (mainMatch) addPhoto(mainMatch[1])

  const imgRe = /src="(https?:\/\/[^"]*ninja-cartrade\.jp[^"]*\.(jpg|jpeg|png|gif))"/gi
  let m: RegExpExecArray | null
  while ((m = imgRe.exec(html)) !== null) {
    addPhoto(m[1])
    if (photos.length >= 6) break
  }

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

  let modelYear: number | null = null
  if (yearRaw) {
    const yearMatch = yearRaw.match(/(\d{4})/)
    if (yearMatch) {
      modelYear = parseInt(yearMatch[1])
    } else {
      const reiwaMatch = yearRaw.match(/R(\d+)|令和(\d+)/)
      if (reiwaMatch) modelYear = 2018 + parseInt(reiwaMatch[1] || reiwaMatch[2])
      const heiseiMatch = yearRaw.match(/H(\d+)|平成(\d+)/)
      if (heiseiMatch) modelYear = 1988 + parseInt(heiseiMatch[1] || heiseiMatch[2])
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

  let auctionDate: string | null = null
  if (auctionDateRaw) {
    auctionDate = auctionDateRaw.replace(/\//g, '-').split(/\s/)[0]
    if (!/^\d{4}-\d{2}-\d{2}$/.test(auctionDate)) auctionDate = null
  }

  const bodyColour = colourRaw ? colourRaw.split(/[（(]/)[0].trim() : null
  const { photos, inspectionSheet } = extractPhotos(html)

  const hasNav = html.includes('ナビ') || html.includes('ナビゲーション') || html.includes('カーナビ') || html.includes('フルセグ')
  const hasLeather = html.includes('レザー') || html.includes('本革')
  const hasSunroof = html.includes('サンルーフ') || html.includes('ガラスルーフ') || html.includes('ムーンルーフ')
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
