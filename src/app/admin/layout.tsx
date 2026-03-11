import Link from 'next/link'

export const metadata = { title: { template: '%s | Admin — Dream Drive', default: 'Admin' } }

const NAV = [
  { href: '/admin/products',  label: '💰 Products & Pricing' },
  { href: '/admin/listings',  label: '🚐 Listings' },
  { href: '/admin/import',    label: '📥 Import from NINJA' },
  { href: '/admin/leads',     label: '📋 Leads' },
  { href: '/admin/settings',  label: '⚙️ Settings' },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <nav className="w-56 bg-forest-950 text-white shrink-0 flex flex-col">
        <div className="px-5 py-6 border-b border-white/10">
          <Link href="/" className="text-sand-400 font-display text-lg">Dream Drive</Link>
          <p className="text-white/50 text-xs mt-0.5">Admin</p>
        </div>
        <div className="flex-1 py-4 space-y-1 px-3">
          {NAV.map(n => (
            <Link key={n.href} href={n.href}
              className="block px-3 py-2.5 rounded-lg text-sm text-white/80 hover:bg-white/10 hover:text-white transition-colors">
              {n.label}
            </Link>
          ))}
        </div>
        <div className="px-5 py-4 border-t border-white/10">
          <Link href="/" className="text-white/50 text-xs hover:text-white">← Back to site</Link>
        </div>
      </nav>

      {/* Main */}
      <main className="flex-1 bg-gray-50 overflow-auto">
        <div className="max-w-5xl mx-auto px-6 py-8">{children}</div>
      </main>
    </div>
  )
}
