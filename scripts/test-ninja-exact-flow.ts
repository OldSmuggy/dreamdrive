/**
 * Replicate EXACTLY the browser login flow for NINJA.
 *
 * The browser's login.js for errflg=9:
 * 1. Sets form1 fields from AJAX response
 * 2. Submits EXISTING form1 (with all its default hidden fields) to login.action
 *
 * We need to capture the login page's form1 defaults, overlay login data, and submit.
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
  // Match input fields - handle name/value in either order
  const re = /<input[^>]*>/gi
  let m
  while ((m = re.exec(html)) !== null) {
    const tag = m[0]
    const nameMatch = tag.match(/name="([^"]+)"/)
    const valueMatch = tag.match(/value="([^"]*)"/)
    if (nameMatch) {
      fields[nameMatch[1]] = valueMatch ? valueMatch[1] : ''
    }
  }
  // Also match select elements with selected options
  const selectRe = /<select[^>]*name="([^"]+)"[^>]*>[\s\S]*?<\/select>/gi
  while ((m = selectRe.exec(html)) !== null) {
    const name = m[1]
    const selectedMatch = m[0].match(/<option[^>]*selected[^>]*value="([^"]*)"/)
    if (selectedMatch) fields[name] = selectedMatch[1]
  }
  return fields
}

async function doFetch(url: string, body?: string, extraHeaders?: Record<string, string>): Promise<{ text: string; status: number; location?: string }> {
  const headers: Record<string, string> = {
    'User-Agent': UA,
    Cookie: cookieStr(),
    ...extraHeaders,
  }
  const init: RequestInit = { headers, redirect: 'manual' }
  if (body) {
    init.method = 'POST'
    headers['Content-Type'] = 'application/x-www-form-urlencoded'
    init.body = body
  }
  const res = await fetch(url, init)
  absorbCookies(res)
  const location = res.headers.get('location') || undefined

  // Follow redirects
  if (res.status >= 300 && res.status < 400 && location) {
    const ru = location.startsWith('http') ? location : `${BASE}${location}`
    console.log(`  → Redirect ${res.status} to ${ru}`)
    // Consume current body
    await res.text()
    return doFetch(ru, undefined, { Referer: url })
  }

  return { text: await res.text(), status: res.status, location }
}

async function main() {
  const loginId = process.env.NINJA_LOGIN_ID!
  const password = process.env.NINJA_PASSWORD!
  console.log('=== EXACT Browser Flow ===\n')

  // Step 1: Get login page — capture ALL form1 fields
  console.log('1. Fetching login page...')
  const { text: loginPageHtml } = await doFetch(`${BASE}/ninja/`)
  const loginPageFields = extractFormFields(loginPageHtml)
  console.log(`   Login page form1 fields (${Object.keys(loginPageFields).length}):`)
  for (const [k, v] of Object.entries(loginPageFields)) {
    console.log(`     ${k} = "${v}"`)
  }

  // Step 2: AJAX Login
  console.log('\n2. AJAX Login...')
  const { text: loginText } = await doFetch(
    `${BASE}/ninja/login.action`,
    new URLSearchParams({ action: 'login', loginId, password, isFlg: '', language: '1' }).toString(),
    { 'X-Requested-With': 'XMLHttpRequest', Referer: `${BASE}/ninja/` }
  )
  const lj = JSON.parse(loginText)
  console.log(`   errflg=${lj.errflg} buyerId=${lj.buyerId} site=${lj.site}`)

  // Step 3: loginPrimary — use EXACT form1 from login page + overrides from JS
  // The browser's login.js for errflg=9 does:
  //   $('#action').val("loginPrimary");
  //   $('#memberCode').val(data.memberCode);
  //   etc.
  //   $('#form1').submit();
  // It does NOT set buyerImagePath, buyerKaijoNameOpenFlg, or other fields!
  console.log('\n3. loginPrimary (exact browser form)...')
  const primaryForm = { ...loginPageFields }
  primaryForm['action'] = 'loginPrimary'
  primaryForm['memberCode'] = lj.memberCode ?? ''
  primaryForm['branchCode'] = lj.branchCode ?? ''
  primaryForm['memberName'] = lj.memberName ?? ''
  primaryForm['buyerId'] = lj.buyerId ?? ''
  primaryForm['buyerName'] = lj.buyerName ?? ''
  // DO NOT set buyerImagePath or buyerKaijoNameOpenFlg — browser doesn't!

  console.log('   Submitting to login.action:')
  for (const [k, v] of Object.entries(primaryForm)) {
    if (v) console.log(`     ${k} = "${String(v).substring(0, 50)}"`)
  }

  const { text: primaryHtml, status: primaryStatus } = await doFetch(
    `${BASE}/ninja/login.action`,
    new URLSearchParams(primaryForm).toString(),
    { Referer: `${BASE}/ninja/login.action` }
  )
  console.log(`   Status: ${primaryStatus} Body: ${primaryHtml.length} chars`)
  writeFileSync('/tmp/ninja-primary-exact.html', primaryHtml)

  // Analyze the primaryHtml response
  const primaryFields = extractFormFields(primaryHtml)
  console.log(`   Response form fields: ${Object.keys(primaryFields).length}`)
  for (const [k, v] of Object.entries(primaryFields)) {
    if (v) console.log(`     ${k} = "${String(v).substring(0, 60)}"`)
  }

  // Check for auto-redirect JS
  const hasAutoSubmit = primaryHtml.includes('.submit()')
  const hasLocationRedirect = primaryHtml.includes('location.href') || primaryHtml.includes('location =')
  const hasOnload = primaryHtml.includes('onload')
  console.log(`   Auto-submit: ${hasAutoSubmit} | Location redirect: ${hasLocationRedirect} | Onload: ${hasOnload}`)

  // Show full body if small
  if (primaryHtml.length < 6000) {
    console.log('\n   --- Full primaryHtml ---')
    console.log(primaryHtml.replace(/\s+/g, ' ').substring(0, 2000))
    console.log('   --- end ---')
  }

  // Step 4: Navigate to searchcondition using primaryHtml form1
  console.log('\n4. searchcondition (gamenGroup=22)...')
  primaryFields['gamenGroup'] = '22'
  primaryFields['action'] = ''
  const { text: scHtml, status: scStatus } = await doFetch(
    `${BASE}/ninja/searchcondition.action`,
    new URLSearchParams(primaryFields).toString(),
    { Referer: `${BASE}/ninja/login.action` }
  )
  console.log(`   Status: ${scStatus} Body: ${scHtml.length} chars`)
  console.log(`   sessionTimeOut: ${scHtml.includes('sessionTimeOut')}`)

  // Step 5: makersearch
  console.log('\n5. makersearch (Toyota)...')
  const scFields = extractFormFields(scHtml)
  scFields['brandGroupingCode'] = '01'
  scFields['bodyType'] = ''
  scFields['cornerSearchCheckCorner'] = ''
  scFields['action'] = 'init'
  const { text: msHtml } = await doFetch(
    `${BASE}/ninja/makersearch.action`,
    new URLSearchParams(scFields).toString(),
    { Referer: `${BASE}/ninja/searchcondition.action` }
  )
  console.log(`   Body: ${msHtml.length} chars`)

  // Check counts
  const hiaceCount = msHtml.match(/HIACE VAN\s*\((\d+)\)/i)
  const regiusCount = msHtml.match(/REGIUS ACE VAN\s*\((\d+)\)/i)
  console.log(`\n=== RESULT ===`)
  console.log(`HIACE VAN: ${hiaceCount?.[1] ?? 'NOT FOUND'}`)
  console.log(`REGIUS ACE VAN: ${regiusCount?.[1] ?? 'NOT FOUND'}`)

  // Check ANY non-zero
  const catRe = /makerListChoiceCarCat\('(\d+)'\)[^<]*<\/a>\s*([^<(]+)\((\d+)\)/gi
  let catM
  const allCats: { name: string; count: number }[] = []
  while ((catM = catRe.exec(msHtml)) !== null) {
    allCats.push({ name: catM[2].trim(), count: parseInt(catM[3]) })
  }
  const withListings = allCats.filter(c => c.count > 0)
  console.log(`\nCategories total: ${allCats.length}`)
  console.log(`Categories with listings: ${withListings.length}`)
  for (const c of withListings.slice(0, 20)) {
    console.log(`  ${c.name} (${c.count})`)
  }

  if (withListings.length === 0) {
    console.log('\n>>> STILL 0 listings with exact browser flow!')
    console.log('>>> This suggests a MEMBER-LEVEL access issue, not a flow issue.')
    console.log(`>>> buyerId=${lj.buyerId} memberCode=${lj.memberCode} site=${lj.site}`)

    // Try different site values
    for (const siteVal of ['1', '3', '4']) {
      console.log(`\n--- Trying site=${siteVal} ---`)
      const altForm = { ...primaryFields }
      altForm['site'] = siteVal
      altForm['gamenGroup'] = '22'
      altForm['action'] = ''
      const { text: altSc } = await doFetch(
        `${BASE}/ninja/searchcondition.action`,
        new URLSearchParams(altForm).toString(),
        { Referer: `${BASE}/ninja/login.action` }
      )
      if (altSc.includes('sessionTimeOut') || altSc.length < 500) {
        console.log('   Session failed')
        continue
      }
      const altScFields = extractFormFields(altSc)
      altScFields['brandGroupingCode'] = '01'
      altScFields['action'] = 'init'
      const { text: altMs } = await doFetch(
        `${BASE}/ninja/makersearch.action`,
        new URLSearchParams(altScFields).toString(),
        { Referer: `${BASE}/ninja/searchcondition.action` }
      )
      const altHiace = altMs.match(/HIACE VAN\s*\((\d+)\)/i)
      console.log(`   HIACE VAN: ${altHiace?.[1] ?? 'NOT FOUND'} (body: ${altMs.length} chars)`)
    }
  }

  // Step 6: Try searchresultlist anyway to see the page structure with exact flow
  console.log('\n6. searchresultlist...')
  const msFields = extractFormFields(msHtml)
  msFields['carCategoryNo'] = '146'
  msFields['action'] = 'seniSearch'
  msFields['page'] = '1'
  const { text: srHtml } = await doFetch(
    `${BASE}/ninja/searchresultlist.action`,
    new URLSearchParams(msFields).toString(),
    { Referer: `${BASE}/ninja/makersearch.action` }
  )
  console.log(`   Body: ${srHtml.length} chars`)
  const resultsMatch = srHtml.match(/Results?\s*[：:]\s*(\d+)/i)
  console.log(`   Results count text: ${resultsMatch?.[0] ?? 'NOT FOUND'}`)

  // Look for "Results : N" or equivalent
  const resultPatterns = [
    srHtml.match(/検索結果\s*(\d+)/),
    srHtml.match(/(\d+)\s*件/),
    srHtml.match(/Results\s*:\s*(\d+)/i),
    srHtml.match(/(\d+)\s*台/),
    srHtml.match(/totalCnt[^"]*"(\d+)"/),
    srHtml.match(/makerSearchCarCnt[^"]*"(\d+)"/),
  ]
  for (const p of resultPatterns) {
    if (p) console.log(`   Count found: ${p[0]}`)
  }
  writeFileSync('/tmp/ninja-sr-exact.html', srHtml)
}

main().catch(console.error)
