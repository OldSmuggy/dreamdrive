import Link from 'next/link'
import { generateMeta } from '@/lib/seo'

export const metadata = generateMeta({
  title: 'Hiace Import & Campervan Guides | Bare Camper Blog',
  description: 'Practical guides on importing Toyota Hiace vans from Japan to Australia, campervan conversions, compliance costs, roof options, and more.',
  url: '/blog',
})

const POSTS = [
  {
    slug: 'pop-top-vs-hi-top-campervan-roof-conversion',
    title: 'Pop Top vs Hi-Top Roof Conversion — Which Is Right for Your Hiace?',
    excerpt: 'An honest comparison of pop top and hi-top roof conversions from someone who builds both every week. Costs, pros, cons, and which suits your build style.',
    date: '2026-03-28',
    readTime: '7 min read',
    category: 'Buyer Guide',
  },
  {
    slug: 'what-is-included-in-a-tama-campervan-build',
    title: 'What\'s Included in a TAMA Campervan Build — Full Spec Breakdown',
    excerpt: 'Complete breakdown of the TAMA conversion — 6-seat family campervan with ISOFIX, galley kitchen, walnut countertops, full electrical, and everything else.',
    date: '2026-03-28',
    readTime: '8 min read',
    category: 'Build Guide',
  },
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

const GUIDES = [
  {
    href: '/import-hiace-australia',
    title: 'How to Import a Toyota Hiace from Japan — Complete Guide',
    desc: 'Everything Australians need to know: costs, compliance, auction grades, H200 vs H300, timelines.',
    category: 'Import Guide',
  },
  {
    href: '/h200-vs-h300-hiace',
    title: 'H200 vs H300 Toyota Hiace — Which Should You Import?',
    desc: 'Detailed spec comparison of both generations. Production years, engines, dimensions, parts compatibility, pricing.',
    category: 'Comparison',
  },
  {
    href: '/hiace-compliance-australia',
    title: 'Toyota Hiace Compliance Australia — RAWS Guide',
    desc: '8-step compliance process, costs, timelines, what gets modified, and how to register in any state.',
    category: 'Compliance',
  },
  {
    href: '/toyota-hiace-4x4-australia',
    title: 'Toyota Hiace 4x4 — The Van Toyota Won\'t Sell You Here',
    desc: 'Factory 4WD Hiace: which models have it, off-road capability, import costs, and conversion compatibility.',
    category: '4x4',
  },
  {
    href: '/import-costs',
    title: 'How Pricing Works — Import Cost Breakdown',
    desc: 'Full cost breakdown with interactive calculator. See exactly where every dollar goes.',
    category: 'Pricing',
  },
]

export default function BlogPage() {
  return (
    <div className="min-h-screen bg-cream">
      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="mb-12">
          <p className="text-driftwood text-sm font-semibold tracking-widest uppercase mb-3">Bare Camper</p>
          <h1 className="text-4xl font-bold text-charcoal mb-3">Guides & Resources</h1>
          <p className="text-gray-500 text-lg leading-relaxed">
            Practical guides on importing vans, campervan builds, roof conversions, and everything in between.
          </p>
        </div>

        {/* Blog posts */}
        <div className="space-y-6 mb-16">
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

        {/* Reference guides section */}
        <div>
          <h2 className="text-2xl font-bold text-charcoal mb-2">Reference Guides</h2>
          <p className="text-gray-500 text-sm mb-6">
            In-depth pages covering specific topics — import process, compliance, model comparisons, and pricing.
          </p>
          <div className="grid md:grid-cols-2 gap-4">
            {GUIDES.map(guide => (
              <Link
                key={guide.href}
                href={guide.href}
                className="group bg-white rounded-xl p-5 border border-gray-100 hover:shadow-md hover:border-ocean/20 transition-all"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[10px] font-semibold text-driftwood bg-driftwood/10 px-2 py-0.5 rounded-full uppercase tracking-wider">{guide.category}</span>
                </div>
                <h3 className="font-bold text-charcoal text-sm mb-1 group-hover:text-ocean transition-colors leading-snug">{guide.title}</h3>
                <p className="text-gray-500 text-xs leading-relaxed">{guide.desc}</p>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
