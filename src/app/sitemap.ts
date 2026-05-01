import { MetadataRoute } from 'next'
import { createAdminClient } from '@/lib/supabase'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ||
    'https://barecamper.com.au'

  const supabase = createAdminClient()

  const { data: listings } = await supabase
    .from('listings')
    .select('id, updated_at')
    .eq('is_active', true)
    .in('status', ['published', 'available', 'live'])

  const { data: posts } = await supabase
    .from('blog_posts')
    .select('slug, updated_at')
    .eq('published', true)

  const staticPages = [
    { url: baseUrl, priority: 1.0 },
    { url: `${baseUrl}/browse`, priority: 0.9 },
    { url: `${baseUrl}/import-costs`, priority: 0.9 },
    { url: `${baseUrl}/import-hiace-australia`, priority: 0.9 },
    { url: `${baseUrl}/h200-vs-h300-hiace`, priority: 0.9 },
    { url: `${baseUrl}/toyota-hiace-4x4-australia`, priority: 0.9 },
    { url: `${baseUrl}/hiace-compliance-australia`, priority: 0.9 },
    { url: `${baseUrl}/submit-a-van`, priority: 0.8 },
    { url: `${baseUrl}/tip-a-van`, priority: 0.7 },
    { url: `${baseUrl}/about`, priority: 0.8 },
    { url: `${baseUrl}/full-build`, priority: 0.9 },
    { url: `${baseUrl}/tama`, priority: 0.8 },
    { url: `${baseUrl}/mana`, priority: 0.8 },
    { url: `${baseUrl}/kuma-q`, priority: 0.8 },
    { url: `${baseUrl}/pop-top`, priority: 0.7 },
    { url: `${baseUrl}/diy`, priority: 0.7 },
    { url: `${baseUrl}/hexa`, priority: 0.8 },
    { url: `${baseUrl}/sell`, priority: 0.7 },
    { url: `${baseUrl}/compare`, priority: 0.5 },
    { url: `${baseUrl}/privacy`, priority: 0.3 },
    { url: `${baseUrl}/terms`, priority: 0.3 },
    { url: `${baseUrl}/blog`, priority: 0.8 },
    { url: `${baseUrl}/blog/how-to-import-a-hiace-from-japan-to-australia`, priority: 0.8 },
    { url: `${baseUrl}/blog/best-toyota-hiace-for-campervan-conversion-australia`, priority: 0.8 },
    { url: `${baseUrl}/blog/pop-top-vs-hi-top-campervan-roof-conversion`, priority: 0.8 },
    { url: `${baseUrl}/blog/what-is-included-in-a-tama-campervan-build`, priority: 0.8 },
    { url: `${baseUrl}/how-it-works`, priority: 0.9 },
    { url: `${baseUrl}/why-bare-camper`, priority: 0.9 },
    { url: `${baseUrl}/faqs`, priority: 0.8 },
    { url: `${baseUrl}/finance`, priority: 0.8 },
  ].map(page => ({
    url: page.url,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: page.priority,
  }))

  const listingPages = (listings || []).map(listing => ({
    url: `${baseUrl}/van/${listing.id}`,
    lastModified: new Date(listing.updated_at),
    changeFrequency: 'daily' as const,
    priority: 0.6,
  }))

  const blogPages = (posts || []).map(post => ({
    url: `${baseUrl}/blog/${post.slug}`,
    lastModified: new Date(post.updated_at),
    changeFrequency: 'monthly' as const,
    priority: 0.5,
  }))

  return [...staticPages, ...listingPages, ...blogPages]
}
