'use client'

export default function WeeklyPicksButton() {
  return (
    <button
      type="button"
      onClick={async () => {
        if (!confirm('Send the weekly auction picks email to all stock alert subscribers?')) return
        const res = await fetch('/api/admin/weekly-picks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ preview: false }),
        })
        const data = await res.json()
        alert(data.ok ? `Sent! ${data.picks} vans to ${data.sent} subscribers` : data.message || 'No vans this week')
      }}
      className="flex items-center gap-2 px-4 py-2.5 bg-ocean text-white rounded-lg text-sm font-medium hover:bg-ocean/90 transition-colors"
    >
      <span>📧</span>
      <span>Send Weekly Picks</span>
    </button>
  )
}
