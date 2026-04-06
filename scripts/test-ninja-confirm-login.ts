/**
 * Test NINJA with the session confirmation step we've been missing.
 *
 * After loginPrimary, the server shows a "session conflict" page that says
 * "A different user is already logged in... press Login to continue"
 * The Login button calls seniToSearchcondition() which submits form1.
 *
 * We need to handle this page properly — the server may need us to:
 * 1. Acknowledge the page (browser requests common.action for header/footer images)
 * 2. Submit from this page to searchcondition (the session takeover confirmation)
 */
import { readFileSync, writeFileSync } from 'fs'
import { resolve } from 'path'
try {
  const envPath = resolve(process.cwd(), '.env.local')
  const envContent = readFileSync(envPath, 'utf-8')
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eqIdx = trimmed.indexOf('=')
    if (eqIdx > 0) {
      const key = trimmed.slice(0, eqIdx).trim()
      const value = trimmed.slice(eqIdx + 1).trim()
      if (!process.env[key]) process.env[key] = value
    }
  }
} catch {}

const BASE = 'https://www.ninja-cartrade.jp'
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'
let _cookies: Record<string, string> = {}

function cookieStr() {
  return Object.entries(_cookies).map(([k, v]) => `${k}=${v}`).join('; ')
}

function absorbCookies(res: Response) {
  const setCookies = res.headers.getSetCookie?.() ?? []
  for (const sc of setCookies) {
    const [pair] = sc.split(';')
    const [k, ...v] = pair.split('=')
    if (k?.trim()) _cookies[k.trim()] = v.join('=').trim()
  }
}

function extractFormFields(html: string): Record<string, string> {
  const fields: Record<string, string> = {}
  const re = /<input[^>]*>/gi
  let m
  while ((m = re.exec(html)) !== null) {
    const tag = m[0]
    const nameMatch = tag.match(/name="([^"]+)"/)
    const valueMatch = tag.match(/value="([^"]*)"/)
    if (nameMatch) fields[nameMatch[1]] = valueMatch ? valueMatch[1] : ''
  }
  return fields
}

async function doPost(url: string, form: Record<string, string>, referer: string, extraHeaders?: Record<string, string>): Promise<{ text: string; status: number }> {
  const headers: Record<string, string> = {
    'User-Agent': UA, Cookie: cookieStr(),
    'Content-Type': 'application/x-www-form-urlencoded',
    'Referer': referer,
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    ...extraHeaders,
  }
  let res = await fetch(url, { method: 'POST', headers, redirect: 'manual', body: new URLSearchParams(form).toString() })
  absorbCookies(res)
  let r = 0
  while (res.status >= 300 && res.status < 400 && r < 5) {
    const loc = res.headers.get('location')
    if (!loc) break
    await res.text()
    const ru = loc.startsWith('http') ? loc : `${BASE}${loc}`
    console.log(`  → Redirect to ${ru}`)
    res = await fetch(ru, { headers: { 'User-Agent': UA, Cookie: cookieStr(), Referer: url }, redirect: 'manual' })
    absorbCookies(res)
    r++
  }
  return { text: await res.text(), status: res.status }
}

async function main() {
  const loginId = process.env.NINJA_LOGIN_ID!
  const password = process.env.NINJA_PASSWORD!
  console.log('=== NINJA Session Confirmation Test ===\n')

  // 1. Get login page
  console.log('1. Login page...')
  let res = await fetch(`${BASE}/ninja/`, { headers: { 'User-Agent': UA }, redirect: 'manual' })
  absorbCookies(res)
  let loginPageHtml = await res.text()
  const loc = res.headers.get('location')
  if (loc) {
    const ru = loc.startsWith('http') ? loc : `${BASE}${loc}`
    res = await fetch(ru, { headers: { 'User-Agent': UA, Cookie: cookieStr() }, redirect: 'manual' })
    absorbCookies(res)
    loginPageHtml = await res.text()
  }
  const loginPageFields = extractFormFields(loginPageHtml)
  console.log(`   Cookies: ${Object.keys(_cookies).join(', ')}`)

  // 2. AJAX Login
  console.log('2. AJAX Login...')
  const { text: loginText } = await doPost(`${BASE}/ninja/login.action`,
    { action: 'login', loginId, password, isFlg: '', language: '1' },
    `${BASE}/ninja/`,
    { 'X-Requested-With': 'XMLHttpRequest', 'Accept': 'application/json, text/javascript, */*; q=0.01' })
  const lj = JSON.parse(loginText)
  console.log(`   errflg=${lj.errflg} buyerId=${lj.buyerId}`)

  // 3. loginPrimary — use login page form + overrides
  console.log('3. loginPrimary...')
  const primaryForm = { ...loginPageFields }
  primaryForm['action'] = 'loginPrimary'
  primaryForm['memberCode'] = lj.memberCode ?? ''
  primaryForm['branchCode'] = lj.branchCode ?? ''
  primaryForm['memberName'] = lj.memberName ?? ''
  primaryForm['buyerId'] = lj.buyerId ?? ''
  primaryForm['buyerName'] = lj.buyerName ?? ''

  const { text: primaryHtml } = await doPost(`${BASE}/ninja/login.action`, primaryForm, `${BASE}/ninja/login.action`)
  console.log(`   Body: ${primaryHtml.length} chars`)
  const hasConflict = primaryHtml.includes('already logged in') || primaryHtml.includes('seniToSearchcondition')
  console.log(`   Session conflict page: ${hasConflict}`)

  if (hasConflict) {
    console.log('   → Found session conflict page. Simulating "Login" button click...')

    // The "Login" button calls seniToSearchcondition() which:
    // 1. Sets gamenGroup=22, action='', form1.action=searchcondition.action
    // 2. Submits form1

    // But first, let's also simulate what the browser does when loading this page:
    // - Request common.action?action=buyerHeaderImg (CSS background)
    // - Request common.action?action=buyerFooterImg (CSS background)

    console.log('   Requesting common.action (header/footer images)...')
    await fetch(`${BASE}/ninja/common.action?action=buyerHeaderImg`, {
      headers: { 'User-Agent': UA, Cookie: cookieStr(), Referer: `${BASE}/ninja/login.action` }
    }).then(r => { absorbCookies(r); return r.text() })

    await fetch(`${BASE}/ninja/common.action?action=buyerFooterImg`, {
      headers: { 'User-Agent': UA, Cookie: cookieStr(), Referer: `${BASE}/ninja/login.action` }
    }).then(r => { absorbCookies(r); return r.text() })

    // Also call getBuyerOpen which runs on document.ready
    console.log('   Calling getBuyerOpen (common.action POST)...')
    await doPost(`${BASE}/ninja/common.action`, { action: 'getBuyerOpen' }, `${BASE}/ninja/login.action`, {
      'X-Requested-With': 'XMLHttpRequest',
    })
  }

  // 4. Submit form1 from primaryHtml to searchcondition (same as clicking "Login" button)
  console.log('\n4. searchcondition (seniToSearchcondition from conflict page)...')
  const form1 = extractFormFields(primaryHtml)
  form1['gamenGroup'] = '22'
  form1['action'] = ''

  const { text: scHtml, status: scS } = await doPost(
    `${BASE}/ninja/searchcondition.action`, form1, `${BASE}/ninja/login.action`)
  console.log(`   Status: ${scS} Body: ${scHtml.length} chars`)
  console.log(`   sessionTimeOut: ${scHtml.includes('sessionTimeOut')}`)

  if (scHtml.includes('sessionTimeOut') || scHtml.length < 500) {
    console.log('   FAILED! Session timeout.')
    return
  }

  // 5. makersearch
  console.log('\n5. makersearch (Toyota)...')
  const scForm = extractFormFields(scHtml)
  scForm['brandGroupingCode'] = '01'
  scForm['bodyType'] = ''
  scForm['cornerSearchCheckCorner'] = ''
  scForm['action'] = 'init'
  const { text: msHtml } = await doPost(
    `${BASE}/ninja/makersearch.action`, scForm, `${BASE}/ninja/searchcondition.action`)
  console.log(`   Body: ${msHtml.length} chars`)

  const hiaceMatch = msHtml.match(/HIACE VAN\s*\((\d+)\)/i)
  const regiusMatch = msHtml.match(/REGIUS ACE VAN\s*\((\d+)\)/i)
  console.log(`\n=== RESULT ===`)
  console.log(`HIACE VAN: ${hiaceMatch?.[1] ?? 'NOT FOUND'}`)
  console.log(`REGIUS ACE VAN: ${regiusMatch?.[1] ?? 'NOT FOUND'}`)

  // Check ALL categories with listings
  const catRe = /makerListChoiceCarCat\('(\d+)'\)[^<]*<\/a>\s*([^<(]+)\((\d+)\)/gi
  let catM
  const withListings: string[] = []
  let totalListings = 0
  while ((catM = catRe.exec(msHtml)) !== null) {
    const count = parseInt(catM[3])
    if (count > 0) {
      withListings.push(`${catM[2].trim()} (${count})`)
      totalListings += count
    }
  }
  console.log(`\nCategories with listings: ${withListings.length}`)
  console.log(`Total listings: ${totalListings}`)
  for (const c of withListings.slice(0, 30)) console.log(`  ${c}`)

  if (totalListings > 0) {
    console.log('\n>>> SUCCESS! Session now has auction data access!')

    // 6. searchresultlist
    console.log('\n6. searchresultlist (HIACE VAN + REGIUS ACE VAN)...')
    const msForm = extractFormFields(msHtml)
    // Select both categories like the user does
    msForm['carCategoryNo'] = '146'
    msForm['action'] = 'seniSearch'
    msForm['page'] = '1'
    const { text: srHtml } = await doPost(
      `${BASE}/ninja/searchresultlist.action`, msForm, `${BASE}/ninja/makersearch.action`)
    console.log(`   Body: ${srHtml.length} chars`)

    const resultsMatch = srHtml.match(/Result[s\s　]*[：:]\s*(\d+)/i)
    console.log(`   Results: ${resultsMatch?.[1] ?? 'NOT FOUND'}`)

    const trCount = (srHtml.match(/<tr/gi) || []).length
    const imgCount = (srHtml.match(/<img/gi) || []).length
    const seniCarDetailCount = (srHtml.match(/seniCarDetail/gi) || []).length
    const panCarDetailCount = (srHtml.match(/panCarDetail/gi) || []).length
    console.log(`   <tr>: ${trCount} | <img>: ${imgCount} | seniCarDetail: ${seniCarDetailCount} | panCarDetail: ${panCarDetailCount}`)

    writeFileSync('/tmp/ninja-confirmed-sr.html', srHtml)
    console.log('   Saved to /tmp/ninja-confirmed-sr.html')

    // Check for listing data patterns
    const refs = extractListingRefs(srHtml)
    console.log(`   Extracted listing refs: ${refs.length}`)
    for (const r of refs.slice(0, 5)) {
      console.log(`     ${r.KaijoCode}-${r.AuctionCount}-${r.BidNo}`)
    }
  }
}

// Copy of the extraction function from ninja-scraper.ts
function extractListingRefs(html: string): Array<{KaijoCode: string; AuctionCount: string; BidNo: string}> {
  const refs: Array<{KaijoCode: string; AuctionCount: string; BidNo: string}> = []
  const seen = new Set<string>()
  const addRef = (k: string, ac: string, bn: string) => {
    const key = `${k}|${ac}|${bn}`
    if (!seen.has(key)) { seen.add(key); refs.push({ KaijoCode: k, AuctionCount: ac, BidNo: bn }) }
  }
  let m: RegExpExecArray | null

  const linkRe = /cardetail\.action[^"'>\s]*KaijoCode=([^&"'>\s]+)[^"'>\s]*AuctionCount=([^&"'>\s]+)[^"'>\s]*BidNo=([^&"'>\s]+)/gi
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

  const seniDetailRe = /seniCarDetail\s*\(\s*'([^']+)'\s*,\s*'([^']+)'\s*,\s*'([^']+)'\s*,\s*'([^']+)'\s*(?:,\s*'([^']+)')?\s*\)/gi
  while ((m = seniDetailRe.exec(html)) !== null) addRef(m[2], m[3], m[4])

  const onclickRe = /(?:seniToCardetail|showDetail|cardetailView|carDetail|panCarDetailWith)\s*\(\s*'([^']+)'\s*,\s*'([^']+)'\s*,\s*'([^']+)'\s*\)/gi
  while ((m = onclickRe.exec(html)) !== null) addRef(m[1], m[2], m[3])

  const inlineRe = /\$\('#KaijoCode'\)\.val\('([^']+)'\)[^;]*\$\('#AuctionCount'\)\.val\('([^']+)'\)[^;]*\$\('#BidNo'\)\.val\('([^']+)'\)/gi
  while ((m = inlineRe.exec(html)) !== null) addRef(m[1], m[2], m[3])

  const cldMatch = html.match(/name="carListData"[^>]*value="([^"]+)"/)
  if (cldMatch) {
    for (const entry of cldMatch[1].split(',').filter((e: string) => e.trim())) {
      const parts = entry.split('ж')
      if (parts.length >= 4) addRef(parts[1], parts[2], parts[3])
    }
  }

  return refs
}

main().catch(console.error)
