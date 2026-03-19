import type { Metadata } from 'next'
import { DM_Sans } from 'next/font/google'
import './globals.css'
import Header from '@/components/ui/Header'
import { GoogleAnalytics } from '@/components/GoogleAnalytics'
import { getSiteSettings } from '@/lib/site-settings'

const body = DM_Sans({
  weight: ['400', '500', '700'],
  style: ['normal', 'italic'],
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
})

export const metadata: Metadata = {
  title: { default: 'Dream Drive — Handcrafted Campervans from Japan', template: '%s | Dream Drive' },
  description: 'Import a Toyota Hiace from Japan and build your dream campervan. Featuring Dream Drive\'s TAMA, MANA, and pop top conversions.',
  openGraph: {
    siteName: 'Dream Drive',
    type: 'website',
    locale: 'en_AU',
  },
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const { logo_url } = await getSiteSettings()
  return (
    <html lang="en" className={body.variable}>
      <body className="font-body bg-white text-gray-900 antialiased">
        <GoogleAnalytics />
        <Header logoUrl={logo_url} />
        {children}
      </body>
    </html>
  )
}
