import Link from 'next/link'
import { generateMeta } from '@/lib/seo'

export const metadata = generateMeta({
  title: 'Hiace Import & Campervan Guides | Bare Camper Blog',
  description: 'Practical guides on importing Toyota Hiace vans from Japan to Australia, campervan conversions, compliance costs, and more.',
  url: '/blog',
})

const POSTS = [
  {
    slug: 'how-to-import-a-hiace-from-japan-to-australia',
    title: 'How to Import a Toyota Hiace from Japan to Australia (2024 Guide)',
    excerpt: 'Step-by-step breakdown of the entire import process — from finding the right auction van in Japan to getting it registered on Australian roads.',
    date: '2024-11-01',
    readTime: '8 min read',
    category: 'Import Guide',
  },
  {
    slug: 'best-toyota-hiace-for-campervan-conversion-australia',
    title: 'Best Toyota Hiace Models for Campervan Conversion in Australia',
    excerpt: 'Not all Hiaces are equal when it comes to conversions. We break down the H200 vs 300 series, LWB vs SLWB, diesel vs petrol — and what actually matters for a build.',
    date: '2024-11-15',
    readTime: '6 min read',
    category: 'Buyer Guide',
  },
]

export default function BlogPage() {
  return (
    <div className="min-h-screen bg-cream">
      <div className="max-w-3xl mx-auto px-4 py-16">
        <div className="mb-12">
          <p className="text-driftwood text-sm font-semibold tracking-widest uppercase mb-3">Bare Camper</p>
          <h1 className="text-4xl font-bold text-charcoal mb-3">Guides & Resources</h1>
          <p className="text-gray-500 text-lg leading-relaxed">
            Practical guides on importing vans, campervan builds, and everything in between.
          </p>
        </div>

        <div className="space-y-6">
          {POSTS.map(post => (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              className="group block bg-white rounded-2xl p-6 border border-gray-100 hover:shadow-md hover:border-ocean/20 transition-all"
            >
              <div className="flex items-center gap-3 mb-3">
                <span className="text-xs font-semibold text-ocean bg-ocean/10 px-2.5 py-1 rounded-full">{post.category}</span>
                <span className="text-xs text-gray-400">{new Date(post.date).toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                <span className="text-xs text-gray-400">{post.readTime}</span>
              </div>
              <h2 className="text-xl font-bold text-charcoal mb-2 group-hover:text-ocean transition-colors leading-snug">{post.title}</h2>
              <p className="text-gray-500 text-sm leading-relaxed">{post.excerpt}</p>
              <span className="mt-4 inline-block text-ocean text-sm font-semibold group-hover:underline">Read more →</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
