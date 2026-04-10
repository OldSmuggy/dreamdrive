import { generateMeta } from '@/lib/seo'
import type { Metadata } from 'next'

export const metadata: Metadata = generateMeta({
  title: 'Terms of Service | Bare Camper',
  description: 'Terms and conditions for using Bare Camper services.',
  url: '/terms',
})

export default function TermsPage() {
  return (
    <div className="min-h-screen">
      <div className="max-w-3xl mx-auto px-4 py-16">
        <h1 className="text-4xl font-bold text-charcoal mb-2">Terms of Service</h1>
        <p className="text-gray-400 text-sm mb-10">Last updated: 25 March 2026</p>

        <div className="prose prose-gray max-w-none space-y-8">
          <section>
            <h2 className="text-2xl font-bold text-charcoal">About these terms</h2>
            <p className="text-gray-600 leading-relaxed">
              These terms govern your use of barecamper.com.au and the services provided by Bare Camper,
              a joint venture between Dream Drive and DIY RV Solutions. By using our website or services,
              you agree to these terms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-charcoal">Our services</h2>
            <p className="text-gray-600 leading-relaxed">Bare Camper provides:</p>
            <ul className="text-gray-600 space-y-2 list-disc list-inside">
              <li><strong>Vehicle sourcing</strong> — importing Toyota Hiace vans from Japanese auctions and dealers, and sourcing locally in Australia</li>
              <li><strong>Fiberglass roof conversions</strong> — pop top and hi-top roof installations</li>
              <li><strong>Campervan fit-outs</strong> — full interior conversions (TAMA, MANA)</li>
              <li><strong>Parts and accessories</strong> — electrical systems, solar, insulation, and other campervan components</li>
              <li><strong>Buyer agent services</strong> — on-the-ground agents in Japan who inspect and bid on vehicles on your behalf</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-charcoal">Accounts</h2>
            <p className="text-gray-600 leading-relaxed">
              You may need to create an account to access certain features. You are responsible for maintaining
              the security of your account credentials and for all activities that occur under your account.
              You must provide accurate and complete information when creating your account.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-charcoal">Vehicle imports</h2>
            <ul className="text-gray-600 space-y-3 list-disc list-inside">
              <li>
                <strong>Auction vehicles</strong> — vehicles purchased at auction are sold as-is based on the
                auction grade and condition report. While our agents inspect vehicles where possible, auction
                purchases carry inherent risk. We will communicate the condition honestly and transparently.
              </li>
              <li>
                <strong>Pricing</strong> — vehicle prices shown on the website are estimates based on current
                exchange rates and typical costs. Final pricing is confirmed at the time of purchase and may
                vary due to exchange rate fluctuations, auction results, shipping costs, and compliance requirements.
              </li>
              <li>
                <strong>Timeframes</strong> — import timeframes are estimates only. Shipping, customs, and
                compliance processes can be affected by factors outside our control. We will keep you updated
                on progress throughout.
              </li>
              <li>
                <strong>Compliance</strong> — all imported vehicles undergo Australian compliance (RAWS) to
                meet Australian Design Rules. This is a legal requirement and is included in our import service.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-charcoal">Deposits and payments</h2>
            <ul className="text-gray-600 space-y-3 list-disc list-inside">
              <li>
                <strong>Deposit amounts</strong> — a deposit is required to secure a vehicle or book a build slot.
                Deposit amounts vary by service ($2,750–$5,000 AUD).
              </li>
              <li>
                <strong>Refund policy</strong> — deposits for auction vehicles are refundable if the auction is
                not won. Once a vehicle has been purchased on your behalf, the deposit is non-refundable as costs
                have been incurred. Deposits for roof conversions and fit-outs are refundable up until work
                commences on your vehicle.
              </li>
              <li>
                <strong>Payment terms</strong> — full payment is required before vehicle delivery or collection.
                Invoices are issued via Xero and payment can be made by bank transfer or card.
              </li>
              <li>
                <strong>Currency</strong> — all prices on the website are in Australian Dollars (AUD) unless
                otherwise stated. Japanese Yen (JPY) prices are shown for reference and converted at the
                current exchange rate.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-charcoal">Roof conversions and fit-outs</h2>
            <ul className="text-gray-600 space-y-3 list-disc list-inside">
              <li>
                <strong>Warranty</strong> — fiberglass roof conversions come with a structural warranty.
                Specific warranty terms will be provided at the time of booking.
              </li>
              <li>
                <strong>Turnaround</strong> — estimated turnaround times (e.g. 10 business days for roof
                conversions) are estimates and may vary depending on workshop scheduling and parts availability.
              </li>
              <li>
                <strong>Scope of work</strong> — the scope of any conversion or fit-out will be agreed in
                writing before work begins. Changes to scope may affect pricing and timeframes.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-charcoal">Australian Consumer Law</h2>
            <p className="text-gray-600 leading-relaxed">
              Our services come with guarantees that cannot be excluded under the Australian Consumer Law.
              You are entitled to a replacement or refund for a major failure and compensation for any other
              reasonably foreseeable loss or damage. You are also entitled to have goods repaired or replaced
              if goods fail to be of acceptable quality and the failure does not amount to a major failure.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-charcoal">Limitation of liability</h2>
            <p className="text-gray-600 leading-relaxed">
              To the maximum extent permitted by law, Bare Camper&apos;s liability for any claim arising from
              our services is limited to the amount you paid for the specific service giving rise to the claim.
              We are not liable for indirect or consequential losses, including loss of profit, loss of use,
              or loss of opportunity, except where such liability cannot be excluded under Australian law.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-charcoal">Website use</h2>
            <ul className="text-gray-600 space-y-2 list-disc list-inside">
              <li>Vehicle listings are for information purposes and do not constitute an offer to sell</li>
              <li>Photos may include images from auction houses and may not reflect the vehicle&apos;s current condition</li>
              <li>We reserve the right to remove or modify listings at any time</li>
              <li>You must not use automated tools to scrape or copy content from our website</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-charcoal">Disputes</h2>
            <p className="text-gray-600 leading-relaxed">
              If you have a complaint or dispute, please contact us first at{' '}
              <a href="mailto:hello@barecamper.com.au" className="text-ocean hover:underline">hello@barecamper.com.au</a>.
              We will work with you to resolve the issue. If we cannot reach a resolution, either party may
              pursue remedies available under Australian law. These terms are governed by the laws of Queensland, Australia.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-charcoal">Changes to these terms</h2>
            <p className="text-gray-600 leading-relaxed">
              We may update these terms from time to time. We&apos;ll notify you of significant changes.
              Continued use of our services after changes constitutes acceptance of the updated terms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-charcoal">Contact us</h2>
            <p className="text-gray-600 leading-relaxed">
              <strong>Email:</strong>{' '}
              <a href="mailto:hello@barecamper.com.au" className="text-ocean hover:underline">hello@barecamper.com.au</a><br />
              <strong>Phone:</strong> 0432 182 892<br />
              <strong>Address:</strong> 1/10 Jones Road, Capalaba QLD 4157
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
