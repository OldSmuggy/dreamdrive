'use client'

import { useEffect } from 'react'
import { trackEvent } from '@/lib/analytics'

/**
 * Drop this into any server component page to fire a GA4 event on mount.
 * <TrackPageView event="browse_van" params={{ van_id: listing.id }} />
 */
export function TrackPageView({ event, params }: { event: string; params?: Record<string, string | number | boolean | null> }) {
  useEffect(() => {
    trackEvent(event, params)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event])

  return null
}
