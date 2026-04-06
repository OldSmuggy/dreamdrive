/**
 * Track custom events in GA4 and Microsoft Clarity.
 * Call from any client component: trackEvent('browse_van', { van_id: '...' })
 *
 * Events tracked:
 * - browse_van:          User views a van listing detail page
 * - reserve_van:         User places a $3,000 hold on a van
 * - launch_configurator: User clicks through to the 3D configurator
 * - submit_lead:         User submits a contact/enquiry form
 * - tip_van:             User submits a van tip
 * - list_van:            User lists their own van for sale
 * - signup:              User creates an account
 * - whatsapp_click:      User clicks the WhatsApp button
 */

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void
    clarity?: (...args: unknown[]) => void
  }
}

export function trackEvent(
  eventName: string,
  params?: Record<string, string | number | boolean | null>
) {
  // GA4
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', eventName, params ?? {})
  }

  // Microsoft Clarity custom tags
  if (typeof window !== 'undefined' && window.clarity) {
    window.clarity('set', eventName, JSON.stringify(params ?? {}))
  }
}

/**
 * Track a page view with custom dimensions.
 * Next.js App Router handles basic pageviews via gtag('config'),
 * but use this for additional context (e.g. van model, source).
 */
export function trackPageView(
  pagePath: string,
  params?: Record<string, string>
) {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'page_view', {
      page_path: pagePath,
      ...params,
    })
  }
}

/**
 * Build a UTM-tagged URL for outreach.
 * Usage: utmUrl('/browse', 'instagram', 'social', 'spring-sale')
 * Returns: /browse?utm_source=instagram&utm_medium=social&utm_campaign=spring-sale
 */
export function utmUrl(
  path: string,
  source: string,
  medium: string,
  campaign?: string,
  content?: string
): string {
  const params = new URLSearchParams()
  params.set('utm_source', source)
  params.set('utm_medium', medium)
  if (campaign) params.set('utm_campaign', campaign)
  if (content) params.set('utm_content', content)
  return `${path}?${params.toString()}`
}
