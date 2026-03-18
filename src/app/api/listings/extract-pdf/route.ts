export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'
import Anthropic from '@anthropic-ai/sdk'

const EXTRACTION_PROMPT = `You are extracting data from a Japanese car auction sheet (NINJA Car Trade format).
Extract every field you can find and return ONLY a JSON object with these exact keys:

{
  "title": "full vehicle name e.g. TOYOTA HIACE VAN 5D 4WD LONG SUPER GL",
  "model_year": 2020,
  "grade": "LONG SUPER GL",
  "chassis_code": "GDH206V",
  "mileage": 73000,
  "body_color": "Silver",
  "transmission": "IA",
  "displacement": 2800,
  "drive": "4WD",
  "inspection_score": "4",
  "body_type": "CABOVER VAN",
  "air_conditioner": "AAC",
  "japan_safety_inspection": "Not",
  "has_power_steering": true,
  "has_power_windows": true,
  "has_navigation": true,
  "has_aluminum_wheels": false,
  "has_sunroof": false,
  "has_leather_seat": false,
  "has_rear_ac": false,
  "auction_site": "Akita",
  "bid_no": "402",
  "auction_session": "1048268",
  "condition_notes": "any condition notes in English translation",
  "interior_dimensions": "length x width x height in cm if shown",
  "start_price_jpy": null,
  "auction_date_time": "YYYY-MM-DDTHH:MM format if auction date and time visible on sheet"
}

If a field is not visible or not applicable, use null.
For auction_date_time: look for the auction date on the sheet and format as YYYY-MM-DDTHH:MM (e.g. 2026-03-20T10:30). Use JST timezone.
Set auction result to 'pending' for new sheets.
Leave sold price and top bid blank for new sheets.
Translate any Japanese text to English.
Return ONLY the JSON object, no explanation.`

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null

    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    if (file.type !== 'application/pdf') return NextResponse.json({ error: 'File must be a PDF' }, { status: 400 })
    if (file.size > 10 * 1024 * 1024) return NextResponse.json({ error: 'File must be under 10MB' }, { status: 400 })

    // Read file and convert to base64
    const buffer = await file.arrayBuffer()
    const base64 = Buffer.from(buffer).toString('base64')

    // Call Anthropic API with the PDF
    const anthropic = new Anthropic()
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'document',
              source: { type: 'base64', media_type: 'application/pdf', data: base64 },
            },
            { type: 'text', text: EXTRACTION_PROMPT },
          ],
        },
      ],
    })

    // Extract text response
    const textBlock = message.content.find(b => b.type === 'text')
    if (!textBlock || textBlock.type !== 'text') {
      return NextResponse.json({ error: 'No text response from AI' }, { status: 500 })
    }

    // Parse JSON from response (handle markdown code blocks)
    let rawJson = textBlock.text.trim()
    if (rawJson.startsWith('```')) {
      rawJson = rawJson.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '')
    }

    let extracted: Record<string, unknown>
    try {
      extracted = JSON.parse(rawJson)
    } catch {
      console.error('Failed to parse AI response:', rawJson)
      return NextResponse.json({ error: 'Failed to parse extraction result', raw: rawJson }, { status: 500 })
    }

    // Upload the PDF to storage as the inspection sheet
    const supabase = createAdminClient()
    const storagePath = `inspection-sheets/${Date.now()}-${file.name}`
    await supabase.storage
      .from('customer-documents')
      .upload(storagePath, buffer, { contentType: 'application/pdf', upsert: false })

    const { data: urlData } = supabase.storage
      .from('customer-documents')
      .getPublicUrl(storagePath)

    const inspectionSheetUrl = urlData?.publicUrl ?? null

    // Create listing in database
    const { data: listing, error } = await supabase
      .from('listings')
      .insert({
        source:            'auction',
        status:            'draft',
        model_name:        extracted.title as string ?? 'Unknown Vehicle',
        model_year:        extracted.model_year as number ?? null,
        grade:             extracted.grade as string ?? null,
        chassis_code:      extracted.chassis_code as string ?? null,
        mileage_km:        extracted.mileage as number ?? null,
        body_colour:       extracted.body_color as string ?? null,
        transmission:      extracted.transmission as string ?? null,
        displacement_cc:   extracted.displacement as number ?? null,
        drive:             extracted.drive as string ?? null,
        inspection_score:  extracted.inspection_score as string ?? null,
        bid_no:            extracted.bid_no as string ?? null,
        auction_count:     extracted.auction_session as string ?? null,
        start_price_jpy:   extracted.start_price_jpy as number ?? null,
        has_nav:           extracted.has_navigation as boolean ?? false,
        has_leather:       extracted.has_leather_seat as boolean ?? false,
        has_sunroof:       extracted.has_sunroof as boolean ?? false,
        has_alloys:        extracted.has_aluminum_wheels as boolean ?? false,
        has_power_steering: extracted.has_power_steering as boolean ?? false,
        has_power_windows: extracted.has_power_windows as boolean ?? false,
        has_rear_ac:       extracted.has_rear_ac as boolean ?? false,
        engine:            (() => {
          const cc = extracted.displacement as number | null
          if (cc === 2800) return 'diesel'
          if (cc === 2700 || cc === 2000) return 'petrol'
          return null
        })(),
        kaijo_code:        extracted.auction_site as string ?? null,
        auction_time:      extracted.auction_date_time ? new Date((extracted.auction_date_time as string) + ':00+09:00').toISOString() : null,
        auction_result:    'pending',
        condition_notes:   extracted.condition_notes as string ?? null,
        interior_dimensions: extracted.interior_dimensions as string ?? null,
        contact_phone:     null,
        inspection_sheet:  inspectionSheetUrl,
        photos:            [],
        description:       extracted.condition_notes as string ?? null,
      })
      .select('id')
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ id: listing.id, extracted })
  } catch (err) {
    console.error('PDF extraction error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
