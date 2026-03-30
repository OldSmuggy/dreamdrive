'use client'

import { useState } from 'react'
import type { BuyerNote } from '@/types'

const SENTIMENT_BORDER: Record<string, string> = {
  positive: 'border-l-green-500',
  neutral: 'border-l-gray-300',
  caution: 'border-l-amber-500',
}

export default function BuyerAgentNotes({ notes }: { notes: BuyerNote[] }) {
  if (!notes || notes.length === 0) return null

  return (
    <div className="mt-10">
      <div className="flex items-center gap-2 mb-4">
        <svg className="w-5 h-5 text-ocean" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
        <h2 className="text-xl text-charcoal">Buyer Agent Notes</h2>
      </div>
      <div className="space-y-4">
        {notes.map((note) => (
          <NoteCard key={note.id} note={note} />
        ))}
      </div>
    </div>
  )
}

function NoteCard({ note }: { note: BuyerNote }) {
  const [expandedImg, setExpandedImg] = useState<string | null>(null)
  const borderCls = SENTIMENT_BORDER[note.sentiment] || SENTIMENT_BORDER.neutral

  return (
    <>
      <div className={`border-l-4 ${borderCls} bg-white rounded-r-xl border border-gray-200 border-l-0 p-5`}>
        <div className="flex items-center gap-2 mb-2">
          <span className="text-sm font-semibold text-charcoal">{note.author}</span>
          <span className="text-xs text-gray-400">
            {new Date(note.date).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}
          </span>
        </div>
        <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-line">{note.content}</p>
        {note.images && note.images.length > 0 && (
          <div className="flex gap-2 mt-3 flex-wrap">
            {note.images.map((img, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={i}
                src={img}
                alt={`Note photo ${i + 1}`}
                className="w-28 h-20 object-cover rounded-lg cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => setExpandedImg(img)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Lightbox */}
      {expandedImg && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setExpandedImg(null)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={expandedImg}
            alt="Expanded note photo"
            className="max-w-full max-h-[90vh] rounded-xl"
            onClick={e => e.stopPropagation()}
          />
          <button
            onClick={() => setExpandedImg(null)}
            className="absolute top-4 right-4 text-white text-2xl hover:text-gray-300"
          >
            ✕
          </button>
        </div>
      )}
    </>
  )
}
