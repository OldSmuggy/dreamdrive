import type { Metadata } from 'next'
import { DM_Serif_Display, DM_Sans } from 'next/font/google'
import './globals.css'
import Header from '@/components/ui/Header'
import { getSiteSettings } from '@/lib/site-settings'

const display = DM_Serif_Display({
  weight: ['400'],
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
})

const body = DM_Sans({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
})

export const metadata: Metadata = {
  title: { default: 'Dream Drive — Find it. Build it. Drive it.', template: '%s | Dream Drive' },
  description: 'Source a Toyota Hiace H200 from Japan and build your dream campervan with Dream Drive\'s TAMA, MANA, and pop top range.',
  openGraph: {
    siteName: 'Dream Drive',
    type: 'website',
    locale: 'en_AU',
  },
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const { logo_url } = await getSiteSettings()
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <body className="font-body bg-white text-gray-900 antialiased">
        <Header logoUrl={logo_url} />
        {children}
      </body>
    </html>
  )
}