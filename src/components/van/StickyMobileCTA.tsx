'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'

export default function StickyMobileCTA({
  listingId,
  price,
  ctaLabel,
}: {
  listingId: string
  price: string
  ctaLabel: string
}) {
  const [visible, setVisible] = useState(false)

  // Show after scrolling past the hero CTAs (~500px)
  useEffect(() => {
    function onScroll() {
      setVisible(window.scrollY > 500)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  if (!visible) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 sm:hidden bg-white border-t border-gray-200 shadow-lg px-4 py-3 flex items-center gap-3 safe-pb">
      <div className="flex-1 min-w-0">
        <p className="text-xs text-gray-500 leading-none mb-0.5">Asking price</p>
        <p className="text-base font-bold text-charcoal truncate">{price}</p>
      </div>
      <Link
        href={`/configurator?van=${listingId}`}
        className="btn-primary text-sm px-5 py-3 shrink-0"
      >
        {ctaLabel}
      </Link>
    </div>
  )
}
