import ComingSoonClient from '../marketing/ComingSoonClient'

export const metadata = { title: 'Training Resources' }

const ITEMS = [
  { icon: '🎓', title: '2-hour sales team training (live)', desc: 'Live online session covering the range, value proposition, common objections and the booking flow.' },
  { icon: '📺', title: 'Showroom walkthrough videos', desc: 'Ten-minute video for each tier covering features, sell points and demo tips for your sales team.' },
  { icon: '📖', title: 'Dealer handbook (PDF)', desc: 'Single-source-of-truth document covering pricing, payment schedule, build process, warranty and after-sales.' },
  { icon: '❓', title: 'FAQ + objection handling guide', desc: 'The 30 most common buyer questions with proven answers — script-style.' },
  { icon: '🔧', title: 'Technical features guide', desc: 'Pop-top, electrical, water, fridge — what each tier includes and how to demo it on the floor.' },
  { icon: '📞', title: 'Monthly dealer call', desc: 'Group call with all founding dealers to share what&apos;s working and what isn&apos;t. We listen, we adjust.' },
]

export default function TrainingPage() {
  return <ComingSoonClient title="Training Resources" subtitle="So your sales team can sell with confidence from day one." resource="training" items={ITEMS} />
}
