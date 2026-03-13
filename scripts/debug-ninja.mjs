// Debug script: login to NINJA, run search, dump the first 4KB of search results HTML
// Run with: node scripts/debug-ninja.mjs

import { chromium } from 'playwright'

const BASE = 'https://www.ninja-cartrade.jp'
const loginId = process.env.NINJA_LOGIN_ID || 'Y3502K01'
const password = process.env.NINJA_PASSWORD || '18479042'

async function main() {
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] })

  try {
    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      locale: 'ja-JP',
    })

    const page = await context.newPage()
    console.log('Loading login page...')
    await page.goto(`${BASE}/ninja/`, { waitUntil: 'domcontentloaded', timeout: 30000 })

    // Dump the login page HTML to understand form structure
    const loginHtml = await page.content()
    const fs2 = await import('fs')
    fs2.writeFileSync('/tmp/ninja-login-page.html', loginHtml)
    console.log('Login page HTML saved to /tmp/ninja-login-page.html')
    console.log('Login page HTML length:', loginHtml.length)
    // Show just the form area
    const formMatch2 = loginHtml.match(/<form[\s\S]{0,3000}/i)
    console.log('Form HTML:', formMatch2?.[0]?.substring(0, 1500))

    await page.locator('[name="loginId"]').fill(loginId)
    await page.locator('[name="password"]').fill(password)

    // The login button is <a href="#" onclick="login()"> — not a submit button
    console.log('Clicking Login link...')
    await page.locator('a[onclick*="login"], a[onclick*="Login"]').first().click()
    await page.waitForLoadState('networkidle', { timeout: 30000 })

    const postLoginUrl = page.url()
    console.log('Post-login URL:', postLoginUrl)

    const allCookies = await context.cookies()
    let cookieHeader = allCookies.map(c => `${c.name}=${c.value}`).join('; ')
    console.log('Cookies after login:', allCookies.length, 'entries, total length:', cookieHeader.length)

    await page.close()
    await context.close()

    // First: dump the post-login page (searchcondition.action) to understand structure
    const postLoginPageRes = await fetch(`https://www.ninja-cartrade.jp/ninja/searchcondition.action`, {
      headers: { Cookie: cookieHeader, 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)' },
    })
    const postLoginPageHtml = await postLoginPageRes.text()
    const fs3 = await import('fs')
    fs3.writeFileSync('/tmp/ninja-searchcondition.html', postLoginPageHtml)
    console.log('\nPost-login page status:', postLoginPageRes.status, 'length:', postLoginPageHtml.length)
    // Show all action URLs in the page
    const actionUrls = [...postLoginPageHtml.matchAll(/(?:href|action)="([^"]*\.action[^"]*)"/gi)].map(m => m[1])
    console.log('Action URLs found on post-login page:', [...new Set(actionUrls)])

    // Step 1: makersearch
    console.log('\nPOSTing to makersearch.action...')
    const msRes = await fetch(`${BASE}/ninja/makersearch.action`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Cookie: cookieHeader,
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
        Referer: `${BASE}/ninja/`,
      },
      body: new URLSearchParams({
        conditionCarCategoryNo: '146,198',
        conditionBrandGroupingCode: '01',
      }).toString(),
    })
    const msHtml = await msRes.text()
    console.log('makersearch status:', msRes.status)
    console.log('makersearch HTML length:', msHtml.length)
    console.log('makersearch HTML (first 2KB):\n', msHtml.substring(0, 2000))
    console.log('---')

    // Also try with multi-value params
    console.log('\nTrying multi-value conditionCarCategoryNo...')
    const msBody2 = new URLSearchParams()
    msBody2.append('conditionCarCategoryNo', '146')
    msBody2.append('conditionCarCategoryNo', '198')
    msBody2.append('conditionBrandGroupingCode', '01')
    const ms2Res = await fetch(`${BASE}/ninja/makersearch.action`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Cookie: cookieHeader,
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
        Referer: `${BASE}/ninja/`,
      },
      body: msBody2.toString(),
    })
    const ms2Html = await ms2Res.text()
    console.log('makersearch2 status:', ms2Res.status, 'length:', ms2Html.length)
    console.log('makersearch2 HTML (first 1KB):\n', ms2Html.substring(0, 1000))
    console.log('---')

    // Step 2: search result list
    console.log('\nPOSTing to searchresultlist.action...')
    const srBody = new URLSearchParams({
      conditionCarCategoryNo: '146,198',
      conditionBrandGroupingCode: '01',
      sortCOL: 'YEAR',
      sortORD: 'DESC',
      hyojiSu: '100',
      listType: '0',
      conditionDriveType_hid: '99',
      conditionSift_hid: '99',
      page: '1',
    })
    const srRes = await fetch(`${BASE}/ninja/searchresultlist.action`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Cookie: cookieHeader,
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
        Referer: `${BASE}/ninja/makersearch.action`,
      },
      body: srBody.toString(),
    })
    const srHtml = await srRes.text()
    console.log('searchresultlist status:', srRes.status)
    console.log('searchresultlist HTML length:', srHtml.length)
    console.log('searchresultlist HTML (first 4KB):\n', srHtml.substring(0, 4000))
    console.log('---')
    console.log('searchresultlist HTML (last 1KB):\n', srHtml.substring(srHtml.length - 1000))

    // Check for cardetail links
    const detailMatches = srHtml.match(/cardetail/gi)
    console.log('\ncardetail occurrences in results:', detailMatches?.length ?? 0)

    const kaijoMatches = srHtml.match(/KaijoCode/gi)
    console.log('KaijoCode occurrences:', kaijoMatches?.length ?? 0)

    // Save full HTML to file for inspection
    const fs = await import('fs')
    fs.writeFileSync('/tmp/ninja-search-results.html', srHtml)
    console.log('\nFull search results HTML saved to /tmp/ninja-search-results.html')

  } finally {
    await browser.close()
  }
}

main().catch(console.error)
