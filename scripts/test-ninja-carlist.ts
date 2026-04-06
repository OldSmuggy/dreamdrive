/**
 * Test NINJA scraper — try carlist.action and different action values
 *
 * Key insight from JS analysis:
 * - searchresultlist.js: manages filters, conditionSearch() posts action=search
 * - carlist.js: shows results, seni() posts to carlist.action with action=init_list
 * - The search results may be at carlist.action, not searchresultlist.action
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
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
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

async function postForm(
  url: string,
  form: Record<string, string>,
  referer?: string,
  extraHeaders?: Record<string, string>
): Promise<{ text: string; status: number; redirectedTo?: string }> {
  const headers: Record<string, string> = {
    'User-Agent': UA,
    Cookie: cookieStr(),
    'Content-Type': 'application/x-www-form-urlencoded',
    Referer: referer || `${BASE}/ninja/login.action`,
    ...extraHeaders,
  }
  let res = await fetch(url, {
    method: 'POST', headers, redirect: 'manual',
    body: new URLSearchParams(form).toString()
  })
  absorbCookies(res)
  let redirectedTo: string | undefined
  let r = 0
  while (res.status >= 300 && res.status < 400 && r < 5) {
    const loc = res.headers.get('location')
    if (!loc) break
    await res.text()
    redirectedTo = loc.startsWith('http') ? loc : `${BASE}${loc}`
    res = await fetch(redirectedTo, { headers: { 'User-Agent': UA, Cookie: cookieStr(), Referer: url }, redirect: 'manual' })
    absorbCookies(res)
    r++
  }
  return { text: await res.text(), status: res.status, redirectedTo }
}

function extractFormFields(html: string): Record<string, string> {
  const fields: Record<string, string> = {}
  const re = /<input[^>]+name="([^"]+)"[^>]*value="([^"]*)"[^>]*/gi
  let m
  while ((m = re.exec(html)) !== null) fields[m[1]] = m[2]
  return fields
}

function analyzeHtml(label: string, html: string) {
  const trCount = (html.match(/<tr/gi) || []).length
  const imgCount = (html.match(/<img/gi) || []).length
  const hasCardetail = html.includes('cardetail')
  const hasTimeout = html.includes('sessionTimeOut')
  const hasTable = html.includes('<table')
  const hasDelCarCat = html.includes('delCarCat')
  const jsFiles = (html.match(/src="([^"]*\.js[^"]*)"/gi) || [])
  const hasCarlistJs = jsFiles.some(f => f.includes('carlist.js'))
  const hasSearchresultJs = jsFiles.some(f => f.includes('searchresultlist.js'))
  const hasHiace = html.includes('HIACE') || html.includes('ハイエース')
  const onclicks = (html.match(/onclick="[^"]*\([^)]+\)[^"]*"/gi) || [])
  const panCarDetail = (html.match(/panCarDetail/gi) || []).length
  const seniCarDetail = (html.match(/seniCarDetail/gi) || []).length

  console.log(`  ${label}: ${html.length} chars | ${trCount} <tr> | ${imgCount} <img> | cardetail:${hasCardetail} | timeout:${hasTimeout}`)
  console.log(`    table:${hasTable} | delCarCat:${hasDelCarCat} | hiace:${hasHiace} | panCarDetail:${panCarDetail} | seniCarDetail:${seniCarDetail}`)
  console.log(`    carlist.js:${hasCarlistJs} | searchresultlist.js:${hasSearchresultJs} | onclicks:${onclicks.length}`)

  if (panCarDetail > 0 || seniCarDetail > 0) {
    // Extract first few onclick handlers that reference cardetail
    const detailOnclicks = html.match(/onclick="[^"]*(?:panCarDetail|seniCarDetail)\([^)]+\)[^"]*"/gi) || []
    for (const oc of detailOnclicks.slice(0, 3)) {
      console.log(`    onclick: ${oc.substring(0, 120)}`)
    }
  }

  // Check for carListData
  const cldMatch = html.match(/carListData[^"]*value="([^"]+)"/)
  if (cldMatch) {
    const entries = cldMatch[1].split(',').filter((e: string) => e.trim())
    console.log(`    carListData: ${entries.length} entries`)
    for (const e of entries.slice(0, 3)) {
      console.log(`      ${e.substring(0, 80)}`)
    }
  }
}

async function doLogin() {
  const loginId = process.env.NINJA_LOGIN_ID!
  const password = process.env.NINJA_PASSWORD!
  _cookies = {}

  // Session
  let res = await fetch(`${BASE}/ninja/`, { headers: { 'User-Agent': UA }, redirect: 'manual' })
  absorbCookies(res); await res.text()
  const loc = res.headers.get('location')
  if (loc) {
    const ru = loc.startsWith('http') ? loc : `${BASE}${loc}`
    res = await fetch(ru, { headers: { 'User-Agent': UA, Cookie: cookieStr() }, redirect: 'manual' })
    absorbCookies(res); await res.text()
  }
  console.log(`Session: JSESSIONID=${_cookies['JSESSIONID']?.substring(0, 15)}`)

  // Login
  const { text: lt } = await postForm(`${BASE}/ninja/login.action`,
    { action: 'login', loginId, password, isFlg: '', language: '1' },
    `${BASE}/ninja/`, { 'X-Requested-With': 'XMLHttpRequest' })
  const lj = JSON.parse(lt)
  console.log(`Login: errflg=${lj.errflg} buyerId=${lj.buyerId}`)

  // loginPrimary
  const { text: primaryHtml } = await postForm(`${BASE}/ninja/login.action`, {
    action: 'loginPrimary', loginPrimaryGamen: '1', site: '2',
    memberCode: lj.memberCode ?? '', branchCode: lj.branchCode ?? '',
    memberName: lj.memberName ?? '', buyerId: lj.buyerId ?? '',
    buyerName: lj.buyerName ?? '', buyerImagePath: lj.buyerImagePath ?? '',
    buyerKaijoNameOpenFlg: lj.buyerKaijoNameOpenFlg ?? '',
    language: '1', errflg: '', ID: '', gamenGroup: '', token: '',
  })
  const form1 = extractFormFields(primaryHtml)
  console.log(`loginPrimary: ${primaryHtml.length} chars, ${Object.keys(form1).length} form fields`)

  // searchcondition
  form1['gamenGroup'] = '22'
  form1['action'] = ''
  const { text: scHtml } = await postForm(`${BASE}/ninja/searchcondition.action`, form1, `${BASE}/ninja/login.action`)
  const scForm = extractFormFields(scHtml)
  console.log(`searchcondition: ${scHtml.length} chars, ${Object.keys(scForm).length} form fields`)

  // makersearch (select Toyota)
  scForm['brandGroupingCode'] = '01'
  scForm['bodyType'] = ''
  scForm['cornerSearchCheckCorner'] = ''
  scForm['action'] = 'init'
  const { text: msHtml } = await postForm(`${BASE}/ninja/makersearch.action`, scForm, `${BASE}/ninja/searchcondition.action`)
  const msForm = extractFormFields(msHtml)
  console.log(`makersearch: ${msHtml.length} chars, ${Object.keys(msForm).length} form fields`)

  return { lj, form1, scForm, msForm, msHtml }
}

async function main() {
  console.log('=== NINJA Carlist Test ===\n')

  const { msForm, msHtml } = await doLogin()

  // Prepare base form with HIACE VAN (146) selected
  const baseForm = { ...msForm }
  baseForm['carCategoryNo'] = '146'
  baseForm['page'] = '1'

  console.log('\n--- Test 1: searchresultlist.action with action=seniSearch (current approach) ---')
  const test1Form = { ...baseForm, action: 'seniSearch' }
  const { text: t1, status: s1, redirectedTo: r1 } = await postForm(
    `${BASE}/ninja/searchresultlist.action`, test1Form, `${BASE}/ninja/makersearch.action`)
  console.log(`  Status: ${s1} Redirected: ${r1 ?? 'none'}`)
  analyzeHtml('seniSearch→searchresultlist', t1)
  if (t1.length > 0) writeFileSync('/tmp/ninja-test1.html', t1)

  console.log('\n--- Test 2: searchresultlist.action with action=search (conditionSearch) ---')
  const test2Form = { ...baseForm, action: 'search' }
  const { text: t2, status: s2, redirectedTo: r2 } = await postForm(
    `${BASE}/ninja/searchresultlist.action`, test2Form, `${BASE}/ninja/searchresultlist.action`)
  console.log(`  Status: ${s2} Redirected: ${r2 ?? 'none'}`)
  analyzeHtml('search→searchresultlist', t2)
  if (t2.length > 0) writeFileSync('/tmp/ninja-test2.html', t2)

  console.log('\n--- Test 3: carlist.action with action=init (from carlist.js) ---')
  const test3Form = { ...baseForm, action: 'init' }
  const { text: t3, status: s3, redirectedTo: r3 } = await postForm(
    `${BASE}/ninja/carlist.action`, test3Form, `${BASE}/ninja/searchresultlist.action`)
  console.log(`  Status: ${s3} Redirected: ${r3 ?? 'none'}`)
  analyzeHtml('init→carlist', t3)
  if (t3.length > 0) writeFileSync('/tmp/ninja-test3.html', t3)

  console.log('\n--- Test 4: carlist.action with action=init_list ---')
  const test4Form = { ...baseForm, action: 'init_list' }
  const { text: t4, status: s4, redirectedTo: r4 } = await postForm(
    `${BASE}/ninja/carlist.action`, test4Form, `${BASE}/ninja/searchresultlist.action`)
  console.log(`  Status: ${s4} Redirected: ${r4 ?? 'none'}`)
  analyzeHtml('init_list→carlist', t4)
  if (t4.length > 0) writeFileSync('/tmp/ninja-test4.html', t4)

  console.log('\n--- Test 5: carlist.action with action=search ---')
  const test5Form = { ...baseForm, action: 'search' }
  const { text: t5, status: s5, redirectedTo: r5 } = await postForm(
    `${BASE}/ninja/carlist.action`, test5Form, `${BASE}/ninja/searchresultlist.action`)
  console.log(`  Status: ${s5} Redirected: ${r5 ?? 'none'}`)
  analyzeHtml('search→carlist', t5)
  if (t5.length > 0) writeFileSync('/tmp/ninja-test5.html', t5)

  console.log('\n--- Test 6: searchresultlist.action with action=init ---')
  const test6Form = { ...baseForm, action: 'init' }
  const { text: t6, status: s6, redirectedTo: r6 } = await postForm(
    `${BASE}/ninja/searchresultlist.action`, test6Form, `${BASE}/ninja/makersearch.action`)
  console.log(`  Status: ${s6} Redirected: ${r6 ?? 'none'}`)
  analyzeHtml('init→searchresultlist', t6)
  if (t6.length > 0) writeFileSync('/tmp/ninja-test6.html', t6)

  console.log('\n--- Test 7: commoncarlist.action with action=init ---')
  const test7Form = { ...baseForm, action: 'init' }
  const { text: t7, status: s7, redirectedTo: r7 } = await postForm(
    `${BASE}/ninja/commoncarlist.action`, test7Form, `${BASE}/ninja/searchresultlist.action`)
  console.log(`  Status: ${s7} Redirected: ${r7 ?? 'none'}`)
  analyzeHtml('init→commoncarlist', t7)
  if (t7.length > 0) writeFileSync('/tmp/ninja-test7.html', t7)

  // Test 8: Try the AJAX approach from searchresultlist.js
  // clickMakerHenko_Result() posts action=makerHenko to get brand data as JSON
  console.log('\n--- Test 8: AJAX makerHenko (JSON response?) ---')
  const test8Form = { ...baseForm, action: 'makerHenko' }
  const { text: t8, status: s8 } = await postForm(
    `${BASE}/ninja/searchresultlist.action`, test8Form,
    `${BASE}/ninja/searchresultlist.action`,
    { 'X-Requested-With': 'XMLHttpRequest' })
  console.log(`  Status: ${s8} Body: ${t8.length} chars`)
  if (t8.length < 500) {
    console.log(`  Body: ${t8.substring(0, 300)}`)
  } else {
    // Try to parse as JSON
    try {
      const j = JSON.parse(t8)
      console.log(`  JSON keys: ${Object.keys(j).join(', ')}`)
      if (j.makerSearchCarCategoryList) {
        console.log(`  Car categories: ${j.makerSearchCarCategoryList.length}`)
        for (const cat of j.makerSearchCarCategoryList.slice(0, 5)) {
          console.log(`    ${JSON.stringify(cat).substring(0, 100)}`)
        }
      }
    } catch {
      console.log(`  Not JSON. Snippet: ${t8.substring(0, 200).replace(/\s+/g, ' ')}`)
    }
  }

  // Test 9: From searchresultlist page, select car category like the UI does
  // The choiceCarCat function in searchresultlist.js just submits form1 to searchresultlist.action
  // But the key might be that it's on the searchresultlist PAGE already
  // Let's extract form from test1 (searchresultlist page) and re-submit with different action
  if (t1.length > 1000 && !t1.includes('sessionTimeOut')) {
    console.log('\n--- Test 9: From searchresultlist page, action=conditionSearch ---')
    const srForm = extractFormFields(t1)
    srForm['carCategoryNo'] = '146'
    srForm['brandGroupingCode'] = '01'
    srForm['action'] = 'conditionSearch'
    srForm['page'] = '1'
    const { text: t9, status: s9 } = await postForm(
      `${BASE}/ninja/searchresultlist.action`, srForm, `${BASE}/ninja/searchresultlist.action`)
    console.log(`  Status: ${s9}`)
    analyzeHtml('conditionSearch from SR page', t9)
    if (t9.length > 0) writeFileSync('/tmp/ninja-test9.html', t9)

    // Test 10: From searchresultlist, submit to carlist.action
    console.log('\n--- Test 10: From searchresultlist page → carlist.action init ---')
    const srForm2 = extractFormFields(t1)
    srForm2['carCategoryNo'] = '146'
    srForm2['brandGroupingCode'] = '01'
    srForm2['action'] = 'init'
    srForm2['page'] = '1'
    const { text: t10, status: s10 } = await postForm(
      `${BASE}/ninja/carlist.action`, srForm2, `${BASE}/ninja/searchresultlist.action`)
    console.log(`  Status: ${s10}`)
    analyzeHtml('init carlist from SR page', t10)
    if (t10.length > 0) writeFileSync('/tmp/ninja-test10.html', t10)

    // Test 11: From searchresultlist, submit to carlist.action with init_serchresultlist
    console.log('\n--- Test 11: carlist.action with action=init_serchresultlist ---')
    const srForm3 = extractFormFields(t1)
    srForm3['carCategoryNo'] = '146'
    srForm3['brandGroupingCode'] = '01'
    srForm3['action'] = 'init_serchresultlist'
    srForm3['page'] = '1'
    const { text: t11, status: s11 } = await postForm(
      `${BASE}/ninja/carlist.action`, srForm3, `${BASE}/ninja/searchresultlist.action`)
    console.log(`  Status: ${s11}`)
    analyzeHtml('init_serchresultlist→carlist', t11)
    if (t11.length > 0) writeFileSync('/tmp/ninja-test11.html', t11)
  }

  // Summary
  console.log('\n\n=== SUMMARY ===')
  const tests = [
    { name: 'seniSearch→searchresultlist', html: t1, status: s1 },
    { name: 'search→searchresultlist', html: t2, status: s2 },
    { name: 'init→carlist', html: t3, status: s3 },
    { name: 'init_list→carlist', html: t4, status: s4 },
    { name: 'search→carlist', html: t5, status: s5 },
    { name: 'init→searchresultlist', html: t6, status: s6 },
    { name: 'init→commoncarlist', html: t7, status: s7 },
  ]
  for (const t of tests) {
    const trCount = (t.html.match(/<tr/gi) || []).length
    const hasCardetail = t.html.includes('cardetail')
    const hasTimeout = t.html.includes('sessionTimeOut')
    const panCarDetail = (t.html.match(/panCarDetail/gi) || []).length
    const seniCarDetail = (t.html.match(/seniCarDetail/gi) || []).length
    console.log(`  ${t.name}: ${t.status} ${t.html.length}b ${trCount}tr cardetail:${hasCardetail} panCarDetail:${panCarDetail} seniCarDetail:${seniCarDetail} timeout:${hasTimeout}`)
  }
}

main().catch(console.error)
