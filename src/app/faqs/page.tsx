export const metadata = { title: 'FAQs' }

const FAQS = [
  { q: 'How long does the import process take?', a: 'Typically 8–12 weeks from auction win to Australian delivery. This includes shipping (4–5 weeks), quarantine (1 week), compliance (1–2 weeks), and registration.' },
  { q: 'What is the $500 deposit for?', a: 'The $500 hold is fully refundable and secures your chosen van while we finalise paperwork and financing. It goes towards your final purchase price.' },
  { q: 'What does compliance cost?', a: 'Compliance typically costs around $2,200 and includes a roadworthy inspection, any required modifications, and an Australian compliance plate.' },
  { q: 'Can I inspect the van before buying?', a: 'Japanese auction vans come with a graded inspection sheet (grade 3–5). We can also arrange independent inspections at the auction yard for a fee.' },
  { q: 'Do you handle registration?', a: 'Yes — we handle Queensland registration as part of our standard service. Interstate rego can be arranged at additional cost.' },
  { q: 'What warranty is included?', a: 'Imported vehicles don\'t come with manufacturer warranty. We provide a 1-month warranty on compliance work and all Dream Drive fit-outs come with a 12-month warranty.' },
]

export default function FaqsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-16">
        <h1 className="text-4xl text-charcoal mb-10">Frequently Asked Questions</h1>
        <div className="space-y-4">
          {FAQS.map((faq, i) => (
            <div key={i} className="bg-white border border-gray-200 rounded-2xl p-6">
              <h2 className="font-semibold text-gray-900 mb-2">{faq.q}</h2>
              <p className="text-gray-600 text-sm leading-relaxed">{faq.a}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
