import Image from 'next/image'
import Link from 'next/link'
import type { InspirationBlock as InspirationData } from '@/types'

interface Props {
  inspiration: InspirationData | null
}

export default function InspirationBlock({ inspiration }: Props) {
  if (!inspiration) return null

  return (
    <div className="mt-10 bg-cream rounded-2xl p-6">
      <h2 className="text-xl text-charcoal mb-2">{inspiration.title}</h2>
      <p className="text-gray-600 text-sm leading-relaxed mb-4">{inspiration.description}</p>

      {inspiration.images.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
          {inspiration.images.slice(0, 2).map((img, i) => (
            <div key={i} className="relative h-48 rounded-xl overflow-hidden">
              <Image
                src={img}
                alt={`Finished build example ${i + 1}`}
                fill
                className="object-cover"
                sizes="(max-width: 640px) 100vw, 50vw"
              />
            </div>
          ))}
        </div>
      )}

      {inspiration.link && (
        <Link
          href={inspiration.link}
          className="text-ocean font-semibold text-sm hover:underline"
        >
          {inspiration.link_text || 'See the build →'}
        </Link>
      )}
    </div>
  )
}
