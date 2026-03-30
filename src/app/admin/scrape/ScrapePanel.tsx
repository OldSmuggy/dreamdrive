'use client'

import { useState } from 'react'

interface ScrapeResult {
  found: number
  processed: number
  newInserts: number
  duplicates: number
  skipped: number
  errors: number
}

export default function ScrapePanel({ secret }: { secret: string }) {
  const [max, setMax] = useState('')
  const [yearFrom, setYearFrom] = useState('2015')
  const [yearTo, setYearTo] = useState('2024')
  const [driveType, setDriveType] = useState<'any' | '2WD' | '4WD'>('4WD')
  const [copied, setCopied] = useState(false)
  const [running, setRunning] = useState(false)
  const [log, setLog] = useState<string[]>([])
  const [result, setResult] = useState<ScrapeResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const buildCommand = () => {
    let cmd = 'npx tsx scripts/run-ninja-scrape.ts'
    if (max.trim()) cmd += ` --max ${max.trim()}`
    if (yearFrom.trim()) cmd += ` --year-from ${yearFrom.trim()}`
    if (yearTo.trim()) cmd += ` --year-to ${yearTo.trim()}`
    if (driveType !== 'any') cmd += ` --drive ${driveType}`
    return cmd
  }

  const copyCommand = async () => {
    await navigator.clipboard.writeText(buildCommand())
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
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

  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <h1 className="text-3xl text-charcoal">Full Auto-Scrape</h1>
        <p className="text-gray-500 text-sm mt-1">
          Logs into NINJA, searches for HIACE VAN &amp; REGIUS ACE VAN listings, and imports them to the database.
        </p>
      </div>

      {/* When to run notice */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-5 text-sm text-amber-900">
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

        {/* Filters row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-5">
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-gray-500">Year from</span>
            <input
              type="number"
              value={yearFrom}
              onChange={e => setYearFrom(e.target.value)}
              placeholder="any"
              min={1990}
              max={2030}
              className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-ocean"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-gray-500">Year to</span>
            <input
              type="number"
              value={yearTo}
              onChange={e => setYearTo(e.target.value)}
              placeholder="any"
              min={1990}
              max={2030}
              className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-ocean"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-gray-500">Drive type</span>
            <select
              value={driveType}
              onChange={e => setDriveType(e.target.value as 'any' | '2WD' | '4WD')}
              className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-ocean bg-white"
            >
              <option value="any">Any</option>
              <option value="2WD">2WD</option>
              <option value="4WD">4WD</option>
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-gray-500">Max listings</span>
            <input
              type="number"
              value={max}
              onChange={e => setMax(e.target.value)}
              placeholder="all"
              min={1}
              className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-ocean"
            />
          </label>
        </div>

        {/* One-time setup */}
        <div className="bg-gray-50 rounded-lg p-3 mb-3 text-xs text-gray-500 font-mono">
          <div className="text-gray-400 mb-1"># First time setup</div>
          <div>cd ~/Desktop/&quot;DD App&quot;/dreamdrive && npx playwright install chromium</div>
        </div>

        {/* Generated command */}
        <div className="relative group">
          <div className="bg-gray-950 text-green-400 rounded-lg p-4 font-mono text-sm overflow-x-auto pr-16">
            {buildCommand()}
          </div>
          <button
            onClick={copyCommand}
            className="absolute top-2 right-2 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-md text-xs font-medium transition-colors"
          >
            {copied ? '✓ Copied!' : '📋 Copy'}
          </button>
        </div>

        <p className="text-xs text-gray-400 mt-2">
          Copy and paste into Terminal. Takes ~2–4s per listing.
          Needs <code className="bg-gray-100 px-1 rounded">NINJA_LOGIN_ID</code> and <code className="bg-gray-100 px-1 rounded">NINJA_PASSWORD</code> in <code className="bg-gray-100 px-1 rounded">.env.local</code>.
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
          {running ? '⏳ Scraping...' : '🤖 Run Full Scrape'}
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
          {running && <div className="text-ocean animate-pulse">▋</div>}
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
                → View listings
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
    </div>
  )
}
