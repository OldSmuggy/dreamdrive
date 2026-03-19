'use client'
import { useState } from 'react'
import Link from 'next/link'

const QUESTIONS = [
  {
    id: 'budget',
    q: "What's your total all-in budget?",
    options: ['Under $80k', '$80k–$120k', '$120k–$160k', '$160k+'],
  },
  {
    id: 'travel',
    q: 'How long will you travel?',
    options: ['Weekend trips', '2–4 weeks at a time', 'Long trips / months', 'Full-time'],
  },
  {
    id: 'people',
    q: 'How many people sleep in the van?',
    options: ['1–2 (couple / solo)', '3–4 (small family)', '5–6 (bigger group)', 'Flexible'],
  },
  {
    id: 'engine',
    q: 'Diesel or petrol?',
    options: ['Diesel (2.8L) — better economy', 'Petrol (2.7L) — simpler maintenance', "Either / don't mind"],
  },
  {
    id: 'drive',
    q: '2WD or 4WD?',
    options: ['2WD — roads and light gravel', '4WD — proper off-road capability'],
  },
  {
    id: 'poptop',
    q: 'Do you want a pop top roof?',
    options: ['Yes — love the idea', 'Not sure', 'No — keep it standard'],
  },
  {
    id: 'diy',
    q: 'How hands-on with electrical & plumbing?',
    options: ['Not at all — want it done', 'Happy to add bits myself', 'Comfortable DIYing most of it'],
  },
  {
    id: 'timeline',
    q: 'When do you want to be on the road?',
    options: ['ASAP — ready to go', '1–3 months', '3–6 months', '6+ months, no rush'],
  },
]

export default function QuizPage() {
  const [current, setCurrent] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [done, setDone]       = useState(false)

  const q = QUESTIONS[current]
  const progress = Math.round((current / QUESTIONS.length) * 100)

  function answer(val: string) {
    const next = { ...answers, [q.id]: val }
    setAnswers(next)
    if (current + 1 < QUESTIONS.length) setCurrent(c => c + 1)
    else setDone(true)
  }

  function buildRecommendation() {
    const fitout   = answers.people?.includes('1–2') || answers.people?.includes('Flexible') ? 'MANA' : 'TAMA'
    const poptop   = answers.poptop?.startsWith('Yes')
    const drive    = answers.drive?.startsWith('4WD') ? '4WD' : '2WD'
    const src      = answers.timeline?.startsWith('ASAP') ? 'au_stock' : answers.timeline?.startsWith('1–3') ? 'dealer' : 'auction'
    return { fitout, poptop, drive, src }
  }

  if (done) {
    const rec = buildRecommendation()
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-lg w-full bg-white rounded-3xl shadow-lg p-8 text-center">
          <div className="text-5xl mb-4">🎉</div>
          <h2 className="text-3xl text-charcoal mb-2">Your Dream Build</h2>
          <p className="text-gray-500 mb-6">Based on your answers, here's what we'd recommend:</p>

          <div className="bg-cream rounded-2xl p-5 mb-6 text-left space-y-3">
            <Rec label="Fit-Out" value={rec.fitout === 'MANA' ? 'MANA — liveable 2-person adventure build' : 'TAMA — 6-seat family-friendly conversion'} />
            {rec.poptop && <Rec label="Roof" value="Pop Top conversion — adds 600mm height" />}
            <Rec label="Drive" value={rec.drive} />
            <Rec label="Source" value={rec.src === 'au_stock' ? 'AU Stock — available now' : rec.src === 'dealer' ? 'Japan Dealer — buy now' : 'Japan Auction — best value'} />
          </div>

          <div className="flex flex-col gap-3">
            <Link href={`/build`} className="btn-primary py-4 text-base">
              Build This Van →
            </Link>
            <Link href={`/browse?source=${rec.src}&drive=${rec.drive}`} className="btn-secondary py-3 text-base">
              Browse Matching Vans
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-lg w-full">
        <div className="mb-8 text-center">
          <h1 className="text-3xl text-charcoal mb-1">Van Match Quiz</h1>
          <p className="text-gray-500 text-sm">2–3 minutes • {QUESTIONS.length - current} questions left</p>
        </div>

        {/* Progress bar */}
        <div className="h-1.5 bg-gray-200 rounded-full mb-8">
          <div className="h-full bg-ocean rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-gray-200 p-8">
          <p className="text-2xl text-gray-900 mb-6">{q.q}</p>
          <div className="space-y-3">
            {q.options.map(opt => (
              <button key={opt} onClick={() => answer(opt)}
                className="w-full text-left px-5 py-4 rounded-xl border-2 border-gray-200 hover:border-ocean hover:bg-cream transition-colors font-medium text-gray-800">
                {opt}
              </button>
            ))}
          </div>
        </div>

        {current > 0 && (
          <button onClick={() => setCurrent(c => c - 1)} className="text-gray-400 text-sm mt-4 hover:underline block mx-auto">
            ← Back
          </button>
        )}
      </div>
    </div>
  )
}

function Rec({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-3">
      <span className="text-gray-500 text-sm w-20 shrink-0">{label}</span>
      <span className="text-charcoal text-sm font-semibold">{value}</span>
    </div>
  )
}
