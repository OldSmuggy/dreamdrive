'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { trackInitiateCheckout } from '@/lib/pixel-events'
import type { Listing } from '@/types'

interface Props {
  listing: Listing
  userId?: string | null
}

export default function DepositHoldButton({ listing, userId }: Props) {
  const [showModal, setShowModal] = useState(false)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const ctaLabel =
    listing.source === 'auction' ? 'Hold This Van — $500 Deposit'
    : listing.source === 'au_stock' ? 'Reserve Now — $500 Deposit'
    : 'Express Interest — Book a Call'

  const handleClick = () => {
    if (!userId) {
      router.push(`/login?next=/van/${listing.id}`)
      return
    }
    setShowModal(true)
  }

  const handleConfirm = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/deposit-holds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listing_id: listing.id }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Request failed')
      trackInitiateCheckout(listing)
      setSuccess(true)
    } catch (e) {
      setError(String(e))
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button onClick={handleClick} className="btn-secondary w-full text-center text-base py-3 block">
        {ctaLabel}
      </button>

      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
          style={{ background: 'rgba(0,0,0,0.6)' }}
          onClick={() => !loading && setShowModal(false)}
        >
          <div
            className="bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl p-6 shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            {success ? (
              <div className="text-center py-4">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-xl text-charcoal mb-2">Deposit Hold Requested</h3>
                <p className="text-gray-500 text-sm mb-6">
                  We&apos;ll be in touch within 1 business day to process your $500 deposit payment and confirm your hold.
                </p>
                <button onClick={() => setShowModal(false)} className="btn-primary px-8 py-2.5">Done</button>
              </div>
            ) : (
              <>
                <h3 className="text-xl text-charcoal mb-1">Hold This Van</h3>
                <p className="text-gray-400 text-sm mb-5">{listing.model_name}{listing.model_year ? ` · ${listing.model_year}` : ''}</p>

                <div className="bg-cream rounded-xl p-4 mb-5 space-y-2 text-sm text-gray-700">
                  <p>✓ &nbsp;$500 deposit holds this van for up to 7 days</p>
                  <p>✓ &nbsp;Fully refundable if you decide not to proceed</p>
                  <p>✓ &nbsp;We&apos;ll contact you within 1 business day to process payment</p>
                  <p>✓ &nbsp;Deposit goes toward your final purchase price</p>
                </div>

                {error && <p className="text-red-600 text-sm mb-4 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

                <div className="flex gap-3">
                  <button
                    onClick={handleConfirm}
                    disabled={loading}
                    className="btn-primary flex-1 py-3 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Submitting…
                      </>
                    ) : 'Confirm Hold Request'}
                  </button>
                  <button onClick={() => setShowModal(false)} className="btn-secondary px-5 py-3">Cancel</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}
