import { generateMeta } from '@/lib/seo'

export const metadata = generateMeta({
  title: 'About Bare Camper — Handcrafted Campervans from Japan',
  description: 'Bare Camper builds premium campervans on the Toyota Hiace H200, handcrafted in Tokyo and delivered to Australia. Founded by Jared Campion in 2018.',
  url: '/about',
})

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-16">
        <h1 className="text-4xl text-charcoal mb-4">About Bare Camper</h1>
        <div className="prose prose-gray max-w-none space-y-4 text-gray-700">
          <p className="text-lg">
            Bare Camper is an Australian van-life company that sources premium Toyota HiAce H200 vans directly from Japanese auctions and dealers.
          </p>
          <p>
            We handle every step of the import process — bidding, payment, shipping, quarantine, compliance, and registration — so you can focus on planning your next adventure.
          </p>
          <p>
            Our in-house fit-out range (TAMA, MANA, KUMA) transforms your van into a fully functional camper, built to Australian standards with quality Australian materials.
          </p>
          <p>
            Based in Brisbane, Queensland. Contact us at{' '}
            <a href="mailto:hello@dreamdrive.life" className="text-ocean hover:underline">hello@dreamdrive.life</a>
          </p>
        </div>
      </div>
    </div>
  )
}
