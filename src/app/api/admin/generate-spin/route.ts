export const dynamic = 'force-dynamic'
export const maxDuration = 300 // 5 min — video generation takes a while

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

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) return NextResponse.json({ error: 'GEMINI_API_KEY not configured' }, { status: 500 })

    const { listingId } = await req.json()
    if (!listingId) return NextResponse.json({ error: 'listingId required' }, { status: 400 })

    const supabase = createAdminClient()
    const { data: listing, error: fetchErr } = await supabase
      .from('listings')
      .select('photos, model_name')
      .eq('id', listingId)
      .single()

    if (fetchErr || !listing) return NextResponse.json({ error: 'Listing not found' }, { status: 404 })

    const photos: string[] = listing.photos ?? []
    if (photos.length < 2) return NextResponse.json({ error: 'Need at least 2 photos' }, { status: 400 })

    // Use up to 3 reference images (front, side, rear)
    const refPhotos = photos.slice(0, Math.min(3, photos.length))
    const ai = new GoogleGenAI({ apiKey })

    // Build reference images for Veo
    const referenceImages = await Promise.all(
      refPhotos.map(async (url) => {
        const { data, mimeType } = await fetchImageAsBase64(url)
        return {
          image: { imageBytes: data, mimeType },
          referenceType: 'STYLE' as const,
        }
      })
    )

    const vehicleName = listing.model_name || 'vehicle'
    const prompt = `Create a smooth 360 degree rotating view of this ${vehicleName}. The vehicle should rotate slowly and smoothly on a clean black background, as if on a turntable in a showroom. Keep the camera at a consistent eye-level angle. The lighting should be professional automotive photography style.`

    // Start video generation
    let operation = await (ai.models as any).generateVideos({
      model: 'veo-3.1-generate-preview',
      prompt,
      config: {
        referenceImages,
        aspectRatio: '16:9',
        numberOfVideos: 1,
        durationSeconds: 6,
      },
    })

    // Poll until done (up to 4 minutes)
    const maxWait = 240_000
    const start = Date.now()
    while (!operation.done && Date.now() - start < maxWait) {
      await new Promise(resolve => setTimeout(resolve, 10_000))
      operation = await (ai.operations as any).getVideosOperation({ operation })
    }

    if (!operation.done) {
      return NextResponse.json({ error: 'Video generation timed out — try again' }, { status: 504 })
    }

    // Download the video
    const generatedVideos = operation.response?.generatedVideos ?? []
    if (!generatedVideos.length) {
      return NextResponse.json({ error: 'No video generated' }, { status: 500 })
    }

    const videoFile = generatedVideos[0].video
    // Download video bytes
    const videoResponse = await (ai.files as any).download({ file: videoFile })
    const videoBuffer = Buffer.from(await videoResponse.arrayBuffer())

    // Upload to Supabase
    const filename = `spin-${listingId.slice(0, 8)}-${Date.now()}.mp4`
    const path = `listings/${filename}`

    const { error: uploadErr } = await supabase.storage
      .from(BUCKET)
      .upload(path, videoBuffer, { contentType: 'video/mp4', upsert: true })

    if (uploadErr) return NextResponse.json({ error: uploadErr.message }, { status: 500 })

    const { data: { publicUrl } } = supabase.storage.from(BUCKET).getPublicUrl(path)

    // Update listing
    await supabase.from('listings').update({ spin_video: publicUrl }).eq('id', listingId)

    return NextResponse.json({ success: true, spinVideoUrl: publicUrl })
  } catch (e) {
    console.error('Spin generation error:', e)
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
