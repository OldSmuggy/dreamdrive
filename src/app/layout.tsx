import type { Metadata } from 'next'
import { DM_Sans } from 'next/font/google'
import './globals.css'
import Header from '@/components/ui/Header'
import { GoogleAnalytics } from '@/components/GoogleAnalytics'
import { MetaPixel } from '@/components/MetaPixel'
import WhatsAppButton from '@/components/ui/WhatsAppButton'
import { getSiteSettings } from '@/lib/site-settings'

const body = DM_Sans({
  weight: ['400', '500', '700'],
  style: ['normal', 'italic'],
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
})

export const metadata: Metadata = {
  title: { default: 'Bare Camper — Toyota Hiace Campervans, Australia', template: '%s | Bare Camper' },
  description: "Australia's complete Toyota Hiace campervan platform. Source from Japan or convert your own. Pop tops, TAMA & MANA fitouts, DIY kits. Brisbane workshop.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://barecamper.com'),
  openGraph: {
    siteName: 'Bare Camper',
    type: 'website',
    locale: 'en_AU',
  },
  ...(process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION && {
    verification: {
      google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
    },
  }),
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const { logo_url } = await getSiteSettings()
  return (
    <html lang="en" className={body.variable}>
      <body className="font-body bg-white text-gray-900 antialiased">
        <GoogleAnalytics />
        <MetaPixel />
        <Header logoUrl={logo_url} />
        {children}
        <WhatsAppButton />
      </body>
    </html>
  )
}
