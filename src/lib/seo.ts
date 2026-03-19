export function generateMeta({
  title,
  description,
  image,
  url,
  type = 'website',
}: {
  title: string
  description: string
  image?: string
  url?: string
  type?: string
}) {
  const siteName = 'Dream Drive'
  const defaultImage = 'https://dreamdrive-zeta.vercel.app/og-image.jpg'
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ||
    'https://dreamdrive-zeta.vercel.app'

  return {
    title,
    description,
    openGraph: {
      title: `${title} | ${siteName}`,
      description,
      url: url ? `${baseUrl}${url}` : baseUrl,
      siteName,
      images: [{ url: image || defaultImage }],
      type,
    },
    twitter: {
      card: 'summary_large_image' as const,
      title: `${title} | ${siteName}`,
      description,
      images: [image || defaultImage],
    },
  }
}
