interface Props {
  videoUrl?: string | null
  /** Show the full LWB vs SLWB spec comparison (default true) */
  showSpecs?: boolean
}

function extractVideoEmbed(url: string): string | null {
  try {
    const u = new URL(url)
    // YouTube — youtube.com/watch?v=ID  or  youtu.be/ID
    if (u.hostname.includes('youtube.com')) {
      const id = u.searchParams.get('v')
      return id ? `https://www.youtube.com/embed/${id}` : null
    }
    if (u.hostname === 'youtu.be') {
      const id = u.pathname.slice(1)
      return id ? `https://www.youtube.com/embed/${id}` : null
    }
    // Vimeo — vimeo.com/ID
    if (u.hostname.includes('vimeo.com')) {
      const id = u.pathname.split('/').filter(Boolean)[0]
      return id ? `https://player.vimeo.com/video/${id}` : null
    }
  } catch {
    // fall through
  }
  return null
}

const LWB_SPECS = [
  'Internal space: 1.2m wide × 2.45m long',
  'Standing height added: ~600mm',
  'Canvas: Choice of 3 or 4 window heavy-duty canvas',
  'Mechanism: Spring-assisted scissor lifts with gas struts',
  'Canvas material: Dynaproofed outback rugged canvas',
  'YKK zippers with fine gauge fly screens',
  'Fully insulated roof section with internal headlining',
]

const SLWB_SPECS = [
  'Larger canvas area for extra sleeping space',
  'Uses Universal Large fitment mould',
  'Gas-strut assisted — effortless one-hand lifting',
  'Canvas: Choice of 3 or 4 window heavy-duty canvas',
  'Canvas material: Dynaproofed outback rugged canvas',
  'YKK zippers with fine gauge fly screens',
  'Fully insulated roof section with internal headlining',
]

export default function ConversionDetails({ videoUrl, showSpecs = true }: Props) {
  const embedUrl = videoUrl ? extractVideoEmbed(videoUrl) : null

  return (
    <div className="bg-cream rounded-2xl p-6 md:p-8">
      <h2 className="text-2xl text-charcoal mb-2">Pop Top Conversion Details</h2>
      <p className="text-gray-500 text-sm mb-6">
        Dream Drive pop tops are fibreglass conversions that add ~600mm of standing height to your HiAce.
        They fold flat when driving and raise in seconds.
      </p>

      {showSpecs && (
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          {/* LWB */}
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <span className="bg-ocean text-white text-xs font-bold px-2 py-0.5 rounded">LWB</span>
              <span className="font-semibold text-gray-800 text-sm">H200 Long Wheelbase</span>
            </div>
            <ul className="space-y-2">
              {LWB_SPECS.map((s, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                  <span className="text-ocean mt-0.5 shrink-0">✓</span>
                  {s}
                </li>
              ))}
            </ul>
          </div>

          {/* SLWB */}
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <span className="bg-charcoal text-white text-xs font-bold px-2 py-0.5 rounded">SLWB</span>
              <span className="font-semibold text-gray-800 text-sm">Super Long Wheelbase H200</span>
            </div>
            <ul className="space-y-2">
              {SLWB_SPECS.map((s, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                  <span className="text-ocean mt-0.5 shrink-0">✓</span>
                  {s}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Video embed */}
      {embedUrl && (
        <div>
          <p className="text-sm font-semibold text-gray-700 mb-2">Watch: Pop Top in Action</p>
          <div className="relative rounded-xl overflow-hidden" style={{ paddingTop: '56.25%' }}>
            <iframe
              src={embedUrl}
              title="Pop Top Conversion"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="absolute inset-0 w-full h-full"
            />
          </div>
        </div>
      )}
    </div>
  )
}
