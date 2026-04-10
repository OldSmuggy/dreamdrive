import { generateMeta } from '@/lib/seo'
import Footer from '@/components/ui/Footer'
import type { Metadata } from 'next'

export const metadata: Metadata = generateMeta({
  title: 'Privacy Policy | Bare Camper',
  description: 'Privacy Policy for Bare Camper — how we collect, use, and protect your personal information.',
  url: '/privacy',
})

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white">
      <section className="bg-charcoal text-white py-16 px-4">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl font-bold mb-3">Privacy Policy</h1>
          <p className="text-white/60 text-sm">Last updated: April 2025</p>
        </div>
      </section>

      <section className="py-16 px-4">
        <div className="max-w-3xl mx-auto prose prose-gray prose-headings:text-charcoal prose-a:text-ocean">

          <p>
            Bare Camper is operated by DIY RV Solutions Pty Ltd (ABN 13 030 224 315) in
            partnership with Dream Drive. This Privacy Policy explains how we collect, use,
            disclose, and protect your personal information in accordance with the{' '}
            <em>Privacy Act 1988</em> (Cth) and the Australian Privacy Principles (APPs).
          </p>

          <h2>1. Information we collect</h2>
          <p>We may collect the following types of personal information:</p>
          <ul>
            <li>Name, email address, and phone number (when you register or enquire)</li>
            <li>Vehicle preferences and watchlist activity</li>
            <li>Payment information (processed securely via Stripe — we do not store card details)</li>
            <li>IP address and browser/device information (via analytics tools)</li>
            <li>Any information you provide when contacting us</li>
          </ul>

          <h2>2. How we use your information</h2>
          <p>We use your personal information to:</p>
          <ul>
            <li>Process enquiries, expressions of interest, and deposits</li>
            <li>Send you vehicle alerts and updates you have opted into</li>
            <li>Communicate with you about listings, builds, and your order</li>
            <li>Improve our website and services</li>
            <li>Comply with legal obligations</li>
          </ul>

          <h2>3. Disclosure to third parties</h2>
          <p>
            We do not sell your personal information. We may share it with trusted third parties
            who assist us in operating the website and conducting our business, including:
          </p>
          <ul>
            <li>Supabase (database and authentication hosting)</li>
            <li>Resend (transactional email delivery)</li>
            <li>Stripe (payment processing)</li>
            <li>Vercel (website hosting)</li>
            <li>Google Analytics (website analytics — anonymised)</li>
          </ul>
          <p>
            These providers are bound by their own privacy policies and are required to handle
            your information securely.
          </p>

          <h2>4. Data security</h2>
          <p>
            We take reasonable steps to protect your personal information from misuse,
            interference, loss, and unauthorised access. Our platform uses HTTPS encryption,
            and access to personal data is restricted to authorised staff only.
          </p>

          <h2>5. Access and correction</h2>
          <p>
            You may request access to, or correction of, the personal information we hold about
            you at any time by contacting us at{' '}
            <a href="mailto:hello@barecamper.com.au">hello@barecamper.com.au</a>. We will respond
            within a reasonable timeframe.
          </p>

          <h2>6. Cookies and analytics</h2>
          <p>
            Our website uses cookies and Google Analytics to understand how visitors use the site.
            Analytics data is anonymised and aggregated. You can disable cookies in your browser
            settings, though this may affect site functionality.
          </p>

          <h2>7. Contact us</h2>
          <p>
            For privacy-related enquiries or complaints, please contact us:
          </p>
          <ul>
            <li>Email: <a href="mailto:hello@barecamper.com.au">hello@barecamper.com.au</a></li>
            <li>Phone: <a href="tel:0432182892">0432 182 892</a></li>
            <li>Address: 1/10 Jones Road, Capalaba QLD 4157, Australia</li>
            <li>ABN: 13 030 224 315</li>
          </ul>
          <p>
            If you are not satisfied with our response, you may contact the Office of the
            Australian Information Commissioner (OAIC) at{' '}
            <a href="https://www.oaic.gov.au" target="_blank" rel="noopener noreferrer">
              www.oaic.gov.au
            </a>.
          </p>
        </div>
      </section>

      <Footer />
    </div>
  )
}
