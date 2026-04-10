/**
 * Find the AJAX endpoint NINJA uses to load search results
 * The search page loads results dynamically via JS — we need to find that endpoint
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

async function ninjaFetch(url: string, form?: Record<string, string>, headers?: Record<string, string>): Promise<string> {
  const h: Record<string, string> = { 'User-Agent': UA, Cookie: _sessionCookie, ...headers }
  const init: RequestInit = { headers: h, redirect: 'manual' }
  if (form) {
    init.method = 'POST'
    h['Content-Type'] = 'application/x-www-form-urlencoded'
    init.body = new URLSearchParams(form).toString()
  }
  let res = await fetch(url, init)
  absorbCookies(res)
  let redirects = 0
  while (res.status >= 300 && res.status < 400 && redirects < 5) {
    const loc = res.headers.get('location')
    if (!loc) break
    await res.text()
    const ru = loc.startsWith('http') ? loc : `${BASE}${loc}`
    res = await fetch(ru, { headers: { 'User-Agent': UA, Cookie: _sessionCookie }, redirect: 'manual' })
    absorbCookies(res)
    redirects++
  }
  return res.text()
}

function extractFormFields(html: string): Record<string, string> {
  const fields: Record<string, string> = {}
  const re = /<input[^>]+name="([^"]+)"[^>]*value="([^"]*)"[^>]*/gi
  let m
  while ((m = re.exec(html)) !== null) fields[m[1]] = m[2]
  return fields
}

async function main() {
  const loginId = process.env.NINJA_LOGIN_ID!
  const password = process.env.NINJA_PASSWORD!

  // Login flow (abbreviated)
  console.log('Logging in...')
  const s1 = await fetch(`${BASE}/ninja/`, { headers: { 'User-Agent': UA }, redirect: 'manual' })
  absorbCookies(s1)
  await s1.text()
  const loc = s1.headers.get('location')
  if (loc) {
    const r2 = await fetch(loc.startsWith('http') ? loc : `${BASE}${loc}`, {
      headers: { 'User-Agent': UA, Cookie: _sessionCookie }, redirect: 'manual'
    })
    absorbCookies(r2)
    await r2.text()
  }

  const loginText = await ninjaFetch(`${BASE}/ninja/login.action`,
    { action: 'login', loginId, password, isFlg: '', language: '1' },
    { 'X-Requested-With': 'XMLHttpRequest' })
  const lj = JSON.parse(loginText)
  console.log(`Login: errflg=${lj.errflg}`)

  await ninjaFetch(`${BASE}/ninja/login.action`, {
    action: 'loginPrimary', loginPrimaryGamen: '1', site: '2',
    memberCode: lj.memberCode ?? '', branchCode: lj.branchCode ?? '',
    memberName: lj.memberName ?? '', buyerId: lj.buyerId ?? '',
    buyerName: lj.buyerName ?? '', buyerImagePath: lj.buyerImagePath ?? '',
    buyerKaijoNameOpenFlg: lj.buyerKaijoNameOpenFlg ?? '',
    language: '1', errflg: '', ID: '', gamenGroup: '', token: '',
  })

  const scHtml = await ninjaFetch(`${BASE}/ninja/searchcondition.action`, {
    action: '', loginPrimaryGamen: '1', site: '2',
    memberCode: lj.memberCode ?? '', branchCode: lj.branchCode ?? '',
    memberName: lj.memberName ?? '', buyerId: lj.buyerId ?? '',
    buyerName: lj.buyerName ?? '', buyerImagePath: lj.buyerImagePath ?? '',
    buyerKaijoNameOpenFlg: lj.buyerKaijoNameOpenFlg ?? '',
    language: '1', errflg: '', ID: '', gamenGroup: '22', token: '',
  })
  console.log(`searchcondition: ${scHtml.length} chars`)

  const scFields = extractFormFields(scHtml)
  scFields['brandGroupingCode'] = '01'
  scFields['bodyType'] = ''
  scFields['cornerSearchCheckCorner'] = ''
  scFields['action'] = 'init'

  const msHtml = await ninjaFetch(`${BASE}/ninja/makersearch.action`, scFields)
  console.log(`makersearch: ${msHtml.length} chars`)

  const msFields = extractFormFields(msHtml)
  msFields['carCategoryNo'] = '146'
  msFields['action'] = 'seniSearch'
  msFields['page'] = '1'
  delete msFields['evaluation']

  const srHtml = await ninjaFetch(`${BASE}/ninja/searchresultlist.action`, msFields)
  console.log(`searchresultlist: ${srHtml.length} chars`)

  // Save full HTML for analysis
  writeFileSync('/tmp/ninja-search-results.html', srHtml)
  console.log('Saved to /tmp/ninja-search-results.html')

  // Extract ALL JavaScript from the page
  const scriptRe = /<script[^>]*>([\s\S]*?)<\/script>/gi
  let m
  let scriptIdx = 0
  while ((m = scriptRe.exec(srHtml)) !== null) {
    const content = m[1].trim()
    if (content.length > 50) {
      console.log(`\n=== Script ${scriptIdx} (${content.length} chars) ===`)
      // Look for AJAX URLs, fetch calls, $.ajax, $.get, $.post
      const ajaxPatterns = content.match(/(\$\.ajax|\$\.get|\$\.post|fetch\s*\(|\.action|\.jsp|XMLHttpRequest|url\s*:\s*['"][^'"]+['"])/gi)
      if (ajaxPatterns) {
        console.log(`AJAX patterns found: ${ajaxPatterns.join(' | ')}`)
      }

      // Look for function definitions related to search/results
      const funcDefs = content.match(/function\s+\w+/gi)
      if (funcDefs) {
        console.log(`Functions: ${funcDefs.join(', ')}`)
      }

      // If it contains seniSearch or cardetail-related code
      if (/seni|cardetail|result|search|list|load/i.test(content)) {
        // Show relevant sections
        const lines = content.split('\n')
        for (const line of lines) {
          if (/seni|cardetail|result|search|list|load|ajax|url\s*:/i.test(line)) {
            console.log(`  > ${line.trim().substring(0, 200)}`)
          }
        }
      }
    }
    scriptIdx++
  }

  // Extract all .action URLs referenced anywhere in the HTML
  console.log('\n\n=== All .action URLs in HTML ===')
  const actionUrls = new Set<string>()
  const actionRe = /[\w\/]+\.action/gi
  while ((m = actionRe.exec(srHtml)) !== null) {
    actionUrls.add(m[0])
  }
  console.log(Array.from(actionUrls).join('\n'))

  // Extract external JS files
  console.log('\n\n=== External JS files ===')
  const extJsRe = /src="([^"]*\.js[^"]*)"/gi
  while ((m = extJsRe.exec(srHtml)) !== null) {
    console.log(m[1])
  }

  // Fetch external JS files that might contain search logic
  const jsFiles = srHtml.match(/src="([^"]*(?:search|result|list|common|buyer)[^"]*\.js[^"]*)"/gi) ?? []
  for (const jsMatch of jsFiles) {
    const urlMatch = jsMatch.match(/src="([^"]+)"/)
    if (!urlMatch) continue
    let jsUrl = urlMatch[1]
    if (!jsUrl.startsWith('http')) jsUrl = `${BASE}${jsUrl}`

    console.log(`\n=== Fetching JS: ${jsUrl} ===`)
    try {
      const res = await fetch(jsUrl, { headers: { 'User-Agent': UA, Cookie: _sessionCookie } })
      const js = await res.text()
      console.log(`Length: ${js.length}`)

      // Find search/result related functions
      const searchFuncs = js.match(/function\s+\w*(?:search|result|list|seni|detail)\w*/gi)
      if (searchFuncs) {
        console.log(`Relevant functions: ${searchFuncs.join(', ')}`)
      }

      // Find AJAX calls
      const ajaxCalls = js.match(/\$\.(?:ajax|get|post)\s*\([^)]*\)/gi)
      if (ajaxCalls) {
        for (const call of ajaxCalls) {
          console.log(`AJAX: ${call.substring(0, 200)}`)
        }
      }

      // Find URL strings
      const urlStrings = js.match(/['"][^'"]*\.action[^'"]*['"]/gi)
      if (urlStrings) {
        for (const u of urlStrings) {
          console.log(`URL: ${u}`)
        }
      }

      // Find seniToCardetail function
      if (js.includes('seniToCardetail')) {
        const idx = js.indexOf('seniToCardetail')
        console.log(`seniToCardetail found at ${idx}: ${js.substring(idx, idx + 500)}`)
      }

      // Find any function that submits form to searchresultlist
      if (js.includes('searchresultlist')) {
        const indices: number[] = []
        let si = 0
        while ((si = js.indexOf('searchresultlist', si + 1)) !== -1) {
          indices.push(si)
        }
        for (const idx of indices) {
          console.log(`searchresultlist at ${idx}: ${js.substring(Math.max(0, idx - 100), idx + 200).replace(/\s+/g, ' ')}`)
        }
      }
    } catch (err) {
      console.log(`Error: ${err}`)
    }
  }

  // Also check the carListData more carefully
  console.log('\n\n=== carListData analysis ===')
  const carListMatch = srHtml.match(/name="carListData"[^>]*value="([^"]*)"/)
  if (carListMatch) {
    const data = carListMatch[1]
    console.log(`Raw: ${data.substring(0, 300)}`)
    // Parse the ж-delimited data
    const entries = data.split(',').filter(e => e.trim())
    console.log(`Entries: ${entries.length}`)
    for (const entry of entries.slice(0, 5)) {
      const parts = entry.split('ж')
      console.log(`  ${parts.join(' | ')}`)
    }
  } else {
    console.log('carListData not found in search results')
  }
}

main().catch(console.error)
