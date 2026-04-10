/**
 * Debug script for NINJA scraper — dumps form fields at each step
 * Run with: npx tsx scripts/test-ninja-debug.ts
 */

// Load .env.local manually
import { readFileSync } from 'fs'
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
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'

let _sessionCookie = ''

function absorbCookies(res: Response) {
  const existing = new Map<string, string>()
  for (const pair of _sessionCookie.split('; ')) {
    const [k, ...v] = pair.split('=')
    if (k?.trim()) existing.set(k.trim(), v.join('='))
  }
  const setCookies = res.headers.getSetCookie?.() ?? []
  for (const sc of setCookies) {
    const [pair] = sc.split(';')
    const [k, ...v] = pair.split('=')
    if (k?.trim()) existing.set(k.trim(), v.join('=').trim())
  }
  _sessionCookie = Array.from(existing.entries()).map(([k, v]) => `${k}=${v}`).join('; ')
}

async function ninjaFetch(url: string, options?: {
  form?: Record<string, string>
  headers?: Record<string, string>
  referer?: string
}): Promise<{ text: string; status: number }> {
  const headers: Record<string, string> = {
    'User-Agent': UA,
    Cookie: _sessionCookie,
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

  let redirects = 0
  while (res.status >= 300 && res.status < 400 && redirects < 5) {
    const loc = res.headers.get('location')
    if (!loc) break
    await res.text()
    const redirectUrl = loc.startsWith('http') ? loc : `${BASE}${loc}`
    res = await fetch(redirectUrl, {
      headers: { 'User-Agent': UA, Cookie: _sessionCookie, Referer: url },
      redirect: 'manual',
    })
    absorbCookies(res)
    redirects++
  }

  const text = await res.text()
  return { text, status: res.status }
}

function extractAllFormFields(html: string): Record<string, string[]> {
  const fields: Record<string, string[]> = {}

  // Input fields (text, hidden, checkbox, radio)
  const inputRe = /<input[^>]*>/gi
  let m
  while ((m = inputRe.exec(html)) !== null) {
    const tag = m[0]
    const nameMatch = tag.match(/name="([^"]+)"/)
    const valueMatch = tag.match(/value="([^"]*)"/)
    const typeMatch = tag.match(/type="([^"]+)"/)
    const checkedMatch = tag.match(/checked/)

    if (nameMatch) {
      const name = nameMatch[1]
      const value = valueMatch ? valueMatch[1] : ''
      const type = typeMatch ? typeMatch[1].toLowerCase() : 'text'

      if (!fields[name]) fields[name] = []

      // For checkboxes/radios, note if they're checked
      if (type === 'checkbox' || type === 'radio') {
        fields[name].push(`${value}${checkedMatch ? ' [CHECKED]' : ''}`)
      } else {
        fields[name].push(value)
      }
    }
  }

  // Select fields
  const selectRe = /<select[^>]*name="([^"]+)"[^>]*>([\s\S]*?)<\/select>/gi
  while ((m = selectRe.exec(html)) !== null) {
    const name = m[1]
    const optionsHtml = m[2]
    const selectedRe = /<option[^>]*selected[^>]*value="([^"]*)"[^>]*>/gi
    const optM = selectedRe.exec(optionsHtml)
    if (!fields[name]) fields[name] = []
    fields[name].push(optM ? `selected=${optM[1]}` : '(no selection)')
  }

  return fields
}

function extractFormActions(html: string): string[] {
  const actions: string[] = []
  const formRe = /<form[^>]*action="([^"]*)"[^>]*>/gi
  let m
  while ((m = formRe.exec(html)) !== null) {
    actions.push(m[1])
  }
  return actions
}

async function main() {
  const loginId = process.env.NINJA_LOGIN_ID
  const password = process.env.NINJA_PASSWORD

  if (!loginId || !password) {
    console.error('Set NINJA_LOGIN_ID and NINJA_PASSWORD in .env.local')
    process.exit(1)
  }

  console.log('=== NINJA Debug Flow ===\n')

  // Step 1: Get session
  console.log('1. Getting session cookie...')
  const sessionRes = await fetch(`${BASE}/ninja/`, {
    headers: { 'User-Agent': UA },
    redirect: 'manual',
  })
  absorbCookies(sessionRes)
  await sessionRes.text()

  const loc = sessionRes.headers.get('location')
  if (loc) {
    const r2 = await fetch(loc.startsWith('http') ? loc : `${BASE}${loc}`, {
      headers: { 'User-Agent': UA, Cookie: _sessionCookie },
      redirect: 'manual',
    })
    absorbCookies(r2)
    await r2.text()
  }
  console.log(`   Cookie: ${_sessionCookie.substring(0, 80)}...`)

  // Step 2: AJAX login
  console.log('\n2. AJAX login...')
  const { text: loginText } = await ninjaFetch(`${BASE}/ninja/login.action`, {
    form: { action: 'login', loginId, password, isFlg: '', language: '1' },
    headers: { 'X-Requested-With': 'XMLHttpRequest' },
    referer: `${BASE}/ninja/`,
  })

  const loginJson = JSON.parse(loginText)
  console.log(`   errflg=${loginJson.errflg} buyerId=${loginJson.buyerId}`)

  if (loginJson.errflg === '1') {
    console.error('Login rejected!')
    process.exit(1)
  }

  // Step 3: loginPrimary
  console.log('\n3. loginPrimary...')
  await ninjaFetch(`${BASE}/ninja/login.action`, {
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
  console.log('   Done')

  // Step 4: searchcondition
  console.log('\n4. searchcondition...')
  const { text: scHtml } = await ninjaFetch(`${BASE}/ninja/searchcondition.action`, {
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
  console.log(`   HTML length: ${scHtml.length}`)
  console.log(`   Form actions: ${JSON.stringify(extractFormActions(scHtml))}`)

  const scFields = extractAllFormFields(scHtml)
  console.log(`\n   === searchcondition form fields (${Object.keys(scFields).length} fields) ===`)
  for (const [name, values] of Object.entries(scFields).sort()) {
    console.log(`   ${name}: ${values.join(' | ')}`)
  }

  // Step 5: makersearch
  console.log('\n\n5. makersearch...')
  const scSimple: Record<string, string> = {}
  const inputRe = /<input[^>]+name="([^"]+)"[^>]*value="([^"]*)"[^>]*/gi
  let m2
  while ((m2 = inputRe.exec(scHtml)) !== null) {
    scSimple[m2[1]] = m2[2]
  }
  scSimple['brandGroupingCode'] = '01'
  scSimple['bodyType'] = ''
  scSimple['cornerSearchCheckCorner'] = ''
  scSimple['action'] = 'init'

  console.log(`   Posting fields: ${JSON.stringify(scSimple, null, 2).substring(0, 500)}`)

  const { text: msHtml, status: msStatus } = await ninjaFetch(
    `${BASE}/ninja/makersearch.action`,
    { form: scSimple, referer: `${BASE}/ninja/searchcondition.action` }
  )
  console.log(`   Status: ${msStatus} HTML length: ${msHtml.length}`)
  console.log(`   Form actions: ${JSON.stringify(extractFormActions(msHtml))}`)

  const msFields = extractAllFormFields(msHtml)
  console.log(`\n   === makersearch form fields (${Object.keys(msFields).length} fields) ===`)
  for (const [name, values] of Object.entries(msFields).sort()) {
    // Show carCategoryNo values in full
    if (name === 'carCategoryNo' || name.includes('maker') || name.includes('Maker') ||
        name.includes('car') || name.includes('Car') || name.includes('action') ||
        name.includes('year') || name.includes('Year') || name.includes('mileage') ||
        name.includes('Mileage') || name.includes('page')) {
      console.log(`   ${name}: ${values.join(' | ')}`)
    }
  }

  // Show all fields briefly
  console.log(`\n   All field names: ${Object.keys(msFields).sort().join(', ')}`)

  // Step 6: Search — try with carCategoryNo=146 (HIACE VAN)
  console.log('\n\n6. searchresultlist (carCategoryNo=146)...')
  const msSimple: Record<string, string> = {}
  const inputRe2 = /<input[^>]+name="([^"]+)"[^>]*value="([^"]*)"[^>]*/gi
  while ((m2 = inputRe2.exec(msHtml)) !== null) {
    msSimple[m2[1]] = m2[2]
  }

  // Set search params
  msSimple['carCategoryNo'] = '146'
  msSimple['action'] = 'seniSearch'
  msSimple['page'] = '1'
  delete msSimple['evaluation']

  console.log(`   Posting ${Object.keys(msSimple).length} fields`)
  console.log(`   Key fields:`)
  console.log(`     action: ${msSimple['action']}`)
  console.log(`     carCategoryNo: ${msSimple['carCategoryNo']}`)
  console.log(`     page: ${msSimple['page']}`)
  console.log(`     makerNo: ${msSimple['makerNo'] ?? '(not set)'}`)
  console.log(`     makerCode: ${msSimple['makerCode'] ?? '(not set)'}`)
  console.log(`     brandGroupingCode: ${msSimple['brandGroupingCode'] ?? '(not set)'}`)

  const { text: srHtml, status: srStatus } = await ninjaFetch(
    `${BASE}/ninja/searchresultlist.action`,
    { form: msSimple, referer: `${BASE}/ninja/makersearch.action` }
  )

  console.log(`\n   Status: ${srStatus} HTML length: ${srHtml.length}`)
  console.log(`   Has cardetail: ${srHtml.includes('cardetail')}`)
  console.log(`   Has KaijoCode: ${srHtml.includes('KaijoCode')}`)
  console.log(`   Has HIACE: ${srHtml.includes('HIACE') || srHtml.includes('ハイエース')}`)
  console.log(`   Has 件 (results): ${srHtml.includes('件')}`)
  console.log(`   Has 次へ (next): ${srHtml.includes('次へ')}`)
  console.log(`   Has sessionTimeOut: ${srHtml.includes('sessionTimeOut')}`)
  console.log(`   Has login form: ${srHtml.includes('logincheck.action')}`)
  console.log(`   Form actions: ${JSON.stringify(extractFormActions(srHtml))}`)

  // Check for various patterns that might indicate results
  const patterns = [
    /cardetail/gi,
    /KaijoCode/gi,
    /BidNo/gi,
    /seniToCardetail/gi,
    /showDetail/gi,
    /onclick/gi,
    /<tr[^>]*class="[^"]*result/gi,
    /<tr[^>]*class="[^"]*list/gi,
    /resultCount|totalCount|hitCount/gi,
    /searchCount|kensu/gi,
  ]

  console.log('\n   Pattern matches in search results:')
  for (const p of patterns) {
    const matches = srHtml.match(p)
    console.log(`     ${p.source}: ${matches ? matches.length + ' matches' : 'none'}`)
  }

  // Dump a snippet of the search result HTML
  console.log('\n   === Search result HTML head (first 1000 chars) ===')
  console.log(srHtml.substring(0, 1000).replace(/\s+/g, ' '))

  // Look for any JavaScript that might load results dynamically
  const scriptRe = /<script[^>]*>([\s\S]*?)<\/script>/gi
  const scripts: string[] = []
  while ((m2 = scriptRe.exec(srHtml)) !== null) {
    if (m2[1].includes('cardetail') || m2[1].includes('search') || m2[1].includes('result') || m2[1].includes('ajax')) {
      scripts.push(m2[1].substring(0, 500))
    }
  }
  if (scripts.length > 0) {
    console.log(`\n   === Relevant script blocks (${scripts.length}) ===`)
    for (const s of scripts) {
      console.log(`   ${s.replace(/\s+/g, ' ').substring(0, 300)}`)
      console.log('   ---')
    }
  }

  // Dump the middle section that might have results
  const mid = Math.floor(srHtml.length / 2)
  console.log(`\n   === HTML around middle (${mid}) ===`)
  console.log(srHtml.substring(mid - 500, mid + 500).replace(/\s+/g, ' '))

  // Dump all onclick content to understand the pattern
  console.log('\n   === onclick handlers (first 20) ===')
  const onclickRe2 = /onclick="([^"]{5,200})"/gi
  let oc
  let ocCount = 0
  while ((oc = onclickRe2.exec(srHtml)) !== null && ocCount < 20) {
    console.log(`   ${ocCount}: ${oc[1]}`)
    ocCount++
  }

  // Find KaijoCode context
  console.log('\n   === KaijoCode context ===')
  const kjIdx = []
  let kjSearch = 0
  while (true) {
    const idx = srHtml.indexOf('KaijoCode', kjSearch)
    if (idx === -1) break
    kjIdx.push(idx)
    console.log(`   at ${idx}: ...${srHtml.substring(Math.max(0, idx - 50), idx + 100).replace(/\s+/g, ' ')}...`)
    kjSearch = idx + 10
  }

  // Find BidNo context
  console.log('\n   === BidNo context ===')
  let bnSearch = 0
  while (true) {
    const idx = srHtml.indexOf('BidNo', bnSearch)
    if (idx === -1) break
    console.log(`   at ${idx}: ...${srHtml.substring(Math.max(0, idx - 50), idx + 100).replace(/\s+/g, ' ')}...`)
    bnSearch = idx + 10
  }

  // Look for hidden inputs or JS data arrays with listing data
  console.log('\n   === carListData or listing data ===')
  const cldMatch = srHtml.match(/carListData[^"]*"([^"]+)"/i)
  if (cldMatch) {
    console.log(`   carListData value: ${cldMatch[1].substring(0, 300)}`)
  }

  // Look for any function that navigates to car detail
  const funcRe = /function\s+(\w*[Cc]ar\w*|detail|seni\w*)\s*\([^)]*\)\s*\{/gi
  console.log('\n   === Car-related functions ===')
  while ((m2 = funcRe.exec(srHtml)) !== null) {
    console.log(`   ${m2[0]}...${srHtml.substring(m2.index + m2[0].length, m2.index + m2[0].length + 200).replace(/\s+/g, ' ')}`)
  }

  // Step 7: Second POST to searchresultlist — extract form from first result and re-submit
  console.log('\n\n7. Second POST to searchresultlist (executing the actual search)...')

  const srFields: Record<string, string> = {}
  const inputRe3 = /<input[^>]+name="([^"]+)"[^>]*value="([^"]*)"[^>]*/gi
  while ((m2 = inputRe3.exec(srHtml)) !== null) {
    srFields[m2[1]] = m2[2]
  }

  // Try different action values
  for (const testAction of ['search', '', 'init', 'seniSearch']) {
    console.log(`\n   --- Testing action="${testAction}" ---`)
    const fields = { ...srFields }
    fields['action'] = testAction
    fields['page'] = '1'

    const { text: html2, status: s2 } = await ninjaFetch(
      `${BASE}/ninja/searchresultlist.action`,
      { form: fields, referer: `${BASE}/ninja/searchresultlist.action` }
    )

    console.log(`   Status: ${s2} HTML length: ${html2.length}`)
    console.log(`   Has cardetail: ${html2.includes('cardetail')}`)
    console.log(`   Has KaijoCode in link: ${/KaijoCode=[A-Z]{2}/i.test(html2)}`)

    // Count links
    const cdLinks = html2.match(/cardetail/gi)
    console.log(`   cardetail occurrences: ${cdLinks?.length ?? 0}`)

    const onclicks = html2.match(/onclick/gi)
    console.log(`   onclick occurrences: ${onclicks?.length ?? 0}`)

    // Check for actual listing data
    const seniToCD = html2.match(/seniToCardetail/gi)
    console.log(`   seniToCardetail: ${seniToCD?.length ?? 0}`)

    // Look for table rows with car data
    const trMatches = html2.match(/<tr[^>]*>/gi)
    console.log(`   <tr> tags: ${trMatches?.length ?? 0}`)

    // Look for img with car photos
    const imgMatches = html2.match(/src="[^"]*photo[^"]*"/gi) || html2.match(/src="[^"]*image[^"]*\.jpg"/gi)
    console.log(`   photo img tags: ${imgMatches?.length ?? 0}`)

    // Check if it's the same form page or something different
    console.log(`   Has delCarCat: ${html2.includes('delCarCat')}`)
    console.log(`   Has HIACE: ${html2.includes('HIACE') || html2.includes('ハイエース')}`)

    if (html2.length !== srHtml.length || html2.includes('cardetail')) {
      console.log(`   >>> Different response! HTML length diff: ${html2.length - srHtml.length}`)

      // If we found car detail links, dump some
      if (html2.includes('cardetail')) {
        const detailRe = /cardetail[^"']{0,200}/gi
        const details: string[] = []
        let dm
        while ((dm = detailRe.exec(html2)) !== null && details.length < 5) {
          details.push(dm[0])
        }
        console.log(`   Detail links: ${JSON.stringify(details)}`)
      }

      // If we found seniToCardetail, dump some
      const seniRe = /seniToCardetail\([^)]+\)/gi
      const senis: string[] = []
      let sm
      while ((sm = seniRe.exec(html2)) !== null && senis.length < 5) {
        senis.push(sm[0])
      }
      if (senis.length > 0) {
        console.log(`   seniToCardetail calls: ${JSON.stringify(senis)}`)
      }

      // Dump first part of body content
      const bodyIdx = html2.indexOf('<body')
      if (bodyIdx > 0) {
        console.log(`\n   Body content (first 500 chars): ${html2.substring(bodyIdx, bodyIdx + 500).replace(/\s+/g, ' ')}`)
      }
    }
  }

  // Step 8: Try AJAX approach — maybe results load via AJAX
  console.log('\n\n8. Trying AJAX search...')
  for (const ajaxAction of ['searchresultlist.action', 'searchresult.action', 'search.action']) {
    const { text: ajaxHtml, status: ajaxS } = await ninjaFetch(
      `${BASE}/ninja/${ajaxAction}`,
      {
        form: { ...srFields, action: 'search', page: '1' },
        headers: { 'X-Requested-With': 'XMLHttpRequest' },
        referer: `${BASE}/ninja/searchresultlist.action`,
      }
    )
    console.log(`   ${ajaxAction}: status=${ajaxS} len=${ajaxHtml.length} cardetail=${ajaxHtml.includes('cardetail')}`)
  }
}

main().catch(console.error)
