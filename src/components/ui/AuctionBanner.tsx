'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { nextThursdayAuction, getCountdown } from '@/lib/utils'

interface Props {
  nextAuctionTime?: string | null
  auctionCount?: number
}

export default function AuctionBanner({ nextAuctionTime, auctionCount }: Props = {}) {
  const target = nextAuctionTime ? new Date(nextAuctionTime) : nextThursdayAuction()
  const [countdown, setCountdown] = useState(getCountdown(target))

  useEffect(() => {
    const t = nextAuctionTime ? new Date(nextAuctionTime) : nextThursdayAuction()
    const id = setInterval(() => {
      setCountdown(getCountdown(t))
    }, 1000)
    return () => clearInterval(id)
  }, [nextAuctionTime])

  if (countdown.total <= 0) return null

  const countLabel = auctionCount && auctionCount > 1
    ? `${auctionCount} vans going to auction — closes in `
    : 'Next Japan auction closes in '

  return (
    <Link href="/browse?source=auction"
      className="block bg-ocean hover:bg-charcoal text-white text-center py-2.5 px-4 text-sm font-medium transition-colors">
      <span className="opacity-80">{countLabel}</span>
      <span className="font-bold tabular-nums">
        {countdown.days}d {String(countdown.hours).padStart(2,'0')}h {String(countdown.minutes).padStart(2,'0')}m {String(countdown.seconds).padStart(2,'0')}s
      </span>
      <span className="ml-3 text-sand font-semibold">View listings &rarr;</span>
    </Link>
  )
}
