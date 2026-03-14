'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  listingId: string
  initialSaved?: boolean
  userId?: string | null
  className?: string
}

export default function SaveVanButton({ listingId, initialSaved = false, userId, className = '' }: Props) {
  const [saved, setSaved] = useState(initialSaved)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const toggle = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (!userId) {
      const next = encodeURIComponent(window.location.pathname)
      router.push(`/login?next=${next}`)
      return
    }

    // Optimistic update
    setSaved(v => !v)
    setLoading(true)

    try {
      const method = saved ? 'DELETE' : 'POST'
      const res = await fetch('/api/saved-vans', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listing_id: listingId }),
      })
      if (!res.ok) {
        // Revert on error
        setSaved(v => !v)
      }
    } catch {
      setSaved(v => !v)
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      aria-label={saved ? 'Remove from saved' : 'Save van'}
      className={`flex items-center justify-center w-10 h-10 rounded-full transition-colors disabled:opacity-50 ${
        saved
          ? 'bg-red-50 text-red-500 hover:bg-red-100'
          : 'bg-white/80 text-gray-400 hover:text-red-400 hover:bg-white'
      } ${className}`}
    >
      <svg className="w-5 h-5" fill={saved ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round"
          d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
      </svg>
    </button>
  )
}
