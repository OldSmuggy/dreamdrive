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
  const siteName = 'Bare Camper'
  const defaultImage = `${process.env.NEXT_PUBLIC_APP_URL || 'https://barecamper.com.au'}/og-image.jpg`
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ||
    'https://barecamper.com.au'

  // Don't double-append site name if title already includes it
  const ogTitle = title.includes(siteName) ? title : `${title} | ${siteName}`

  return {
    title,
    description,
    openGraph: {
      title: ogTitle,
      description,
      url: url ? `${baseUrl}${url}` : baseUrl,
      siteName,
      images: [{ url: image || defaultImage }],
      type,
    },
    twitter: {
      card: 'summary_large_image' as const,
      title: ogTitle,
      description,
      images: [image || defaultImage],
    },
  }
}
