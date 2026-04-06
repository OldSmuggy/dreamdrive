/**
 * NINJA scraper using Playwright — real browser, real JavaScript, real results.
 *
 * Handles all anti-scraping measures:
 * - Single-session enforcement (only one login at a time)
 * - Timestamp-based tokens (extracted fresh from each page)
 * - Server-side Struts state (proper navigation flow)
 * - POST-only navigation with hidden form fields
 */
import { chromium, type Page } from 'playwright'
import { readFileSync } from 'fs'
import { resolve } from 'path'

// Load env
try {
  const envPath = resolve(process.cwd(), '.env.local')
  for (const line of readFileSync(envPath, 'utf-8').split('\n')) {
    const t = line.trim()
    if (!t || t.startsWith('#')) continue
    const eq = t.indexOf('=')
    if (eq > 0) {
      const k = t.slice(0, eq).trim(), v = t.slice(eq + 1).trim()
      if (!process.env[k]) process.env[k] = v
    }
  }
} catch {}

const BASE = 'https://www.ninja-cartrade.jp'

async function main() {
  const loginId = process.env.NINJA_LOGIN_ID!
  const password = process.env.NINJA_PASSWORD!

  console.log('=== NINJA Playwright Scraper Test ===')
  console.log('Time:', new Date().toISOString())
  console.log('⚠️  This will kick any other active NINJA session!\n')

  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
    viewport: { width: 1280, height: 800 },
  })
  const page = await context.newPage()

  try {
    // Step 1: Navigate to login page
    console.log('1. Loading login page...')
    await page.goto(`${BASE}/ninja/`, { waitUntil: 'networkidle' })
    console.log('   URL:', page.url())
    console.log('   Title:', await page.title())

    // Step 2: Fill in credentials and login
    console.log('\n2. Logging in...')
    await page.fill('#loginId', loginId)
    await page.fill('#password', password)

    // Click login button — the site uses a custom JS login() function
    // triggered by the login button
    await page.evaluate(({ loginId, password }) => {
      // Set form values (in case fill didn't trigger change events)
      (document.getElementById('loginId') as HTMLInputElement).value = loginId;
      (document.getElementById('password') as HTMLInputElement).value = password;
      // Call the site's login function
      (window as any).login()
    }, { loginId, password })

    // Wait for the AJAX login response and any form submission
    await page.waitForTimeout(3000) // Give AJAX login time to complete + form submit

    console.log('   URL after login:', page.url())
    console.log('   Title:', await page.title())

    // Step 3: Handle session conflict page
    const pageText = await page.textContent('body') || ''
    if (pageText.includes('already logged in') || pageText.includes('logged out')) {
      console.log('\n3. Session conflict detected — clicking Login to confirm...')
      // Click the "Login" link that calls seniToSearchcondition()
      // Use Promise.all to avoid race between click and navigation
      await Promise.all([
        page.waitForNavigation({ waitUntil: 'load', timeout: 30000 }),
        page.click('a[onclick*="seniToSearchcondition"]'),
      ])
      await page.waitForLoadState('networkidle').catch(() => {})
      console.log('   URL:', page.url())
    } else if (pageText.includes('Login ID') || pageText.includes('ログインID')) {
      // Still on login page — try clicking the login button directly
      console.log('\n3. Still on login page — clicking button...')
      await Promise.all([
        page.waitForNavigation({ waitUntil: 'load', timeout: 15000 }).catch(() => {}),
        page.click('.loginBtn a, .grayBtn a, input[type="submit"]').catch(() => {}),
      ])
    } else {
      console.log('\n3. No conflict page — already navigated')
    }

    console.log('   Current URL:', page.url())
    console.log('   Title:', await page.title())

    // Step 4: Navigate to searchcondition if not already there
    if (!page.url().includes('searchcondition')) {
      console.log('\n4. Navigating to searchcondition...')
      // Use the site's navigation function
      await page.evaluate(() => {
        (window as any).seniToSearchcondition?.()
      })
      await page.waitForNavigation({ waitUntil: 'load', timeout: 15000 }).catch(() => {})
      await page.waitForLoadState('networkidle').catch(() => {})
      console.log('   URL:', page.url())
    }

    // Step 5: Navigate to makersearch (Toyota)
    console.log('\n5. Navigating to makersearch (Toyota brand 01)...')
    // Set brandGroupingCode and submit
    await page.evaluate(() => {
      const el = document.getElementById('brandGroupingCode') as HTMLInputElement
      if (el) el.value = '01'
      const action = document.getElementById('action') as HTMLInputElement
      if (action) action.value = 'init'
      const form = document.getElementById('form1') as HTMLFormElement
      if (form) {
        form.action = 'makersearch.action'
        form.submit()
      }
    })
    await page.waitForNavigation({ waitUntil: 'load', timeout: 15000 })
    await page.waitForLoadState('networkidle').catch(() => {})
    console.log('   URL:', page.url())

    // Step 6: Check HIACE VAN count
    console.log('\n6. Checking HIACE VAN count...')
    const bodyText = await page.textContent('body') || ''

    const hiaceMatch = bodyText.match(/HIACE VAN\s*\((\d+)\)/i)
    const regiusMatch = bodyText.match(/REGIUS ACE VAN\s*\((\d+)\)/i)
    console.log(`   HIACE VAN: ${hiaceMatch?.[1] ?? 'NOT FOUND'}`)
    console.log(`   REGIUS ACE VAN: ${regiusMatch?.[1] ?? 'NOT FOUND'}`)

    const hiaceCount = parseInt(hiaceMatch?.[1] || '0')
    const regiusCount = parseInt(regiusMatch?.[1] || '0')
    const totalCount = hiaceCount + regiusCount

    if (totalCount === 0) {
      console.log('\n   >>> STILL 0 — checking token field...')
      const token = await page.$eval('#token', (el: any) => el.value).catch(() => 'NOT FOUND')
      console.log(`   Token: ${token}`)

      // Check if page has any categories with non-zero counts
      const allText = await page.textContent('body') || ''
      const nonZero = allText.match(/\(\d{1,5}\)/g)?.filter(c => c !== '(0)') || []
      console.log(`   Non-zero counts on page: ${nonZero.join(', ')}`)

      // Screenshot for debugging
      await page.screenshot({ path: '/tmp/ninja-playwright-makersearch.png', fullPage: true })
      console.log('   Screenshot saved to /tmp/ninja-playwright-makersearch.png')
    } else {
      console.log(`\n   >>> SUCCESS! Found ${totalCount} listings!`)

      // Step 7: Click on HIACE VAN to go to search results
      console.log('\n7. Clicking HIACE VAN to search...')
      await page.evaluate(() => {
        (window as any).makerListChoiceCarCat?.('146')
      })
      await page.waitForNavigation({ waitUntil: 'load', timeout: 15000 })
    await page.waitForLoadState('networkidle').catch(() => {})
      console.log('   URL:', page.url())

      // Check results count
      const srText = await page.textContent('body') || ''
      const resultsMatch = srText.match(/Result[s\s　]*[：:]\s*(\d+)/i)
      console.log(`   Results: ${resultsMatch?.[1] ?? 'NOT FOUND'}`)

      // Count table rows (listing entries)
      const rowCount = await page.$$eval('tr', rows => rows.length)
      console.log(`   Table rows: ${rowCount}`)

      // Extract listing references
      const refs = await page.evaluate(() => {
        const results: Array<{ site: string; date: string; bidNo: string; model: string; grade: string; year: string; mileage: string; score: string; price: string }> = []
        // Look for seniCarDetail onclick handlers
        const links = document.querySelectorAll('[onclick*="seniCarDetail"], [onclick*="panCarDetail"]')
        for (const link of Array.from(links).slice(0, 5)) {
          const row = link.closest('tr')
          if (row) {
            const cells = row.querySelectorAll('td')
            results.push({
              site: cells[1]?.textContent?.trim() || '',
              date: cells[1]?.textContent?.trim() || '',
              bidNo: cells[1]?.textContent?.trim() || '',
              model: cells[2]?.textContent?.trim() || '',
              grade: '',
              year: cells[3]?.textContent?.trim() || '',
              mileage: cells[5]?.textContent?.trim() || '',
              score: cells[6]?.textContent?.trim() || '',
              price: cells[7]?.textContent?.trim() || '',
            })
          }
        }
        return results
      })
      console.log(`\n   Sample listings: ${refs.length}`)
      for (const r of refs) {
        console.log(`     ${r.model} | ${r.year} | ${r.mileage} | ${r.score} | ${r.price}`)
      }

      // Get ALL seniCarDetail calls
      const allRefs = await page.evaluate(() => {
        const html = document.documentElement.innerHTML
        const refs: Array<{ kaijoCode: string; auctionCount: string; bidNo: string }> = []
        const re = /seniCarDetail\s*\(\s*'([^']+)'\s*,\s*'([^']+)'\s*,\s*'([^']+)'\s*,\s*'([^']+)'\s*(?:,\s*'([^']+)')?\s*\)/g
        let m
        while ((m = re.exec(html)) !== null) {
          refs.push({ kaijoCode: m[2], auctionCount: m[3], bidNo: m[4] })
        }
        return refs
      })
      console.log(`\n   Total listing refs found: ${allRefs.length}`)
      for (const r of allRefs.slice(0, 10)) {
        console.log(`     ${r.kaijoCode}-${r.auctionCount}-${r.bidNo}`)
      }

      // Screenshot
      await page.screenshot({ path: '/tmp/ninja-playwright-results.png', fullPage: false })
      console.log('   Screenshot saved to /tmp/ninja-playwright-results.png')
    }
  } catch (err) {
    console.error('Error:', err)
    await page.screenshot({ path: '/tmp/ninja-playwright-error.png' }).catch(() => {})
    console.log('Error screenshot saved to /tmp/ninja-playwright-error.png')
  } finally {
    await browser.close()
  }
}

main().catch(console.error)
