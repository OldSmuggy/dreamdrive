'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface Props {
  auctionTime: string | null
  auctionResult: string | null
  soldPriceJpy: number | null
  topBidJpy: number | null
  jpyRate: number
  listingId: string
}

function fmtJst(iso: string): string {
  return new Date(iso).toLocaleString('en-AU', {
    timeZone: 'Asia/Tokyo',
    weekday: 'long', day: 'numeric', month: 'long',
    hour: 'numeric', minute: '2-digit', hour12: true,
  }) + ' JST'
}

function fmtAest(iso: string): string {
  return new Date(iso).toLocaleString('en-AU', {
    timeZone: 'Australia/Brisbane',
    weekday: 'long', day: 'numeric', month: 'long',
    hour: 'numeric', minute: '2-digit', hour12: true,
  }) + ' AEST'
}

function fmtAud(jpy: number, rate: number): string {
  const aud = Math.round(jpy * rate)
  return new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD', maximumFractionDigits: 0 }).format(aud)
}

function fmtJpy(jpy: number): string {
  return '\u00A5' + jpy.toLocaleString()
}

export default function AuctionCountdownBanner({ auctionTime, auctionResult, soldPriceJpy, topBidJpy, jpyRate, listingId }: Props) {
  const [now, setNow] = useState(() => Date.now())
  const isPending = !auctionResult || auctionResult === 'pending'

  useEffect(() => {
    if (!isPending || !auctionTime) return
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [isPending, auctionTime])

  // SOLD
  if (auctionResult === 'sold') {
    return (
      <div className="bg-green-600 text-white rounded-2xl px-6 py-5 mb-6">
        <p className="font-display text-xl mb-1">SOLD at auction</p>
        {soldPriceJpy && (
          <p className="text-white/90 text-sm">
            Sold for {fmtJpy(soldPriceJpy)} (~{fmtAud(soldPriceJpy, jpyRate)})
          </p>
        )}
        <Link href="/browse" className="inline-block mt-3 bg-white text-green-700 font-semibold text-sm px-5 py-2 rounded-lg hover:bg-green-50">
          Find a similar van
        </Link>
      </div>
    )
  }

  // UNSOLD
  if (auctionResult === 'unsold') {
    return (
      <div className="bg-amber-500 text-white rounded-2xl px-6 py-5 mb-6">
        <p className="font-display text-xl mb-1">Passed in at auction</p>
        {topBidJpy && (
          <p className="text-white/90 text-sm mb-2">
            Highest bid: {fmtJpy(topBidJpy)} (~{fmtAud(topBidJpy, jpyRate)}) — did not meet reserve
          </p>
        )}
        <p className="text-white/80 text-sm mb-3">
          Passed in vans can often be purchased directly after auction at or near the highest bid price. Contact us to enquire.
        </p>
        <Link href={`/van/${listingId}#contact`} className="inline-block bg-white text-amber-700 font-semibold text-sm px-5 py-2 rounded-lg hover:bg-amber-50">
          Make an offer
        </Link>
      </div>
    )
  }

  // NO SALE
  if (auctionResult === 'no_sale') {
    return (
      <div className="bg-gray-500 text-white rounded-2xl px-6 py-5 mb-6">
        <p className="font-display text-xl mb-1">Auction cancelled</p>
        <Link href={`/van/${listingId}#contact`} className="inline-block mt-2 bg-white text-gray-700 font-semibold text-sm px-5 py-2 rounded-lg hover:bg-gray-50">
          Contact us about this van
        </Link>
      </div>
    )
  }

  // PENDING — show countdown
  if (!auctionTime) return null

  const diff = new Date(auctionTime).getTime() - now
  if (diff <= 0) {
    return (
      <div className="bg-gray-600 text-white rounded-2xl px-6 py-5 mb-6">
        <p className="font-display text-xl">Auction ended — result pending</p>
        <p className="text-white/70 text-sm mt-1">We&apos;ll update this page when the result is confirmed.</p>
      </div>
    )
  }

  const d = Math.floor(diff / 86400000)
  const h = Math.floor((diff % 86400000) / 3600000)
  const m = Math.floor((diff % 3600000) / 60000)
  const s = Math.floor((diff % 60000) / 1000)

  const countdownStr = d > 0
    ? `${d}d ${h}h ${m}m ${s}s`
    : h > 0
      ? `${h}h ${m}m ${s}s`
      : `${m}m ${s}s`

  const isUrgent = diff < 24 * 3600000

  return (
    <div className={`rounded-2xl px-6 py-5 mb-6 ${isUrgent ? 'bg-red-600' : 'bg-forest-700'} text-white`}>
      <p className="text-white/80 text-sm mb-1">This van goes to auction in:</p>
      <p className={`font-display text-3xl tabular-nums ${isUrgent ? 'animate-pulse' : ''}`}>
        {countdownStr}
      </p>
      <p className="text-white/60 text-xs mt-2">
        {fmtJst(auctionTime)} / {fmtAest(auctionTime)}
      </p>
      <Link
        href="#deposit"
        className="inline-block mt-3 bg-white text-forest-700 font-semibold text-sm px-5 py-2.5 rounded-lg hover:bg-forest-50"
      >
        Hold This Van — $500 Deposit
      </Link>
    </div>
  )
}
