export const dynamic = 'force-dynamic'
export const maxDuration = 120

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'
import { GoogleGenAI } from '@google/genai'

const BUCKET = 'listing-images'

async function fetchImageAsBase64(url: string): Promise<{ data: string; mimeType: string }> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Failed to fetch image: ${url}`)
  const buffer = Buffer.from(await res.arrayBuffer())
  const contentType = res.headers.get('content-type') || 'image/jpeg'
  return { data: buffer.toString('base64'), mimeType: contentType }
}

async function removeWatermark(ai: GoogleGenAI, imageBase64: string, mimeType: string): Promise<Buffer> {
  const response = await ai.models.generateContent({
    model: 'gemini-2.0-flash-exp',
    contents: [
      {
        role: 'user',
        parts: [
          {
            text: 'Remove ALL watermarks from this image. There are watermarks at the top (Japanese text banner), center (alphanumeric ID like Y3502K01), and bottom (English copyright text). Remove all of them completely and reconstruct the underlying image cleanly. Return ONLY the cleaned image with no watermarks.',
          },
          {
            inlineData: {
              mimeType,
              data: imageBase64,
            },
          },
        ],
      },
    ],
    config: {
      responseModalities: ['image', 'text'],
    },
  } as any)

  // Extract image from response
  const candidates = (response as any).candidates ?? []
  for (const candidate of candidates) {
    for (const part of candidate.content?.parts ?? []) {
      if (part.inlineData?.data) {
        return Buffer.from(part.inlineData.data, 'base64')
      }
    }
  }
  throw new Error('No image returned from Gemini')
}

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) return NextResponse.json({ error: 'GEMINI_API_KEY not configured' }, { status: 500 })

    const { listingId, photoIndexes } = await req.json()
    if (!listingId) return NextResponse.json({ error: 'listingId required' }, { status: 400 })

    const supabase = createAdminClient()
    const { data: listing, error: fetchErr } = await supabase
      .from('listings')
      .select('photos')
      .eq('id', listingId)
      .single()

    if (fetchErr || !listing) return NextResponse.json({ error: 'Listing not found' }, { status: 404 })

    const photos: string[] = listing.photos ?? []
    const indexes: number[] = photoIndexes ?? photos.map((_: string, i: number) => i)

    const ai = new GoogleGenAI({ apiKey })
    const cleanedPhotos = [...photos]
    const results: { index: number; status: string; url?: string }[] = []

    for (const idx of indexes) {
      if (idx < 0 || idx >= photos.length) continue

      try {
        const { data, mimeType } = await fetchImageAsBase64(photos[idx])
        const cleanedBuffer = await removeWatermark(ai, data, mimeType)

        // Upload cleaned image
        const filename = `${Date.now()}-clean-${Math.random().toString(36).slice(2)}.png`
        const path = `listings/${filename}`

        const { error: uploadErr } = await supabase.storage
          .from(BUCKET)
          .upload(path, cleanedBuffer, { contentType: 'image/png', upsert: false })

        if (uploadErr) throw new Error(uploadErr.message)

        const { data: { publicUrl } } = supabase.storage.from(BUCKET).getPublicUrl(path)
        cleanedPhotos[idx] = publicUrl
        results.push({ index: idx, status: 'success', url: publicUrl })
      } catch (err) {
        results.push({ index: idx, status: 'failed', url: String(err) })
      }
    }

    // Update listing with cleaned photos
    const { error: updateErr } = await supabase
      .from('listings')
      .update({ photos: cleanedPhotos })
      .eq('id', listingId)

    if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 })

    return NextResponse.json({ success: true, results, photosUpdated: cleanedPhotos.length })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
