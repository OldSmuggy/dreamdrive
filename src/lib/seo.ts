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
  const defaultImage = `${process.env.NEXT_PUBLIC_APP_URL || 'https://barecamper.com'}/og-image.jpg`
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ||
    'https://barecamper.com'

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
