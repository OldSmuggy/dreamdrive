/**
 * Playwright NINJA: login, search, extract listing refs, fetch detail pages
 */
import { chromium } from 'playwright'
import { readFileSync, writeFileSync } from 'fs'
import { resolve } from 'path'
try {
  const envPath = resolve(process.cwd(), '.env.local')
  for (const line of readFileSync(envPath, 'utf-8').split('\n')) {
    const t = line.trim(); if (!t || t.startsWith('#')) continue
    const eq = t.indexOf('='); if (eq > 0) { const k = t.slice(0,eq).trim(); const v = t.slice(eq+1).trim(); if (!process.env[k]) process.env[k] = v }
  }
} catch {}

const BASE = 'https://www.ninja-cartrade.jp'

async function main() {
  const loginId = process.env.NINJA_LOGIN_ID!
  const password = process.env.NINJA_PASSWORD!
  console.log('=== NINJA Playwright Extract Test ===\n')

  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  })
  const page = await context.newPage()

  try {
    // Login flow
    console.log('1. Login...')
    await page.goto(`${BASE}/ninja/`, { waitUntil: 'networkidle' })
    await page.fill('#loginId', loginId)
    await page.fill('#password', password)
    await page.evaluate(({ loginId, password }) => {
      (document.getElementById('loginId') as HTMLInputElement).value = loginId;
      (document.getElementById('password') as HTMLInputElement).value = password;
      (window as any).login()
    }, { loginId, password })
    await page.waitForTimeout(3000)

    // Handle conflict
    const text = await page.textContent('body') || ''
    if (text.includes('already logged in') || text.includes('seniToSearchcondition')) {
      console.log('   Confirming session takeover...')
      await Promise.all([
        page.waitForNavigation({ waitUntil: 'load', timeout: 30000 }),
        page.click('a[onclick*="seniToSearchcondition"]'),
      ])
    }
    await page.waitForLoadState('networkidle').catch(() => {})
    console.log('   On:', page.url())

    // Go to makersearch → select HIACE VAN
    console.log('\n2. Toyota makersearch...')
    await page.evaluate(() => {
      (document.getElementById('brandGroupingCode') as HTMLInputElement).value = '01';
      (document.getElementById('action') as HTMLInputElement).value = 'init';
      (document.getElementById('form1') as HTMLFormElement).action = 'makersearch.action';
      (document.getElementById('form1') as HTMLFormElement).submit()
    })
    await page.waitForNavigation({ waitUntil: 'load', timeout: 15000 })
    await page.waitForLoadState('networkidle').catch(() => {})

    const bodyText = await page.textContent('body') || ''
    const hiaceCount = bodyText.match(/HIACE VAN\s*\((\d+)\)/i)?.[1] || '0'
    console.log(`   HIACE VAN: ${hiaceCount}`)

    // Click HIACE VAN
    console.log('\n3. Searching HIACE VAN...')
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'load', timeout: 15000 }),
      page.evaluate(() => (window as any).makerListChoiceCarCat('146')),
    ])
    await page.waitForLoadState('networkidle').catch(() => {})

    const srText = await page.textContent('body') || ''
    const resultsCount = srText.match(/Result[s\s　]*[：:]\s*(\d+)/i)?.[1] || '0'
    console.log(`   Results: ${resultsCount}`)

    // Save the full HTML for analysis
    const srHtml = await page.content()
    writeFileSync('/tmp/ninja-pw-searchresults.html', srHtml)
    console.log(`   HTML saved (${srHtml.length} chars)`)

    // Analyze how listings are structured in the HTML
    console.log('\n4. Analyzing listing structure...')

    // Check for onclick handlers
    const onclickHandlers = await page.evaluate(() => {
      const handlers: string[] = []
      document.querySelectorAll('[onclick]').forEach(el => {
        const oc = el.getAttribute('onclick') || ''
        if (oc.includes('cardetail') || oc.includes('CarDetail') || oc.includes('detail') || oc.includes('seni(')) {
          handlers.push(oc.substring(0, 120))
        }
      })
      return handlers
    })
    console.log(`   Detail onclick handlers: ${onclickHandlers.length}`)
    for (const h of onclickHandlers.slice(0, 5)) console.log(`     ${h}`)

    // Check for links with cardetail
    const detailLinks = await page.evaluate(() => {
      const links: string[] = []
      document.querySelectorAll('a').forEach(a => {
        const href = a.getAttribute('href') || ''
        const onclick = a.getAttribute('onclick') || ''
        if (href.includes('cardetail') || onclick.includes('cardetail') || onclick.includes('Detail')) {
          links.push(`href="${href}" onclick="${onclick.substring(0, 100)}"`)
        }
      })
      return links
    })
    console.log(`   Detail links: ${detailLinks.length}`)
    for (const l of detailLinks.slice(0, 5)) console.log(`     ${l}`)

    // Check for table rows with listing data
    const tableInfo = await page.evaluate(() => {
      const tables = document.querySelectorAll('table')
      const info: string[] = []
      tables.forEach((t, i) => {
        const rows = t.querySelectorAll('tr')
        if (rows.length > 2) {
          info.push(`Table ${i}: ${rows.length} rows, class="${t.className}"`)
          // Check first data row
          const firstRow = rows[1]
          if (firstRow) {
            const onclick = firstRow.getAttribute('onclick') || 'none'
            const cells = firstRow.querySelectorAll('td')
            info.push(`  First row: ${cells.length} cells, onclick="${onclick.substring(0, 100)}"`)
          }
        }
      })
      return info
    })
    console.log(`   Tables:`)
    for (const t of tableInfo) console.log(`     ${t}`)

    // Look for any hidden fields with listing data
    const hiddenData = await page.evaluate(() => {
      const carListData = (document.getElementById('carListData') as HTMLInputElement)?.value || ''
      const listType = (document.getElementById('listType') as HTMLInputElement)?.value || ''
      return { carListData: carListData.substring(0, 300), carListDataLen: carListData.length, listType }
    })
    console.log(`   carListData: ${hiddenData.carListDataLen} chars`)
    if (hiddenData.carListData) console.log(`     ${hiddenData.carListData}`)
    console.log(`   listType: ${hiddenData.listType}`)

    // Check how the page renders listing rows — look for the pattern
    const rowPattern = await page.evaluate(() => {
      // Find any element that contains "HIACE VAN" text
      const allElements = document.querySelectorAll('*')
      for (const el of Array.from(allElements)) {
        if (el.textContent?.includes('HIACE VAN 4D') && el.tagName !== 'BODY' && el.tagName !== 'HTML') {
          const parent = el.closest('tr, div.row, li, .carItem, .result-item')
          if (parent) {
            return {
              tag: parent.tagName,
              class: parent.className,
              id: parent.id,
              onclick: parent.getAttribute('onclick')?.substring(0, 150) || '',
              innerHTML: parent.innerHTML.substring(0, 500),
            }
          }
        }
      }
      return null
    })
    if (rowPattern) {
      console.log(`\n   Listing row pattern:`)
      console.log(`     Tag: ${rowPattern.tag} Class: "${rowPattern.class}" ID: "${rowPattern.id}"`)
      console.log(`     Onclick: ${rowPattern.onclick}`)
      console.log(`     HTML: ${rowPattern.innerHTML.replace(/\s+/g, ' ').substring(0, 300)}`)
    }

    // Try to extract all listing data from the page
    console.log('\n5. Extracting all listings...')
    const listings = await page.evaluate(() => {
      const results: Array<{
        site: string; date: string; bidNo: string; maker: string; model: string;
        grade: string; chassis: string; year: string; trans: string; disp: string;
        mileage: string; score: string; price: string; onclick: string
      }> = []

      // Try table rows first
      const rows = document.querySelectorAll('table tr')
      for (const row of Array.from(rows)) {
        const cells = row.querySelectorAll('td')
        if (cells.length >= 5) {
          const text = row.textContent || ''
          if (text.includes('TOYOTA') || text.includes('HIACE')) {
            results.push({
              site: cells[1]?.textContent?.trim().split('\n')[0]?.trim() || '',
              date: cells[1]?.textContent?.trim().split('\n')[1]?.trim() || '',
              bidNo: cells[1]?.textContent?.trim().split('\n').pop()?.trim() || '',
              maker: 'TOYOTA',
              model: cells[2]?.textContent?.trim().split('\n')[1]?.trim() || '',
              grade: cells[2]?.textContent?.trim().split('\n')[2]?.trim() || '',
              chassis: cells[2]?.textContent?.trim().split('\n')[3]?.trim() || '',
              year: cells[3]?.textContent?.trim() || '',
              trans: cells[4]?.textContent?.trim().split('\n')[0]?.trim() || '',
              disp: cells[4]?.textContent?.trim().split('\n')[1]?.trim() || '',
              mileage: cells[5]?.textContent?.trim() || '',
              score: cells[6]?.textContent?.trim() || '',
              price: cells[7]?.textContent?.trim() || '',
              onclick: row.getAttribute('onclick')?.substring(0, 150) || cells[0]?.querySelector('[onclick]')?.getAttribute('onclick')?.substring(0, 150) || '',
            })
          }
        }
      }
      return results
    })
    console.log(`   Extracted ${listings.length} listings from table`)
    for (const l of listings.slice(0, 10)) {
      console.log(`     ${l.site} ${l.date} ${l.model} ${l.grade} ${l.year} ${l.mileage} ${l.score} ${l.price}`)
      if (l.onclick) console.log(`       onclick: ${l.onclick}`)
    }

  } finally {
    await browser.close()
  }
}

main().catch(console.error)
