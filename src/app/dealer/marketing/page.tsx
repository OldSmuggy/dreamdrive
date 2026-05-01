import ComingSoonClient from './ComingSoonClient'

export const metadata = { title: 'Marketing Materials' }

const ITEMS = [
  { icon: '📸', title: 'Vehicle photo packs', desc: 'High-res studio + lifestyle photos for every model & trim — ready for your website, socials and Carsales listings.' },
  { icon: '🎬', title: 'Video walkthroughs', desc: 'Polished 60-90 second video tours of Shell, Nest and MANA for use in ads, socials and showroom screens.' },
  { icon: '📋', title: 'Customer brochure (PDF)', desc: 'Co-branded PDF brochure with your dealership details, ready to email or print at point of enquiry.' },
  { icon: '📱', title: 'Social media templates', desc: 'Editable Canva templates for Instagram, Facebook and TikTok. Drop in your retail price and post.' },
  { icon: '💌', title: 'Email templates', desc: 'Welcome, follow-up and "still interested?" sequences for your CRM — proven copy from our team.' },
  { icon: '🚐', title: 'Showroom signage', desc: 'A-frame, banner and pull-up artwork files for your showroom and at events.' },
  { icon: '🔥', title: 'Co-funded ad campaigns', desc: 'Pre-built Google + Meta ad campaigns with creative, copy and audience setup. We co-fund qualifying spend.' },
]

export default function MarketingPage() {
  return <ComingSoonClient title="Marketing Materials" subtitle="Everything you need to sell your first ten units." resource="marketing" items={ITEMS} />
}
