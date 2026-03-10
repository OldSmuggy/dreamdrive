'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { nextThursdayAuction, getCountdown } from '@/lib/utils'

export default function AuctionBanner() {
  const [countdown, setCountdown] = useState(getCountdown(nextThursdayAuction()))

  useEffect(() => {
    const id = setInterval(() => {
      setCountdown(getCountdown(nextThursdayAuction()))
    }, 1000)
    return () => clearInterval(id)
  }, [])

  if (countdown.total <= 0) return null

  return (
    <Link href="/browse?source=auction"
      className="block bg-forest-700 hover:bg-forest-800 text-white text-center py-2.5 px-4 text-sm font-medium transition-colors">
      <span className="opacity-80">Next Japan auction closes in </span>
      <span className="font-bold tabular-nums">
        {countdown.days}d {String(countdown.hours).padStart(2,'0')}h {String(countdown.minutes).padStart(2,'0')}m {String(countdown.seconds).padStart(2,'0')}s
      </span>
      <span className="ml-3 text-sand-300 font-semibold">View listings →</span>
    </Link>
  )
}
