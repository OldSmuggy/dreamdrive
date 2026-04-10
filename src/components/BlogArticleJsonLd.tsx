const BASE_URL = 'https://barecamper.com.au'

interface Props {
  title: string
  description: string
  slug: string
  datePublished: string
  dateModified?: string
  category: string
}

export default function BlogArticleJsonLd({ title, description, slug, datePublished, dateModified, category }: Props) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: title,
    description,
    url: `${BASE_URL}/blog/${slug}`,
    datePublished,
    dateModified: dateModified ?? datePublished,
    author: {
      '@type': 'Organization',
      name: 'Bare Camper',
      url: BASE_URL,
    },
    publisher: {
      '@type': 'Organization',
      name: 'Bare Camper',
      url: BASE_URL,
      logo: { '@type': 'ImageObject', url: `${BASE_URL}/barecamper-logo-dark-400.png` },
    },
    mainEntityOfPage: { '@type': 'WebPage', '@id': `${BASE_URL}/blog/${slug}` },
    articleSection: category,
  }

  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
}
