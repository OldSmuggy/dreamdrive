import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ||
    'https://dreamdrive-zeta.vercel.app'
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin/',
          '/api/',
          '/account/',
          '/my-van/',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
