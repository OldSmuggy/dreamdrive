import Link from 'next/link'

const ALL_POSTS = [
  { slug: 'pop-top-vs-hi-top-campervan-roof-conversion', title: 'Pop Top vs Hi-Top Roof Conversion', category: 'Buyer Guide' },
  { slug: 'what-is-included-in-a-tama-campervan-build', title: 'What\'s Included in a TAMA Build', category: 'Build Guide' },
  { slug: 'how-to-import-a-hiace-from-japan-to-australia', title: 'How to Import a Hiace from Japan', category: 'Import Guide' },
  { slug: 'best-toyota-hiace-for-campervan-conversion-australia', title: 'Best Hiace for Campervan Conversion', category: 'Buyer Guide' },
]

export default function RelatedPosts({ currentSlug }: { currentSlug: string }) {
  const related = ALL_POSTS.filter(p => p.slug !== currentSlug).slice(0, 3)

  return (
    <div className="border-t border-gray-200 pt-10 mt-12">
      <h3 className="text-lg font-bold text-charcoal mb-4">Keep reading</h3>
      <div className="grid gap-4">
        {related.map(post => (
          <Link
            key={post.slug}
            href={`/blog/${post.slug}`}
            className="flex items-center gap-4 p-4 rounded-xl bg-white border border-gray-100 hover:border-ocean/30 hover:shadow-sm transition-all group"
          >
            <span className="text-xs font-semibold text-ocean bg-ocean/10 px-2 py-0.5 rounded-full shrink-0">
              {post.category}
            </span>
            <span className="text-sm font-medium text-charcoal group-hover:text-ocean transition-colors">
              {post.title}
            </span>
          </Link>
        ))}
      </div>
    </div>
  )
}
