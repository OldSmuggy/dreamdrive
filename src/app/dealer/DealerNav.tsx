'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV_ITEMS = [
  { href: '/dealer',                label: '📊 Dashboard' },
  { href: '/dealer/orders',         label: '📦 My Orders' },
  { href: '/dealer/orders/new',     label: '➕ Place New Order' },
  { href: '/dealer/funds',          label: '💰 Funds Held' },
  { href: '/dealer/marketing',      label: '📣 Marketing Materials' },
  { href: '/dealer/training',       label: '🎓 Training Resources' },
  { href: '/dealer/account',        label: '⚙️ Account' },
]

export default function DealerNav({ companyName, territory }: { companyName: string | null; territory: string | null }) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  const isActive = (href: string) => {
    if (pathname === href) return true
    if (href !== '/dealer' && pathname.startsWith(href)) return true
    return false
  }

  const navContent = (
    <>
      <div className="px-5 py-6 border-b border-white/10">
        <Link href="/" className="text-sand text-lg" onClick={() => setOpen(false)}>
          Bare Camper
        </Link>
        <p className="text-white/50 text-xs mt-0.5">Dealer Portal</p>
        {companyName && <p className="text-white/80 text-sm font-medium mt-2 truncate">{companyName}</p>}
        {territory && <p className="text-white/40 text-xs">{territory}</p>}
      </div>
      <div className="flex-1 py-4 px-3 overflow-y-auto">
        <div className="space-y-0.5">
          {NAV_ITEMS.map(n => (
            <Link
              key={n.href}
              href={n.href}
              onClick={() => setOpen(false)}
              className={`block px-3 py-2 rounded-lg text-sm transition-colors ${
                isActive(n.href)
                  ? 'bg-white/15 text-white font-semibold'
                  : 'text-white/80 hover:bg-white/10 hover:text-white'
              }`}
            >
              {n.label}
            </Link>
          ))}
        </div>
      </div>
      <div className="px-5 py-4 border-t border-white/10">
        <Link href="/" className="text-white/50 text-xs hover:text-white" onClick={() => setOpen(false)}>
          ← Back to site
        </Link>
      </div>
    </>
  )

  return (
    <>
      <button
        className="md:hidden fixed top-4 left-4 z-50 bg-charcoal text-white p-2.5 rounded-lg shadow-lg"
        onClick={() => setOpen(v => !v)}
        aria-label="Toggle menu"
      >
        <span className="block w-5 h-0.5 bg-white mb-1" />
        <span className="block w-5 h-0.5 bg-white mb-1" />
        <span className="block w-5 h-0.5 bg-white" />
      </button>

      {open && <div className="md:hidden fixed inset-0 bg-black/50 z-40" onClick={() => setOpen(false)} />}

      <nav
        className={`
          fixed md:static top-0 left-0 h-full z-40 w-56 bg-charcoal text-white flex flex-col shrink-0
          transform transition-transform duration-200 ease-in-out
          ${open ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
      >
        {navContent}
      </nav>
    </>
  )
}
