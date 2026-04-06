import Link from 'next/link'

const FOOTER_LINKS = {
  'Buy a Van': [
    { label: 'Browse All Vans', href: '/browse' },
    { label: 'H200 LWB', href: '/browse?model=hiace_h200&size=LWB' },
    { label: 'H200 SLWB', href: '/browse?model=hiace_h200&size=SLWB' },
    { label: '300 Series LWB', href: '/browse?model=hiace_300&size=LWB', soon: true },
    { label: '300 Series SLWB', href: '/browse?model=hiace_300&size=SLWB', soon: true },
    { label: 'How Importing Works', href: '/how-it-works' },
    { label: 'Tip a Van — Earn $200', href: '/tip-a-van' },
  ],
  'Conversions': [
    { label: 'Roof Conversions', href: '/pop-top' },
    { label: 'Full Build — TAMA', href: '/tama' },
    { label: 'Full Build — KUMA-Q', href: '/kuma-q' },
    { label: 'Full Build — MANA', href: '/mana' },
    { label: 'DIY Kits & Parts', href: '/diy' },
  ],
  'Pricing & Finance': [
    { label: 'Pricing Overview', href: '/import-costs' },
    { label: 'Finance Options', href: '/finance' },
  ],
  'Learn': [
    { label: 'About Bare Camper', href: '/about' },
    { label: 'Why Bare Camper', href: '/why-bare-camper' },
    { label: 'How It Works', href: '/how-it-works' },
    { label: 'FAQ', href: '/faqs' },
    { label: 'Blog', href: '/blog' },
  ],
}

export default function Footer() {
  return (
    <footer className="bg-charcoal text-white">
      {/* Sitemap columns */}
      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 lg:gap-12">
          {/* Link columns */}
          {Object.entries(FOOTER_LINKS).map(([heading, links]) => (
            <div key={heading}>
              <p className="text-xs font-bold text-white/40 uppercase tracking-widest mb-4">{heading}</p>
              <ul className="space-y-2.5">
                {links.map(link => (
                  <li key={link.href}>
                    <Link href={link.href} className="text-sm text-white/60 hover:text-white transition-colors">
                      {link.label}
                      {'soon' in link && link.soon && (
                        <span className="ml-1.5 text-[10px] text-sand/60 font-semibold uppercase">Soon</span>
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Contact column */}
          <div>
            <p className="text-xs font-bold text-white/40 uppercase tracking-widest mb-4">Contact</p>
            <ul className="space-y-2.5 text-sm text-white/60">
              <li>
                <a href="https://wa.me/61432182892" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                  Book a Free Chat
                </a>
              </li>
              <li>
                <a href="mailto:hello@barecamper.com.au" className="hover:text-white transition-colors">
                  hello@barecamper.com.au
                </a>
              </li>
              <li>
                <a href="tel:0432182892" className="hover:text-white transition-colors">
                  0432 182 892
                </a>
              </li>
              <li className="pt-1 text-white/40">
                1/10 Jones Road<br />
                Capalaba QLD 4157
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            {/* Logo + partnership */}
            <div className="flex items-center gap-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/barecamper-logo-dark-400.png" alt="Bare Camper" className="h-6 w-auto invert opacity-40" />
              <span className="text-xs text-white/30">
                A joint venture — <span className="text-white/50">Dream Drive</span> x <span className="text-white/50">DIY RV Solutions</span>
              </span>
            </div>

            {/* Trust badges */}
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-white px-2 py-1 rounded" style={{ background: '#EB0A1E' }}>
                Toyota Partner — Japan
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-white/10 text-white/60 px-2 py-1 rounded">
                JRVA Member
              </span>
            </div>

            {/* Legal */}
            <div className="flex items-center gap-4 text-xs text-white/30">
              <Link href="/privacy" className="hover:text-white/60 transition-colors">Privacy</Link>
              <Link href="/terms" className="hover:text-white/60 transition-colors">Terms</Link>
              <span>ABN 13 030 224 315</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
