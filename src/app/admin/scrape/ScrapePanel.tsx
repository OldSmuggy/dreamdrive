'use client'

import { useState } from 'react'

type Tab = 'ninja' | 'goonet'

interface ScrapeResult {
  found: number
  processed: number
  newInserts: number
  duplicates: number
  skipped: number
  errors: number
}

export default function ScrapePanel({ secret }: { secret: string }) {
  const [tab, setTab] = useState<Tab>('ninja')

  // NINJA state
  const [max, setMax] = useState('')
  const [yearFrom, setYearFrom] = useState('2015')
  const [yearTo, setYearTo] = useState('2024')
  const [driveType, setDriveType] = useState<'any' | '2WD' | '4WD'>('4WD')
  const [copied, setCopied] = useState(false)
  const [running, setRunning] = useState(false)
  const [log, setLog] = useState<string[]>([])
  const [result, setResult] = useState<ScrapeResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Goo-net state
  const [gMode, setGMode] = useState<'search' | 'urls'>('urls')
  const [gMax, setGMax] = useState('10')
  const [gYearFrom, setGYearFrom] = useState('2015')
  const [gYearTo, setGYearTo] = useState('2024')
  const [gDriveType, setGDriveType] = useState<'any' | '2WD' | '4WD'>('4WD')
  const [gMaxPrice, setGMaxPrice] = useState('')
  const [gUrls, setGUrls] = useState('')
  const [gCopied, setGCopied] = useState(false)

  const buildNinjaCommand = () => {
    let cmd = 'npx tsx scripts/run-ninja-scrape.ts'
    if (max.trim()) cmd += ` --max ${max.trim()}`
    if (yearFrom.trim()) cmd += ` --year-from ${yearFrom.trim()}`
    if (yearTo.trim()) cmd += ` --year-to ${yearTo.trim()}`
    if (driveType !== 'any') cmd += ` --drive ${driveType}`
    return cmd
  }

  const gUrlCount = gUrls.split('\n').filter(l => l.trim().includes('goo-net.com/usedcar/spread/')).length

  const buildGoonetCommand = () => {
    let cmd = 'npx tsx scripts/run-goonet-scrape.ts'
    if (gMode === 'urls') {
      cmd += ' --urls-file /tmp/goonet-urls.txt'
    } else {
      if (gYearFrom.trim()) cmd += ` --year-from ${gYearFrom.trim()}`
      if (gYearTo.trim()) cmd += ` --year-to ${gYearTo.trim()}`
      if (gDriveType !== 'any') cmd += ` --drive ${gDriveType}`
      if (gMaxPrice.trim()) cmd += ` --max-price ${gMaxPrice.trim()}`
    }
    if (gMax.trim()) cmd += ` --max ${gMax.trim()}`
    return cmd
  }

  const handleRun = async () => {
    setRunning(true)
    setLog([])
    setResult(null)
    setError(null)

    const params = new URLSearchParams()
    if (max.trim()) params.set('max', max.trim())

    const url = `/api/scrape${params.toString() ? `?${params}` : ''}`

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: secret ? { 'x-scrape-secret': secret } : {},
      })

      if (!res.ok) {
        setError(`HTTP ${res.status}: ${await res.text()}`)
        setRunning(false)
        return
      }

      const reader = res.body!.getReader()
      const decoder = new TextDecoder()

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value, { stream: true })
        for (const line of chunk.split('\n')) {
          if (!line.startsWith('data: ')) continue
          try {
            const payload = JSON.parse(line.slice(6))
            if (payload.msg !== undefined) {
              setLog(prev => [...prev, payload.msg])
            }
            if (payload.done) {
              if (payload.error) setError(payload.error)
              else setResult(payload.result)
            }
          } catch {}
        }
      }
    } catch (err) {
      setError(String(err))
    }

    setRunning(false)
  }

  const tabCls = (t: Tab) =>
    `px-4 py-2 text-sm font-semibold rounded-t-lg transition-colors ${
      tab === t
        ? 'bg-white text-charcoal border border-b-0 border-gray-200'
        : 'bg-gray-100 text-gray-500 hover:text-gray-700'
    }`

  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <h1 className="text-3xl text-charcoal">Auto-Scrape</h1>
        <p className="text-gray-500 text-sm mt-1">
          Import Hiace Van listings from auction and dealer sites.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-0">
        <button onClick={() => setTab('ninja')} className={tabCls('ninja')}>
          NINJA Auction
        </button>
        <button onClick={() => setTab('goonet')} className={tabCls('goonet')}>
          Goo-net Dealer
        </button>
      </div>

      {/* ═══════════════ NINJA TAB ═══════════════ */}
      {tab === 'ninja' && (
        <>
          {/* When to run notice */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl rounded-tl-none p-4 mb-5 text-sm text-amber-900">
            <p className="font-semibold mb-1">When to run</p>
            <p>
              USS auctions run on <strong>Thursdays</strong>. New listings appear in the system from
              late Thursday and are available Friday–Tuesday. Run the scraper on{' '}
              <strong>Friday or the weekend after a Thursday auction</strong> for the best coverage.
              Results will be 0 outside active auction windows.
            </p>
          </div>

          {/* Command Builder */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 mb-5">
            <p className="font-semibold text-charcoal mb-4">Command Builder</p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-5">
              <label className="flex flex-col gap-1">
                <span className="text-xs font-medium text-gray-500">Year from</span>
                <input type="number" value={yearFrom} onChange={e => setYearFrom(e.target.value)} placeholder="any" min={1990} max={2030} className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-ocean" />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-xs font-medium text-gray-500">Year to</span>
                <input type="number" value={yearTo} onChange={e => setYearTo(e.target.value)} placeholder="any" min={1990} max={2030} className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-ocean" />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-xs font-medium text-gray-500">Drive type</span>
                <select value={driveType} onChange={e => setDriveType(e.target.value as 'any' | '2WD' | '4WD')} className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-ocean bg-white">
                  <option value="any">Any</option>
                  <option value="2WD">2WD</option>
                  <option value="4WD">4WD</option>
                </select>
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-xs font-medium text-gray-500">Max listings</span>
                <input type="number" value={max} onChange={e => setMax(e.target.value)} placeholder="all" min={1} className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-ocean" />
              </label>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 mb-3 text-xs text-gray-600 space-y-3">
              <div>
                <span className="font-semibold text-gray-700">1. First time only</span>
                <div className="font-mono text-gray-500 mt-1 bg-white border border-gray-200 rounded px-3 py-2">
                  cd ~/Desktop/&quot;DD App&quot;/dreamdrive && npx playwright install chromium
                </div>
              </div>
              <div>
                <span className="font-semibold text-gray-700">2. Open Terminal, paste the command below</span>
                <p className="text-gray-400 mt-0.5">
                  Takes ~30–60s per listing (logs in, clicks through each van, downloads photos).
                  <code className="bg-gray-100 px-1 rounded">--max</code> = number of listings to <strong>process</strong> (skipped grades don&apos;t count).
                </p>
              </div>
            </div>

            <div className="relative group">
              <div className="bg-gray-950 text-green-400 rounded-lg p-4 font-mono text-sm overflow-x-auto pr-16">
                cd ~/Desktop/&quot;DD App&quot;/dreamdrive && {buildNinjaCommand()}
              </div>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(`cd ~/Desktop/"DD App"/dreamdrive && ${buildNinjaCommand()}`)
                  setCopied(true)
                  setTimeout(() => setCopied(false), 2000)
                }}
                className="absolute top-2 right-2 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-md text-xs font-medium transition-colors"
              >
                {copied ? '✓ Copied!' : 'Copy'}
              </button>
            </div>

            <p className="text-xs text-gray-400 mt-2">
              Requires <code className="bg-gray-100 px-1 rounded">NINJA_LOGIN_ID</code> and <code className="bg-gray-100 px-1 rounded">NINJA_PASSWORD</code> in <code className="bg-gray-100 px-1 rounded">.env.local</code>.
              New listings go to <strong>Draft</strong> — review and publish from{' '}
              <a href="/admin/listings" className="text-ocean underline">Listings</a>.
            </p>
          </div>

          {/* Run from browser (local only) */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 mb-5">
            <p className="font-semibold text-charcoal mb-3">Or run from browser <span className="text-xs font-normal text-gray-400">(local dev only)</span></p>
            <button
              onClick={handleRun}
              disabled={running}
              className="w-full py-3 bg-ocean text-white font-semibold rounded-xl hover:bg-ocean disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {running ? 'Scraping...' : 'Run Full Scrape'}
            </button>
          </div>

          {/* Live log */}
          {log.length > 0 && (
            <div className="bg-gray-950 rounded-xl p-4 mb-5 font-mono text-xs text-gray-300 max-h-96 overflow-y-auto">
              {log.map((line, i) => (
                <div key={i} className={line.startsWith('FATAL') || line.startsWith('ERROR') ? 'text-red-400' : ''}>
                  {line || '\u00a0'}
                </div>
              ))}
              {running && <div className="text-ocean animate-pulse">|</div>}
            </div>
          )}

          {/* Result summary */}
          {result && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-5">
              <p className="font-semibold text-green-800 mb-3">Scrape complete</p>
              <div className="grid grid-cols-3 gap-3 text-center">
                {[
                  { label: 'Found', value: result.found },
                  { label: 'Processed', value: result.processed },
                  { label: 'New inserts', value: result.newInserts },
                  { label: 'Duplicates', value: result.duplicates },
                  { label: 'Grade-excluded', value: result.skipped },
                  { label: 'Errors', value: result.errors },
                ].map(({ label, value }) => (
                  <div key={label} className="bg-white rounded-lg p-3 border border-green-100">
                    <div className="text-2xl font-bold text-gray-900">{value}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{label}</div>
                  </div>
                ))}
              </div>
              {result.newInserts > 0 && (
                <div className="mt-4 text-center">
                  <a href="/admin/listings" className="text-ocean text-sm font-semibold underline">
                    View listings
                  </a>
                </div>
              )}
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <p className="font-semibold text-red-700 text-sm">Error</p>
              <p className="text-red-600 text-sm mt-1 font-mono">{error}</p>
            </div>
          )}
        </>
      )}

      {/* ═══════════════ GOO-NET TAB ═══════════════ */}
      {tab === 'goonet' && (
        <>
          <div className="bg-blue-50 border border-blue-200 rounded-xl rounded-tl-none p-4 mb-5 text-sm text-blue-900">
            <p className="font-semibold mb-1">About Goo-net scraper</p>
            <p>
              Searches <strong>goo-net.com</strong> for Toyota Hiace Van dealer listings.
              Clicks into each listing to extract full specs, equipment, condition scores,
              and <strong>downloads high-res photos to Supabase storage</strong> (persistent, won&apos;t break when listings expire).
              No login required — these are public pages.
            </p>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-6 mb-5">
            <p className="font-semibold text-charcoal mb-4">Command Builder</p>

            {/* Mode toggle */}
            <div className="flex gap-2 mb-5">
              <button onClick={() => setGMode('urls')} className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${gMode === 'urls' ? 'bg-ocean text-white' : 'bg-gray-100 text-gray-500 hover:text-gray-700'}`}>
                Paste URLs
              </button>
              <button onClick={() => setGMode('search')} className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${gMode === 'search' ? 'bg-ocean text-white' : 'bg-gray-100 text-gray-500 hover:text-gray-700'}`}>
                Search Goo-net
              </button>
            </div>

            {gMode === 'urls' ? (
              <>
                <label className="flex flex-col gap-1 mb-4">
                  <span className="text-xs font-medium text-gray-500">
                    Paste Goo-net listing URLs (one per line) — {gUrlCount > 0 ? <strong className="text-ocean">{gUrlCount} valid URLs</strong> : 'no URLs yet'}
                  </span>
                  <textarea
                    value={gUrls}
                    onChange={e => setGUrls(e.target.value)}
                    rows={6}
                    placeholder={'https://www.goo-net.com/usedcar/spread/goo/14/700120110630260219003.html\nhttps://www.goo-net.com/usedcar/spread/goo/11/700091029630260110002.html\n...'}
                    className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-ocean font-mono"
                  />
                </label>
                <div className="grid grid-cols-2 gap-4 mb-5">
                  <label className="flex flex-col gap-1">
                    <span className="text-xs font-medium text-gray-500">Max listings</span>
                    <input type="number" value={gMax} onChange={e => setGMax(e.target.value)} placeholder="all" min={1} className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-ocean" />
                  </label>
                  <div className="flex items-end">
                    <button
                      onClick={async () => {
                        const urlLines = gUrls.split('\n').filter(l => l.trim().includes('goo-net.com/usedcar/spread/'))
                        if (urlLines.length === 0) return
                        const blob = new Blob([urlLines.join('\n')], { type: 'text/plain' })
                        const url = URL.createObjectURL(blob)
                        const a = document.createElement('a')
                        a.href = url
                        a.download = 'goonet-urls.txt'
                        a.click()
                        URL.revokeObjectURL(url)
                      }}
                      disabled={gUrlCount === 0}
                      className="w-full py-2 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 disabled:opacity-40 transition-colors text-sm"
                    >
                      Save URLs to file ({gUrlCount})
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-5">
                <label className="flex flex-col gap-1">
                  <span className="text-xs font-medium text-gray-500">Year from</span>
                  <input type="number" value={gYearFrom} onChange={e => setGYearFrom(e.target.value)} placeholder="any" min={1990} max={2030} className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-ocean" />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-xs font-medium text-gray-500">Year to</span>
                  <input type="number" value={gYearTo} onChange={e => setGYearTo(e.target.value)} placeholder="any" min={1990} max={2030} className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-ocean" />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-xs font-medium text-gray-500">Drive type</span>
                  <select value={gDriveType} onChange={e => setGDriveType(e.target.value as 'any' | '2WD' | '4WD')} className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-ocean bg-white">
                    <option value="any">Any</option>
                    <option value="2WD">2WD</option>
                    <option value="4WD">4WD</option>
                  </select>
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-xs font-medium text-gray-500">Max price (万円)</span>
                  <input type="number" value={gMaxPrice} onChange={e => setGMaxPrice(e.target.value)} placeholder="any" min={50} className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-ocean" />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-xs font-medium text-gray-500">Max listings</span>
                  <input type="number" value={gMax} onChange={e => setGMax(e.target.value)} placeholder="all" min={1} className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-ocean" />
                </label>
              </div>
            )}

            <div className="bg-gray-50 rounded-lg p-4 mb-3 text-xs text-gray-600 space-y-3">
              <div>
                <span className="font-semibold text-gray-700">1. First time only</span>
                <div className="font-mono text-gray-500 mt-1 bg-white border border-gray-200 rounded px-3 py-2">
                  cd ~/Desktop/&quot;DD App&quot;/dreamdrive && npx playwright install chromium
                </div>
              </div>
              <div>
                <span className="font-semibold text-gray-700">{gMode === 'urls' ? '2. Save the URL file, then paste the command below in Terminal' : '2. Open Terminal, paste the command below'}</span>
                <p className="text-gray-400 mt-0.5">
                  Takes ~15–30s per listing (loads page, extracts specs, downloads photos).
                  Photos are saved to Supabase storage so they persist after the dealer listing expires.
                </p>
              </div>
            </div>

            <div className="relative group">
              <div className="bg-gray-950 text-green-400 rounded-lg p-4 font-mono text-sm overflow-x-auto pr-16">
                cd ~/Desktop/&quot;DD App&quot;/dreamdrive && {buildGoonetCommand()}
              </div>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(`cd ~/Desktop/"DD App"/dreamdrive && ${buildGoonetCommand()}`)
                  setGCopied(true)
                  setTimeout(() => setGCopied(false), 2000)
                }}
                className="absolute top-2 right-2 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-md text-xs font-medium transition-colors"
              >
                {gCopied ? '✓ Copied!' : 'Copy'}
              </button>
            </div>

            <p className="text-xs text-gray-400 mt-2">
              Requires Supabase keys and <code className="bg-gray-100 px-1 rounded">ANTHROPIC_API_KEY</code> in <code className="bg-gray-100 px-1 rounded">.env.local</code> (for AI translation).
              New listings go to <strong>Draft</strong> — review and publish from{' '}
              <a href="/admin/listings" className="text-ocean underline">Listings</a>.
            </p>
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 text-sm text-gray-600">
            <p className="font-semibold text-charcoal mb-2">What it captures</p>
            <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs">
              <div>- Model name, grade, year, mileage</div>
              <div>- Engine type, displacement, fuel</div>
              <div>- Transmission, drive (2WD/4WD)</div>
              <div>- Body colour, chassis code</div>
              <div>- Body price + total price (JPY)</div>
              <div>- Interior/exterior condition scores</div>
              <div>- Equipment (nav, leather, alloys, AC...)</div>
              <div>- Power steering, power windows, rear AC</div>
              <div>- Accident history, shaken expiry</div>
              <div>- Size classification (LWB/SLWB)</div>
              <div>- Up to 20 high-res photos (saved to storage)</div>
              <div>- AI-translated English description</div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
