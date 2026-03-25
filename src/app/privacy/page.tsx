import { generateMeta } from '@/lib/seo'
import Footer from '@/components/ui/Footer'
import type { Metadata } from 'next'

export const metadata: Metadata = generateMeta({
  title: 'Privacy Policy | Bare Camper',
  description: 'How Bare Camper collects, uses, and protects your personal information.',
  url: '/privacy',
})

export default function PrivacyPage() {
  return (
    <div className="min-h-screen">
      <div className="max-w-3xl mx-auto px-4 py-16">
        <h1 className="text-4xl font-bold text-charcoal mb-2">Privacy Policy</h1>
        <p className="text-gray-400 text-sm mb-10">Last updated: 25 March 2026</p>

        <div className="prose prose-gray max-w-none space-y-8">
          <section>
            <h2 className="text-2xl font-bold text-charcoal">Who we are</h2>
            <p className="text-gray-600 leading-relaxed">
              Bare Camper is a joint venture between Dream Drive (ABN to be confirmed) and DIY RV Solutions,
              operating from 1/10 Jones Road, Capalaba QLD 4157. When we say &ldquo;we&rdquo;, &ldquo;us&rdquo;,
              or &ldquo;our&rdquo; in this policy, we mean Bare Camper and its associated entities.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-charcoal">What we collect</h2>
            <p className="text-gray-600 leading-relaxed">We collect information you provide to us directly, including:</p>
            <ul className="text-gray-600 space-y-2 list-disc list-inside">
              <li><strong>Account information</strong> — name, email address, phone number when you create an account</li>
              <li><strong>Enquiry details</strong> — vehicle preferences, budget, build requirements when you submit a form or scout request</li>
              <li><strong>Payment information</strong> — processed securely through our payment provider. We do not store card details on our servers.</li>
              <li><strong>Communications</strong> — messages sent through our in-app chat or email</li>
              <li><strong>Usage data</strong> — pages visited, vans browsed, filters used. Collected via Google Analytics (GA4).</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-charcoal">How we use it</h2>
            <ul className="text-gray-600 space-y-2 list-disc list-inside">
              <li>To provide our services — sourcing vehicles, processing builds, managing your account</li>
              <li>To communicate with you — order updates, auction results, vehicle recommendations</li>
              <li>To notify you when vans matching your preferences become available</li>
              <li>To improve our website and services based on usage patterns</li>
              <li>To comply with Australian legal obligations</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-charcoal">Who we share it with</h2>
            <p className="text-gray-600 leading-relaxed">We may share your information with:</p>
            <ul className="text-gray-600 space-y-2 list-disc list-inside">
              <li><strong>Our buyer agents</strong> — Japan-based agents who source vehicles on your behalf. They receive only the information needed to find and bid on vehicles for you.</li>
              <li><strong>Service providers</strong> — Supabase (database), Resend (email), Vercel (hosting), Google Analytics (analytics). These providers process data on our behalf under their own privacy policies.</li>
              <li><strong>Compliance and shipping partners</strong> — when required to import and register your vehicle in Australia.</li>
            </ul>
            <p className="text-gray-600 leading-relaxed mt-3">
              We do not sell your personal information to third parties.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-charcoal">Cookies and analytics</h2>
            <p className="text-gray-600 leading-relaxed">
              We use Google Analytics 4 to understand how visitors use our site. This collects anonymised usage data
              including pages visited, time on site, and device information. No personally identifiable information
              is shared with Google. You can opt out of Google Analytics by installing the
              <a href="https://tools.google.com/dlpage/gaoptout" className="text-ocean hover:underline" target="_blank" rel="noopener noreferrer"> Google Analytics opt-out browser add-on</a>.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-charcoal">Data security</h2>
            <p className="text-gray-600 leading-relaxed">
              We take reasonable steps to protect your personal information from misuse, loss, unauthorised access,
              and disclosure. Our website uses HTTPS encryption. Account data is stored securely in our database
              with role-based access controls. However, no method of transmission over the internet is 100% secure.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-charcoal">Your rights</h2>
            <p className="text-gray-600 leading-relaxed">Under the Australian Privacy Act 1988, you have the right to:</p>
            <ul className="text-gray-600 space-y-2 list-disc list-inside">
              <li>Access the personal information we hold about you</li>
              <li>Request correction of inaccurate information</li>
              <li>Request deletion of your account and associated data</li>
              <li>Opt out of marketing communications at any time</li>
            </ul>
            <p className="text-gray-600 leading-relaxed mt-3">
              To exercise any of these rights, email us at{' '}
              <a href="mailto:hello@barecamper.com.au" className="text-ocean hover:underline">hello@barecamper.com.au</a>.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-charcoal">Changes to this policy</h2>
            <p className="text-gray-600 leading-relaxed">
              We may update this policy from time to time. We&apos;ll notify you of significant changes by email
              or by posting a notice on our website. Your continued use of Bare Camper after changes constitutes
              acceptance of the updated policy.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-charcoal">Contact us</h2>
            <p className="text-gray-600 leading-relaxed">
              If you have questions about this privacy policy or how we handle your data:<br />
              <strong>Email:</strong>{' '}
              <a href="mailto:hello@barecamper.com.au" className="text-ocean hover:underline">hello@barecamper.com.au</a><br />
              <strong>Phone:</strong> 0432 182 892<br />
              <strong>Address:</strong> 1/10 Jones Road, Capalaba QLD 4157
            </p>
          </section>
        </div>
      </div>
      <Footer />
    </div>
  )
}
