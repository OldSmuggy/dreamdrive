/**
 * Meta Pixel event helpers.
 * These fire standard Facebook pixel events for ad optimisation and retargeting.
 * Safe to call even when the pixel isn't loaded — they silently no-op.
 */

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void
  }
}

/** Fires when a user views a van listing page */
export function trackViewContent(listing: {
  id: string
  model_name: string
  model_year?: number | null
  price_cents?: number | null
}) {
  window.fbq?.('track', 'ViewContent', {
    content_ids: [listing.id],
    content_name: `${listing.model_year ?? ''} ${listing.model_name}`.trim(),
    content_type: 'vehicle',
    ...(listing.price_cents && {
      value: listing.price_cents / 100,
      currency: 'AUD',
    }),
  })
}

/** Fires when a user submits a lead form (consultation, enquiry, etc.) */
export function trackLead(source: string) {
  window.fbq?.('track', 'Lead', {
    content_category: source,
  })
}

/** Fires when a user initiates a deposit hold */
export function trackInitiateCheckout(listing: {
  id: string
  model_name: string
  model_year?: number | null
}) {
  window.fbq?.('track', 'InitiateCheckout', {
    content_ids: [listing.id],
    content_name: `${listing.model_year ?? ''} ${listing.model_name}`.trim(),
    content_type: 'vehicle',
    value: 500,
    currency: 'AUD',
  })
}
