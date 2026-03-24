'use client'

import { useState } from 'react'
import Image from 'next/image'
import LeadFormModal from '@/components/leads/LeadFormModal'

export interface Option {
  name: string
  detail: string | null
  price: string
  image: string | null
  description?: string
}

export const UNIVERSAL_OPTIONS: Option[] = [
  {
    name: 'Recommended Package',
    detail: 'Black-out curtains, insect screens, insect net rear door, side-window rain cover, MAXXFAN',
    price: '$3,800',
    image: '/images/products/curtains.jpg',
    description: 'Everything you need for comfortable overnight stays. Block out light for sleep-ins, keep the bugs out while you enjoy the breeze, and the MAXXFAN keeps air flowing even in the rain. This is our most popular add-on — most customers add it because once you camp without it, you wish you had it.',
  },
  {
    name: 'Starter Pack — 12V Electrical',
    detail: '200AH lithium battery, solar-ready, 12V system. No shore power needed.',
    price: '$5,000',
    image: null,
    description: 'A self-contained 12V power system that doesn\'t need to be plugged in. 200AH lithium iron phosphate battery gives you enough juice for lights, fridge, phone charging, and a fan for days without needing shore power. Pre-wired for solar — just add panels when you\'re ready. No electrician needed for the install, and the battery is safely mounted without the need for an enclosure.',
  },
  {
    name: 'Off-Grid Pro — Power Boss',
    detail: 'Full electrical system, professionally installed by electrician.',
    price: 'Get a Quote',
    image: null,
    description: 'The full deal. A complete 240V + 12V electrical system designed and installed by a licensed electrician. Includes shore power, inverter, battery management system, and everything wired to Australian standards. This is for people who want to run a coffee machine, hair dryer, or power tools from their van. Price depends on your setup — get in touch and we\'ll spec it out.',
  },
  {
    name: 'Solar Package',
    detail: 'Solar system 175W',
    price: '$2,000',
    image: '/images/products/solar-panel.jpg',
    description: '175W solar panel mounted flush on the roof, wired to a Renogy MPPT charge controller. Keeps your battery topped up while you\'re parked — even on overcast days you\'ll get a solid charge. Combined with the Starter Pack, this gives you genuine off-grid capability for weeks at a time.',
  },
  {
    name: 'FF Heater Package',
    detail: 'Thermal wool insulation + Webasto FF heater',
    price: '$5,500',
    image: '/images/products/heater.jpg',
    description: 'Stay warm anywhere in Australia. Includes full thermal wool insulation throughout the van walls and ceiling, plus a Webasto diesel-fired heater that runs off your fuel tank. Uses minimal fuel (about 0.1L/hour) and keeps the van toasty even in sub-zero conditions. Essential for winter touring in Tasmania, the High Country, or anywhere south of Sydney.',
  },
  {
    name: 'Side Awning',
    detail: 'Fiamma 3.5M',
    price: '$2,300',
    image: '/images/products/awning.jpg',
    description: 'Fiamma F45s 3.5 metre awning. Mounts to the side of the van and rolls out in seconds to give you shade or rain cover. Makes a huge difference to your living space — doubles your usable area when parked up. Wind-out operation, no poles needed.',
  },
  {
    name: 'Off-Road Tires',
    detail: null,
    price: '$2,300',
    image: '/images/products/offroad-wheels.jpg',
    description: 'Steel wheels with all-terrain tyres. Gives you the grip and ground clearance to get off the highway and onto dirt roads, fire trails, and beach tracks. A must-have if you plan on exploring beyond the bitumen.',
  },
  {
    name: 'Half Wrap',
    detail: null,
    price: '$3,300',
    image: '/images/products/half-wrap.jpg',
    description: 'Professional vinyl wrap covering the lower half of your van. Protects the paintwork from stone chips and scratches, and completely transforms the look. Choose from our range of colours or go custom. Easily removable if you ever want to go back to stock.',
  },
]

export default function OptionsList({ options = UNIVERSAL_OPTIONS, source = 'options_list' }: { options?: Option[]; source?: string }) {
  const [expanded, setExpanded] = useState<string | null>(null)

  return (
    <div className="divide-y divide-gray-100 border border-gray-200 rounded-2xl overflow-hidden">
      {options.map(opt => {
        const isOpen = expanded === opt.name
        const hasMore = !!opt.description

        return (
          <div key={opt.name}>
            <button
              onClick={() => hasMore && setExpanded(isOpen ? null : opt.name)}
              className={`w-full flex items-center gap-4 px-6 py-5 hover:bg-cream transition-colors text-left ${hasMore ? 'cursor-pointer' : 'cursor-default'}`}
            >
              {opt.image && (
                <div className="relative w-16 h-16 rounded-lg overflow-hidden shrink-0">
                  <Image src={opt.image} alt={opt.name} fill className="object-cover" sizes="64px" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-charcoal text-sm">{opt.name}</p>
                {opt.detail && <p className="text-gray-500 text-xs mt-0.5">{opt.detail}</p>}
              </div>
              <p className="text-ocean text-lg shrink-0 mr-2">{opt.price}</p>
              {hasMore && (
                <svg className={`w-5 h-5 text-gray-400 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              )}
            </button>

            {isOpen && opt.description && (
              <div className="px-6 pb-6 pt-0">
                <div className="bg-cream rounded-xl p-6">
                  <p className="text-gray-600 text-sm leading-relaxed mb-4">{opt.description}</p>
                  {opt.price === 'Get a Quote' ? (
                    <LeadFormModal
                      trigger="Get a Quote"
                      source={`${source}_${opt.name.toLowerCase().replace(/\s+/g, '_')}`}
                      className="btn-primary inline-block px-5 py-2.5 text-sm"
                    />
                  ) : (
                    <LeadFormModal
                      trigger={`Enquire About ${opt.name}`}
                      source={`${source}_${opt.name.toLowerCase().replace(/\s+/g, '_')}`}
                      className="btn-primary inline-block px-5 py-2.5 text-sm"
                    />
                  )}
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
