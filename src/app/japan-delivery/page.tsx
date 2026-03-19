export const metadata = { title: 'Japan Delivery' }

export default function JapanDeliveryPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-16">
        <h1 className="text-4xl text-charcoal mb-4">Japan Delivery</h1>
        <p className="text-gray-600 text-lg mb-8">
          Can't wait? We can deliver a van directly from Japan to your door — with all compliance and registration handled.
        </p>
        <div className="bg-white rounded-2xl p-8 border border-gray-200 text-center">
          <p className="text-gray-500 mb-4">Full details coming soon. Contact us to express interest.</p>
          <a href="mailto:hello@dreamdrive.life" className="btn-primary inline-block">Get in Touch →</a>
        </div>
      </div>
    </div>
  )
}
