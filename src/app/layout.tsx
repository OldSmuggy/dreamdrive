import type { Metadata } from 'next'
import { DM_Sans } from 'next/font/google'
import './globals.css'
import Header from '@/components/ui/Header'
import { getSiteSettings } from '@/lib/site-settings'

const body = DM_Sans({
  weight: ['400', '500', '700'],
  style: ['normal', 'italic'],
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
})

export const metadata: Metadata = {
  title: { default: 'Bare Camper — just what you need.', template: '%s | Bare Camper' },
  description: 'Source a Toyota Hiace direct from Japan and build your dream campervan. Featuring Dream Drive\'s TAMA, MANA, and pop top range.',
  openGraph: {
    siteName: 'Bare Camper',
    type: 'website',
    locale: 'en_AU',
  },
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const { logo_url } = await getSiteSettings()
  return (
    <html lang="en" className={body.variable}>
      <body className="font-body bg-white text-gray-900 antialiased">
        <Header logoUrl={logo_url} />
        {children}
      </body>
    </html>
  )
}
