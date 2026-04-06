export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'
import { requireAdmin } from '@/lib/api-auth'

function isCreditsError(err: unknown): boolean {
  const msg = String(err).toLowerCase()
  return msg.includes('credit') || msg.includes('insufficient_balance') || msg.includes('billing') || msg.includes('rate_limit')
}

export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { error } = await requireAdmin()
  if (error) return error

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return NextResponse.json({
      error: 'Translation unavailable \u2014 API credits needed. Use CoWork to translate manually.',
    }, { status: 503 })
  }

  const supabase = createAdminClient()
  const { data: listing, error } = await supabase
    .from('listings')
    .select('*')
    .eq('id', params.id)
    .single()

  if (error || !listing) {
    return NextResponse.json({ error: 'Listing not found' }, { status: 404 })
  }

  const rawData = listing.raw_data as Record<string, string> | null
  const rawGrade = rawData?.raw_grade ?? listing.grade
  const rawColour = rawData?.raw_colour ?? listing.body_colour
  const modelName = listing.model_name ?? 'TOYOTA HIACE'

  try {
    const Anthropic = (await import('@anthropic-ai/sdk')).default
    const client = new Anthropic({ apiKey })
    const features = [
      listing.has_nav && 'Navigation system',
      listing.has_leather && 'Leather seats',
      listing.has_sunroof && 'Sunroof',
      listing.has_alloys && 'Alloy wheels',
    ].filter(Boolean).join(', ')

    const prompt = `You are helping list a Japanese import Toyota Hiace van on an Australian car sales website.

Translate and clean up these fields into natural Australian English:
- Model name: ${modelName}
- Grade: ${rawGrade ?? 'unknown'}
- Body colour: ${rawColour ?? 'unknown'}

Also write a short 2-sentence listing description (max 80 words) for this van:
Year: ${listing.model_year ?? 'unknown'} | Mileage: ${listing.mileage_km ? listing.mileage_km.toLocaleString() + ' km' : 'unknown'} | Transmission: ${listing.transmission ?? 'unknown'} | Drive: ${listing.drive ?? 'unknown'} | Engine: ${listing.displacement_cc ? listing.displacement_cc + 'cc' : 'unknown'} | Features: ${features || 'none listed'}

Respond ONLY with valid JSON in this exact format:
{
  "modelName": "translated model name",
  "grade": "translated grade or null",
  "bodyColour": "translated colour in English or null",
  "description": "short listing description"
}`

    const msg = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 300,
      messages: [{ role: 'user', content: prompt }],
    })

    const text = (msg.content[0] as { type: string; text: string }).text.trim()
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('No JSON in response')

    const result = JSON.parse(jsonMatch[0])

    const { data: updated, error: updateError } = await supabase
      .from('listings')
      .update({
        model_name: result.modelName || listing.model_name,
        grade: result.grade || null,
        body_colour: result.bodyColour || null,
        description: result.description || null,
      })
      .eq('id', params.id)
      .select()
      .single()

    if (updateError) throw new Error(updateError.message)
    return NextResponse.json({ success: true, listing: updated })
  } catch (e) {
    if (isCreditsError(e)) {
      console.warn('[retranslate] Anthropic API credits unavailable')
      return NextResponse.json({
        error: 'Translation unavailable \u2014 API credits needed. Use CoWork to translate manually.',
      }, { status: 503 })
    }
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
