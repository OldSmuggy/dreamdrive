'use client'

import { useEffect } from 'react'
import { trackViewContent } from '@/lib/pixel-events'

interface Props {
  id: string
  model_name: string
  model_year?: number | null
  price_cents?: number | null
}

export default function ViewContentTracker(props: Props) {
  useEffect(() => {
    trackViewContent(props)
    // Increment view count (fire-and-forget)
    fetch(`/api/listings/${props.id}/view`, { method: 'POST' }).catch(() => {})
  }, [props.id]) // eslint-disable-line react-hooks/exhaustive-deps

  return null
}
