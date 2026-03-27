import { MetadataRoute } from 'next'
import { createAdminClient } from '@/lib/supabase'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ||
    'https://barecamper.com'

  const supabase = createAdminClient()

  const { data: listings } = await supabase
    .from('listings')
    .select('id, updated_at')
    .eq('is_active', true)
    .eq('status', 'published')

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
    { url: `${baseUrl}/about`, priority: 0.8 },
    { url: `${baseUrl}/tama`, priority: 0.8 },
    { url: `${baseUrl}/mana`, priority: 0.8 },
    { url: `${baseUrl}/pop-top`, priority: 0.7 },
    { url: `${baseUrl}/diy`, priority: 0.7 },
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
