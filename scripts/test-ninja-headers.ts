/**
 * Test NINJA with full browser-like headers — the server may be serving
 * different content based on headers or session state.
 *
 * All Toyota categories showed (0) which is impossible — 225 Hiace listings exist.
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

// Full Chrome-like headers
const BROWSER_HEADERS: Record<string, string> = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
  'Accept-Language': 'en-US,en;q=0.9,ja;q=0.8',
  'Accept-Encoding': 'gzip, deflate, br',
  'Cache-Control': 'no-cache',
  'Pragma': 'no-cache',
  'Sec-Ch-Ua': '"Chromium";v="131", "Not_A Brand";v="24"',
  'Sec-Ch-Ua-Mobile': '?0',
  'Sec-Ch-Ua-Platform': '"macOS"',
  'Sec-Fetch-Dest': 'document',
  'Sec-Fetch-Mode': 'navigate',
  'Sec-Fetch-Site': 'same-origin',
  'Sec-Fetch-User': '?1',
  'Upgrade-Insecure-Requests': '1',
  'Connection': 'keep-alive',
}

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
  if (setCookies.length === 0) {
    const raw = res.headers.get('set-cookie') || ''
    for (const part of raw.split(/,(?=\s*\w+=)/)) {
      const [pair] = part.split(';')
      const [k, ...v] = pair.split('=')
      if (k?.trim()) _cookies[k.trim()] = v.join('=').trim()
    }
  }
}

async function browserFetch(url: string, opts?: {
  method?: string
  body?: string
  extraHeaders?: Record<string, string>
  referer?: string
}): Promise<{ text: string; status: number; allCookies: string }> {
  const headers: Record<string, string> = {
    ...BROWSER_HEADERS,
    Cookie: cookieStr(),
    ...(opts?.extraHeaders || {}),
  }
  if (opts?.referer) headers['Referer'] = opts.referer
  if (opts?.body) {
    headers['Content-Type'] = 'application/x-www-form-urlencoded'
  }

  const init: RequestInit = {
    method: opts?.method || (opts?.body ? 'POST' : 'GET'),
    headers,
    redirect: 'manual',
    body: opts?.body,
  }

  let res = await fetch(url, init)
  absorbCookies(res)

  // Log ALL response headers for debugging
  const respHeaders: Record<string, string> = {}
  res.headers.forEach((v, k) => { respHeaders[k] = v })

  let redirects = 0
  while (res.status >= 300 && res.status < 400 && redirects < 8) {
    const loc = res.headers.get('location')
    if (!loc) break
    await res.text()
    const ru = loc.startsWith('http') ? loc : `${BASE}${loc}`
    console.log(`  → Redirect ${res.status} to ${ru}`)
    res = await fetch(ru, {
      headers: { ...BROWSER_HEADERS, Cookie: cookieStr(), Referer: url },
      redirect: 'manual',
    })
    absorbCookies(res)
    redirects++
  }

  return { text: await res.text(), status: res.status, allCookies: cookieStr() }
}

function extractFormFields(html: string): Record<string, string> {
  const fields: Record<string, string> = {}
  // Match name and value in ANY order
  const re1 = /<input[^>]+name="([^"]+)"[^>]*value="([^"]*)"[^>]*/gi
  const re2 = /<input[^>]+value="([^"]*)"[^>]*name="([^"]+)"[^>]*/gi
  let m
  while ((m = re1.exec(html)) !== null) fields[m[1]] = m[2]
  while ((m = re2.exec(html)) !== null) fields[m[2]] = m[1]
  return fields
}

async function main() {
  const loginId = process.env.NINJA_LOGIN_ID!
  const password = process.env.NINJA_PASSWORD!
  console.log('=== NINJA Full Browser Headers Test ===\n')

  // Step 1: Get session with full browser headers
  console.log('1. Session (full browser headers)...')
  const { status: s1, allCookies: c1 } = await browserFetch(`${BASE}/ninja/`)
  console.log(`   Status: ${s1}`)
  console.log(`   Cookies: ${Object.keys(_cookies).join(', ')}`)
  console.log(`   JSESSIONID: ${_cookies['JSESSIONID']?.substring(0, 20)}`)
  console.log(`   AWSALB: ${_cookies['AWSALB']?.substring(0, 20) || 'NOT SET'}`)
  console.log(`   AWSALBCORS: ${_cookies['AWSALBCORS']?.substring(0, 20) || 'NOT SET'}`)
  console.log(`   All cookies: ${Object.keys(_cookies).length}`)

  // Step 2: AJAX Login
  console.log('\n2. AJAX Login...')
  const { text: loginText, status: ls } = await browserFetch(`${BASE}/ninja/login.action`, {
    body: new URLSearchParams({ action: 'login', loginId, password, isFlg: '', language: '1' }).toString(),
    extraHeaders: {
      'X-Requested-With': 'XMLHttpRequest',
      'Accept': 'application/json, text/javascript, */*; q=0.01',
      'Sec-Fetch-Dest': 'empty',
      'Sec-Fetch-Mode': 'cors',
      'Origin': BASE,
    },
    referer: `${BASE}/ninja/`,
  })
  console.log(`   Status: ${ls}`)
  const lj = JSON.parse(loginText)
  console.log(`   errflg=${lj.errflg} buyerId=${lj.buyerId}`)
  console.log(`   Cookies after login: ${Object.keys(_cookies).join(', ')}`)

  // Step 3: loginPrimary
  console.log('\n3. loginPrimary...')
  const primaryBody = new URLSearchParams({
    action: 'loginPrimary', loginPrimaryGamen: '1', site: '2',
    memberCode: lj.memberCode ?? '', branchCode: lj.branchCode ?? '',
    memberName: lj.memberName ?? '', buyerId: lj.buyerId ?? '',
    buyerName: lj.buyerName ?? '', buyerImagePath: lj.buyerImagePath ?? '',
    buyerKaijoNameOpenFlg: lj.buyerKaijoNameOpenFlg ?? '',
    language: '1', errflg: '', ID: '', gamenGroup: '', token: '',
  }).toString()
  const { text: primaryHtml, status: ps } = await browserFetch(`${BASE}/ninja/login.action`, {
    body: primaryBody,
    referer: `${BASE}/ninja/`,
  })
  console.log(`   Status: ${ps} Body: ${primaryHtml.length} chars`)
  console.log(`   Cookies: ${Object.keys(_cookies).join(', ')}`)

  const form1 = extractFormFields(primaryHtml)
  console.log(`   form1 fields: ${Object.keys(form1).length}`)

  // Step 4: searchcondition
  console.log('\n4. searchcondition...')
  form1['gamenGroup'] = '22'
  form1['action'] = ''
  const { text: scHtml, status: scs } = await browserFetch(`${BASE}/ninja/searchcondition.action`, {
    body: new URLSearchParams(form1).toString(),
    referer: `${BASE}/ninja/login.action`,
  })
  console.log(`   Status: ${scs} Body: ${scHtml.length} chars`)
  console.log(`   Has sessionTimeOut: ${scHtml.includes('sessionTimeOut')}`)
  const scForm = extractFormFields(scHtml)
  console.log(`   scForm fields: ${Object.keys(scForm).length}`)

  // Step 5: makersearch (Toyota)
  console.log('\n5. makersearch (Toyota)...')
  scForm['brandGroupingCode'] = '01'
  scForm['bodyType'] = ''
  scForm['cornerSearchCheckCorner'] = ''
  scForm['action'] = 'init'
  const { text: msHtml, status: mss } = await browserFetch(`${BASE}/ninja/makersearch.action`, {
    body: new URLSearchParams(scForm).toString(),
    referer: `${BASE}/ninja/searchcondition.action`,
  })
  console.log(`   Status: ${mss} Body: ${msHtml.length} chars`)

  // Check HIACE VAN count
  const hiaceCount = msHtml.match(/HIACE VAN\s*\((\d+)\)/i)
  const regiusCount = msHtml.match(/REGIUS ACE VAN\s*\((\d+)\)/i)
  console.log(`   HIACE VAN count: ${hiaceCount?.[1] ?? 'NOT FOUND'}`)
  console.log(`   REGIUS ACE VAN count: ${regiusCount?.[1] ?? 'NOT FOUND'}`)

  // Check ANY non-zero count
  const nonZero = msHtml.match(/\((\d{1,5})\)/g)?.filter(c => c !== '(0)') || []
  console.log(`   Non-zero category counts: ${nonZero.join(', ')}`)

  // Also check counts from categories near HIACE
  const catPattern = /makerListChoiceCarCat\('(\d+)'\)[^<]*<\/a>\s*([^<(]+)\((\d+)\)/gi
  let m
  const cats: Array<{no: string, name: string, count: number}> = []
  while ((m = catPattern.exec(msHtml)) !== null) {
    cats.push({ no: m[1], name: m[2].trim(), count: parseInt(m[3]) })
  }
  const withListings = cats.filter(c => c.count > 0)
  console.log(`   Categories with listings: ${withListings.length} / ${cats.length}`)
  for (const c of withListings.slice(0, 20)) {
    console.log(`     ${c.no}: ${c.name} (${c.count})`)
  }

  if (withListings.length === 0) {
    console.log('\n   >>> STILL 0 LISTINGS — checking if its a site/language issue...')

    // Try with language=2 (English)
    console.log('\n   Trying language=2 (English) in searchcondition...')
    const form1b = extractFormFields(primaryHtml)
    form1b['gamenGroup'] = '22'
    form1b['action'] = ''
    form1b['language'] = '2'
    const { text: scHtml2 } = await browserFetch(`${BASE}/ninja/searchcondition.action`, {
      body: new URLSearchParams(form1b).toString(),
      referer: `${BASE}/ninja/login.action`,
    })
    const scForm2 = extractFormFields(scHtml2)
    scForm2['brandGroupingCode'] = '01'
    scForm2['action'] = 'init'
    const { text: msHtml2 } = await browserFetch(`${BASE}/ninja/makersearch.action`, {
      body: new URLSearchParams(scForm2).toString(),
      referer: `${BASE}/ninja/searchcondition.action`,
    })
    const hiaceCount2 = msHtml2.match(/HIACE VAN\s*\((\d+)\)/i)
    console.log(`   HIACE VAN count (English): ${hiaceCount2?.[1] ?? 'NOT FOUND'}`)

    // Try site=1 instead of site=2
    console.log('\n   Trying site=1...')
    const form1c = extractFormFields(primaryHtml)
    form1c['gamenGroup'] = '22'
    form1c['action'] = ''
    form1c['site'] = '1'
    const { text: scHtml3 } = await browserFetch(`${BASE}/ninja/searchcondition.action`, {
      body: new URLSearchParams(form1c).toString(),
      referer: `${BASE}/ninja/login.action`,
    })
    const scForm3 = extractFormFields(scHtml3)
    scForm3['brandGroupingCode'] = '01'
    scForm3['action'] = 'init'
    const { text: msHtml3 } = await browserFetch(`${BASE}/ninja/makersearch.action`, {
      body: new URLSearchParams(scForm3).toString(),
      referer: `${BASE}/ninja/searchcondition.action`,
    })
    const hiaceCount3 = msHtml3.match(/HIACE VAN\s*\((\d+)\)/i)
    console.log(`   HIACE VAN count (site=1): ${hiaceCount3?.[1] ?? 'NOT FOUND'}`)
  }

  // Step 6: searchresultlist with seniSearch
  console.log('\n6. searchresultlist (HIACE VAN seniSearch)...')
  const msForm = extractFormFields(msHtml)
  msForm['carCategoryNo'] = '146'
  msForm['action'] = 'seniSearch'
  msForm['page'] = '1'
  const { text: srHtml, status: srs } = await browserFetch(`${BASE}/ninja/searchresultlist.action`, {
    body: new URLSearchParams(msForm).toString(),
    referer: `${BASE}/ninja/makersearch.action`,
  })
  console.log(`   Status: ${srs} Body: ${srHtml.length} chars`)

  const trCount = (srHtml.match(/<tr/gi) || []).length
  const tdCount = (srHtml.match(/<td/gi) || []).length
  const imgCount = (srHtml.match(/<img/gi) || []).length
  const tableCount = (srHtml.match(/<table/gi) || []).length
  const divCount = (srHtml.match(/<div/gi) || []).length
  const hasResults = srHtml.match(/Results?\s*[：:]\s*(\d+)/i)
  const hasCardetail = srHtml.includes('cardetail')
  const hasSeniCarDetail = srHtml.includes('seniCarDetail')
  const hasPanCarDetail = srHtml.includes('panCarDetail')

  console.log(`   <tr>: ${trCount} | <td>: ${tdCount} | <img>: ${imgCount} | <table>: ${tableCount} | <div>: ${divCount}`)
  console.log(`   Results count: ${hasResults?.[1] ?? 'NOT FOUND'}`)
  console.log(`   cardetail: ${hasCardetail} | seniCarDetail: ${hasSeniCarDetail} | panCarDetail: ${hasPanCarDetail}`)

  writeFileSync('/tmp/ninja-headers-sr.html', srHtml)
  console.log('   Saved to /tmp/ninja-headers-sr.html')

  // Check for script data or JSON embedded in page
  const scriptBlocks = srHtml.match(/<script[^>]*>[\s\S]*?<\/script>/gi) || []
  let dataScripts = 0
  for (const s of scriptBlocks) {
    if (s.includes('src=')) continue // external
    if (s.length > 500) {
      dataScripts++
      console.log(`   Large inline script: ${s.length} chars`)
      // Check for JSON data
      if (s.includes('{') && s.includes('KaijoCode')) {
        console.log('   >>> FOUND KaijoCode in script!')
      }
      if (s.includes('carListData') || s.includes('listData')) {
        console.log('   >>> FOUND listing data reference in script!')
      }
    }
  }

  // Look for hidden data patterns
  const hiddenAreas = srHtml.match(/<div[^>]*style="[^"]*display:\s*none[^"]*"[^>]*>[\s\S]*?<\/div>/gi) || []
  console.log(`   Hidden divs: ${hiddenAreas.length}`)
  for (const h of hiddenAreas.slice(0, 3)) {
    if (h.length > 200) console.log(`   Hidden div: ${h.length} chars`)
  }

  // Check textarea elements (sometimes used for hidden data)
  const textareas = srHtml.match(/<textarea[\s\S]*?<\/textarea>/gi) || []
  console.log(`   Textareas: ${textareas.length}`)
  for (const t of textareas) {
    console.log(`   Textarea: ${t.substring(0, 100)}`)
  }

  // Check for XHR/fetch patterns in inline scripts
  for (const s of scriptBlocks) {
    if (s.includes('src=')) continue
    const content = s.replace(/<\/?script[^>]*>/gi, '')
    if (content.includes('$.ajax') || content.includes('fetch(') || content.includes('$.post') || content.includes('$.get')) {
      console.log(`\n   AJAX in inline script: ${content.substring(0, 300).replace(/\s+/g, ' ')}`)
    }
  }
}

main().catch(console.error)
