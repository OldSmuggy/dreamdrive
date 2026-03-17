export const dynamic = 'force-dynamic'

import ScrapePanel from './ScrapePanel'

// Server component — reads SCRAPE_SECRET server-side so it never enters the client bundle
export default function ScrapePage() {
  const secret = process.env.SCRAPE_SECRET ?? ''
  return <ScrapePanel secret={secret} />
}
