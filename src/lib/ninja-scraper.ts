/**
 * NINJA auction scraper — Firecrawl + fetch based (no Playwright).
 *
 * Uses Firecrawl's executeJavascript actions to handle the AJAX login
 * flow inside a real browser, then extracts cookies and uses plain
 * fetch for all subsequent requests. Works reliably on Vercel serverless.
 */

import { createAdminClient } from './supabase'
import Firecrawl from '@mendable/firecrawl-js'

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

async function ninjaFetch(
  url: string,
  cookie: string,
  options?: {
    form?: Record<string, string>
    headers?: Record<string, string>
    referer?: string
  }
): Promise<{ text: string; status: number }> {
  const headers: Record<string, string> = {
    'User-Agent': UA,
    Cookie: cookie,
    ...(options?.headers ?? {}),
  }
  if (options?.referer) headers['Referer'] = options.referer

  const init: RequestInit = { headers, redirect: 'follow' }

  if (options?.form) {
    init.method = 'POST'
    headers['Content-Type'] = 'application/x-www-form-urlencoded'
    init.body = new URLSearchParams(options.form).toString()
  }

  const res = await fetch(url, init)
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
  const firecrawlKey = process.env.FIRECRAWL_API_KEY

  if (!loginId || !password) {
    throw new Error('NINJA_LOGIN_ID and NINJA_PASSWORD must be set in environment variables')
  }
  if (!firecrawlKey) {
    throw new Error('FIRECRAWL_API_KEY must be set for NINJA scraping')
  }

  const firecrawl = new Firecrawl({ apiKey: firecrawlKey })

  // ----------------------------------------------------------
  // 1. Use Firecrawl to load NINJA login page, execute AJAX
  //    login, and extract session cookies + search page HTML
  // ----------------------------------------------------------
  onProgress('Step 1: Loading NINJA login page via Firecrawl...')

  // Build the JS that performs the full login flow inside the browser
  const loginScript = `
    async function doLogin() {
      // Step A: AJAX login
      const loginRes = await fetch('/ninja/login.action', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'X-Requested-With': 'XMLHttpRequest'
        },
        body: new URLSearchParams({
          action: 'login',
          loginId: ${JSON.stringify(loginId)},
          password: ${JSON.stringify(password)},
          isFlg: '',
          language: '1'
        }).toString()
      });
      const loginJson = await loginRes.json();

      if (loginJson.errflg === '1') {
        return JSON.stringify({ error: 'Login rejected', details: loginJson });
      }

      // Step B: loginPrimary
      await fetch('/ninja/login.action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          action: 'loginPrimary',
          loginPrimaryGamen: '1',
          site: '2',
          memberCode: loginJson.memberCode || '',
          branchCode: loginJson.branchCode || '',
          memberName: loginJson.memberName || '',
          buyerId: loginJson.buyerId || '',
          buyerName: loginJson.buyerName || '',
          buyerImagePath: loginJson.buyerImagePath || '',
          buyerKaijoNameOpenFlg: loginJson.buyerKaijoNameOpenFlg || '',
          language: '1',
          errflg: '',
          ID: '',
          gamenGroup: '',
          token: ''
        }).toString()
      });

      // Step C: Navigate to searchcondition
      const scRes = await fetch('/ninja/searchcondition.action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          action: '',
          loginPrimaryGamen: '1',
          site: '2',
          memberCode: loginJson.memberCode || '',
          branchCode: loginJson.branchCode || '',
          memberName: loginJson.memberName || '',
          buyerId: loginJson.buyerId || '',
          buyerName: loginJson.buyerName || '',
          buyerImagePath: loginJson.buyerImagePath || '',
          buyerKaijoNameOpenFlg: loginJson.buyerKaijoNameOpenFlg || '',
          language: '1',
          errflg: '',
          ID: '',
          gamenGroup: '22',
          token: ''
        }).toString()
      });
      const scHtml = await scRes.text();

      return JSON.stringify({
        success: true,
        cookies: document.cookie,
        loginJson: loginJson,
        scHtml: scHtml,
        scStatus: scRes.status
      });
    }
    return doLogin();
  `

  let sessionCookie = ''
  let loginJson: Record<string, string> = {}
  let scHtml = ''

  try {
    const result = await firecrawl.scrape(`${BASE}/ninja/`, {
      formats: ['rawHtml'],
      timeout: 60000,
      waitFor: 3000,
      actions: [
        { type: 'wait', milliseconds: 2000 },
        { type: 'executeJavascript', script: loginScript },
      ],
    })

    // Extract results from executeJavascript
    const jsReturns = (result as any)?.actions?.javascriptReturns ?? []
    if (jsReturns.length === 0) {
      throw new Error('Firecrawl returned no JS results — login script may not have executed')
    }

    const returnValue = jsReturns[0]?.value
    let loginResult: any
    try {
      loginResult = typeof returnValue === 'string' ? JSON.parse(returnValue) : returnValue
    } catch {
      onProgress(`JS return value: ${String(returnValue).slice(0, 200)}`)
      throw new Error('Failed to parse login script result')
    }

    if (loginResult?.error) {
      throw new Error(`Login failed: ${loginResult.error} — ${JSON.stringify(loginResult.details ?? '')}`)
    }

    if (!loginResult?.success) {
      onProgress(`Login result: ${JSON.stringify(loginResult).slice(0, 300)}`)
      throw new Error('Login script did not return success')
    }

    sessionCookie = loginResult.cookies || ''
    loginJson = loginResult.loginJson || {}
    scHtml = loginResult.scHtml || ''

    onProgress(`✓ Firecrawl login successful. buyerId=${loginJson.buyerId ?? '?'} cookie length=${sessionCookie.length}`)
    onProgress(`  searchcondition status: ${loginResult.scStatus} HTML length: ${scHtml.length}`)

    if (scHtml.includes('sessionTimeOut') || scHtml.length < 500) {
      throw new Error(`Search session not established (scHtml ${scHtml.length} chars, sessionTimeOut=${scHtml.includes('sessionTimeOut')})`)
    }
  } catch (err) {
    onProgress(`Firecrawl login error: ${err}`)

    // Fallback: try plain fetch approach
    onProgress('Attempting fallback: plain fetch login...')
    const fallbackResult = await plainFetchLogin(loginId, password, onProgress)
    sessionCookie = fallbackResult.cookie
    loginJson = fallbackResult.loginJson
    scHtml = fallbackResult.scHtml
  }

  if (!sessionCookie) {
    throw new Error('No session cookie obtained — cannot proceed')
  }

  // ----------------------------------------------------------
  // 2. Extract form fields and POST to makersearch.action
  // ----------------------------------------------------------
  onProgress('Step 2: Priming makersearch state...')

  const scFormFields = extractFormFields(scHtml)
  scFormFields['brandGroupingCode'] = '01'
  scFormFields['bodyType'] = ''
  scFormFields['cornerSearchCheckCorner'] = ''
  scFormFields['action'] = 'init'

  const { text: msHtml, status: msStatus } = await ninjaFetch(
    `${BASE}/ninja/makersearch.action`,
    sessionCookie,
    {
      form: scFormFields,
      referer: `${BASE}/ninja/searchcondition.action`,
    }
  )

  onProgress(`makersearch status: ${msStatus} len: ${msHtml.length} sessionTimeout: ${msHtml.includes('sessionTimeOut')}`)

  if (msHtml.includes('sessionTimeOut') || msStatus >= 400) {
    throw new Error(`makersearch failed (status ${msStatus})`)
  }

  const msFormFields = extractFormFields(msHtml)

  // ----------------------------------------------------------
  // 3. Paginate through search results for each car category
  // ----------------------------------------------------------
  onProgress('Step 3: Collecting listing references...')
  const allListingRefs: NinjaListingRef[] = []

  for (const carCategoryNo of CAR_CATEGORY_NOS) {
    onProgress(`Searching carCategoryNo=${carCategoryNo}...`)

    for (let pg = 1; pg <= 10; pg++) {
      onProgress(`  Page ${pg}...`)

      const srFormFields = { ...msFormFields }
      srFormFields['carCategoryNo'] = carCategoryNo
      srFormFields['action'] = 'seniSearch'
      srFormFields['page'] = String(pg)
      delete srFormFields['evaluation']

      const { text: html, status: srStatus } = await ninjaFetch(
        `${BASE}/ninja/searchresultlist.action`,
        sessionCookie,
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
        if (pg === 1) {
          onProgress(`  HTML snippet: ${html.substring(0, 300).replace(/\s+/g, ' ')}`)
        }
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
      const { text: html } = await ninjaFetch(
        `${BASE}/ninja/cardetail.action`,
        sessionCookie,
        {
          form: {
            KaijoCode: ref.KaijoCode,
            AuctionCount: ref.AuctionCount,
            BidNo: ref.BidNo,
            carKindType: '1',
          },
          referer: `${BASE}/ninja/searchresultlist.action`,
        }
      )

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
// Fallback: plain fetch login (if Firecrawl actions fail)
// ============================================================

async function plainFetchLogin(
  loginId: string,
  password: string,
  onProgress: (msg: string) => void
): Promise<{ cookie: string; loginJson: Record<string, string>; scHtml: string }> {

  // Get JSESSIONID via plain fetch
  const sessionRes = await fetch(`${BASE}/ninja/`, {
    headers: { 'User-Agent': UA },
    redirect: 'manual',
  })

  let cookie = ''
  const setCookies = sessionRes.headers.getSetCookie?.() ?? []
  for (const sc of setCookies) {
    const [pair] = sc.split(';')
    const [name, ...rest] = pair.split('=')
    if (name?.trim() === 'JSESSIONID') {
      cookie = `JSESSIONID=${rest.join('=').trim()}`
    }
  }
  await sessionRes.text() // consume body

  if (!cookie) {
    // Try extracting from raw headers
    const rawCookie = sessionRes.headers.get('set-cookie') || ''
    const jsMatch = rawCookie.match(/JSESSIONID=([^;]+)/)
    if (jsMatch) cookie = `JSESSIONID=${jsMatch[1]}`
  }

  onProgress(`Fallback: JSESSIONID ${cookie ? 'obtained' : 'NOT FOUND'}`)

  // AJAX login
  const { text: loginText } = await ninjaFetch(`${BASE}/ninja/login.action`, cookie, {
    form: { action: 'login', loginId, password, isFlg: '', language: '1' },
    headers: { 'X-Requested-With': 'XMLHttpRequest' },
    referer: `${BASE}/ninja/`,
  })

  let loginJson: Record<string, string>
  try {
    loginJson = JSON.parse(loginText)
  } catch {
    throw new Error('Fallback login returned non-JSON')
  }

  if (loginJson.errflg === '1') {
    throw new Error(`Login rejected: ${loginJson.errLoginId ?? ''} ${loginJson.errPassword ?? ''}`)
  }

  onProgress(`Fallback login: errflg=${loginJson.errflg}`)

  // loginPrimary
  await ninjaFetch(`${BASE}/ninja/login.action`, cookie, {
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

  // searchcondition
  const { text: scHtml, status: scStatus } = await ninjaFetch(`${BASE}/ninja/searchcondition.action`, cookie, {
    form: {
      action: '', loginPrimaryGamen: '1', site: '2',
      memberCode: loginJson.memberCode ?? '', branchCode: loginJson.branchCode ?? '',
      memberName: loginJson.memberName ?? '', buyerId: loginJson.buyerId ?? '',
      buyerName: loginJson.buyerName ?? '', buyerImagePath: loginJson.buyerImagePath ?? '',
      buyerKaijoNameOpenFlg: loginJson.buyerKaijoNameOpenFlg ?? '',
      language: '1', errflg: '', ID: '', gamenGroup: '22', token: '',
    },
    referer: `${BASE}/ninja/login.action`,
  })

  onProgress(`Fallback searchcondition: status=${scStatus} len=${scHtml.length}`)

  if (scHtml.includes('sessionTimeOut') || scStatus >= 400) {
    throw new Error(`Fallback: search session failed (status ${scStatus})`)
  }

  return { cookie, loginJson, scHtml }
}

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

  const linkRe = /cardetail\.action[^"'>\s]*KaijoCode=([^&"'>\s]+)[^"'>\s]*AuctionCount=([^&"'>\s]+)[^"'>\s]*BidNo=([^&"'>\s]+)/gi
  let m: RegExpExecArray | null
  while ((m = linkRe.exec(html)) !== null) addRef(m[1], m[2], m[3])

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

  const onclickRe = /(?:seniToCardetail|showDetail|cardetailView|carDetail)\s*\(\s*'([^']+)'\s*,\s*'([^']+)'\s*,\s*'([^']+)'\s*\)/gi
  while ((m = onclickRe.exec(html)) !== null) addRef(m[1], m[2], m[3])

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
