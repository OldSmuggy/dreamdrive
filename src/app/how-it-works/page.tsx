export const metadata = { title: 'How It Works' }

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-16">
        <h1 className="text-4xl text-charcoal mb-4">How It Works</h1>
        <p className="text-gray-600 text-lg mb-8">
          We source premium Toyota HiAce H200 vans directly from Japan and handle every step of the import process for you.
        </p>
        <div className="space-y-6 text-gray-700">
          <div className="bg-white rounded-2xl p-6 border border-gray-200">
            <div className="text-2xl text-ocean mb-2">1. Choose Your Van</div>
            <p>Browse our curated selection of auction and dealer vans from Japan. Filter by year, mileage, size and grade score.</p>
          </div>
          <div className="bg-white rounded-2xl p-6 border border-gray-200">
            <div className="text-2xl text-ocean mb-2">2. Build Your Configuration</div>
            <p>Select your fit-out package, electrical system, and pop top. We'll give you a total landed cost estimate.</p>
          </div>
          <div className="bg-white rounded-2xl p-6 border border-gray-200">
            <div className="text-2xl text-ocean mb-2">3. Place a $500 Hold</div>
            <p>Secure your van with a refundable $500 deposit while we finalise the details and paperwork.</p>
          </div>
          <div className="bg-white rounded-2xl p-6 border border-gray-200">
            <div className="text-2xl text-ocean mb-2">4. We Handle the Import</div>
            <p>We manage bidding, payment, export documentation, RORO shipping, quarantine, compliance, and registration.</p>
          </div>
          <div className="bg-white rounded-2xl p-6 border border-gray-200">
            <div className="text-2xl text-ocean mb-2">5. Collect Your Van</div>
            <p>Your dream van arrives in Brisbane, compliant and registered, ready to drive away.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
