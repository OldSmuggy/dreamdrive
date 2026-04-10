'use client'

import { useState, useEffect } from 'react'

const STATUS_BADGES: Record<string, { bg: string; text: string }> = {
  watching: { bg: 'bg-gray-100 text-gray-600', text: 'Watching' },
  deposit_paid: { bg: 'bg-blue-100 text-blue-700', text: 'Deposit Paid' },
  bidding: { bg: 'bg-amber-100 text-amber-700', text: 'Bidding' },
  won: { bg: 'bg-green-100 text-green-700', text: 'Won' },
  lost: { bg: 'bg-red-100 text-red-700', text: 'Lost' },
}

export default function AuctionCountdown({
  auctionTime,
  auctionStatus = 'watching',
  showTimezone = true,
}: {
  auctionTime: string | null
  auctionStatus?: string
  showTimezone?: boolean
}) {
  const [now, setNow] = useState(Date.now())

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(interval)
  }, [])

  const badge = STATUS_BADGES[auctionStatus] ?? STATUS_BADGES.watching

  if (!auctionTime) {
    return (
      <div className="flex items-center gap-2">
        <span className={`text-xs px-2 py-1 rounded-full font-semibold ${badge.bg}`}>{badge.text}</span>
        <span className="text-gray-400 text-sm">Auction time TBD</span>
      </div>
    )
  }

  const target = new Date(auctionTime).getTime()
  const diff = target - now

  if (auctionStatus === 'won' || auctionStatus === 'lost') {
    return (
      <span className={`text-xs px-2 py-1 rounded-full font-semibold ${badge.bg}`}>{badge.text}</span>
    )
  }

  if (diff <= 0) {
    return (
      <div className="flex items-center gap-2">
        <span className={`text-xs px-2 py-1 rounded-full font-semibold ${badge.bg}`}>{badge.text}</span>
        <span className="text-gray-500 text-sm font-medium">Auction ended</span>
      </div>
    )
  }

  const days = Math.floor(diff / 86400000)
  const hours = Math.floor((diff % 86400000) / 3600000)
  const minutes = Math.floor((diff % 3600000) / 60000)
  const seconds = Math.floor((diff % 60000) / 1000)

  const parts = []
  if (days > 0) parts.push(`${days}d`)
  parts.push(`${hours}h`)
  parts.push(`${String(minutes).padStart(2, '0')}m`)
  parts.push(`${String(seconds).padStart(2, '0')}s`)

  const jstTime = new Date(auctionTime).toLocaleString('en-AU', { timeZone: 'Asia/Tokyo', hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' })
  const localTime = new Date(auctionTime).toLocaleString('en-AU', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' })

  return (
    <div>
      <div className="flex items-center gap-2 mb-1">
        <span className={`text-xs px-2 py-1 rounded-full font-semibold ${badge.bg}`}>{badge.text}</span>
        <span className="text-ocean font-mono text-lg font-bold">{parts.join(' ')}</span>
      </div>
      {showTimezone && (
        <div className="text-[11px] text-gray-400 space-x-3">
          <span>Your time: {localTime}</span>
          <span>Japan: {jstTime} JST</span>
        </div>
      )}
    </div>
  )
}
