import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { getApiUser, unauthorizedResponse } from '@/lib/api-auth'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders })
}

/**
 * POST /api/ai/analyze-machine
 *
 * Analyzes a vending machine photo using Claude vision.
 *
 * Body:
 *   imageBase64: string        - base64-encoded JPEG image
 *   analysisType: "machine" | "model_plate"
 *
 * Returns for "machine":
 *   { machineType: "SNACK"|"DRINK"|"COMBO"|null, confidence: number, reasoning: string }
 *
 * Returns for "model_plate":
 *   { make: string|null, model: string|null, serial: string|null, confidence: number }
 */
export async function POST(request: NextRequest) {
  const user = await getApiUser()
  if (!user) return unauthorizedResponse()

  try {
    const { imageBase64, analysisType, products } = await request.json()

    if (!imageBase64 || !analysisType) {
      return NextResponse.json(
        { success: false, error: 'imageBase64 and analysisType are required' },
        { status: 400, headers: corsHeaders }
      )
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { success: false, error: 'ANTHROPIC_API_KEY not configured' },
        { status: 500, headers: corsHeaders }
      )
    }

    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

    if (analysisType === 'machine') {
      const response = await client.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 256,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: { type: 'base64', media_type: 'image/jpeg', data: imageBase64 },
              },
              {
                type: 'text',
                text: `Look at this vending machine photo. Determine if it is a SNACK machine (sells chips, candy, food), a DRINK machine (sells cans, bottles, beverages), or a COMBO machine (sells both food and drinks).

Respond with ONLY valid JSON in this exact format:
{"machineType":"SNACK","confidence":0.95,"reasoning":"The machine has spiral coils typical of snack machines and contains chip bags"}

machineType must be "SNACK", "DRINK", "COMBO", or null if unclear.
confidence is 0.0 to 1.0.`,
              },
            ],
          },
        ],
      })

      const text = response.content[0].type === 'text' ? response.content[0].text.trim() : '{}'
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      const result = jsonMatch ? JSON.parse(jsonMatch[0]) : { machineType: null, confidence: 0, reasoning: '' }

      return NextResponse.json({ success: true, data: result }, { headers: corsHeaders })
    }

    if (analysisType === 'model_plate') {
      const response = await client.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 256,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: { type: 'base64', media_type: 'image/jpeg', data: imageBase64 },
              },
              {
                type: 'text',
                text: `This is a photo of a vending machine model/serial number plate or label. Extract the manufacturer name, model number, and serial number if visible.

Respond with ONLY valid JSON in this exact format:
{"make":"Crane","model":"National 167","serial":"SN123456","confidence":0.9}

Use null for any field you cannot read clearly. confidence is 0.0 to 1.0.`,
              },
            ],
          },
        ],
      })

      const text = response.content[0].type === 'text' ? response.content[0].text.trim() : '{}'
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      const result = jsonMatch ? JSON.parse(jsonMatch[0]) : { make: null, model: null, serial: null, confidence: 0 }

      return NextResponse.json({ success: true, data: result }, { headers: corsHeaders })
    }

    if (analysisType === 'slot_layout') {
      const response = await client.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 4096,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: { type: 'base64', media_type: 'image/jpeg', data: imageBase64 },
              },
              {
                type: 'text',
                text: `This is a photo of the front of a vending machine. Carefully read every visible slot label code (like A1, A3, B2, C5, D1, etc.) and identify the product in each slot from the packaging visible through the glass.

${products && products.length > 0
  ? `Our product catalog (use the EXACT name from this list when you recognize a product — do not paraphrase):
${(products as Array<{ id: string; name: string }>).map(p => `- ${p.name}`).join('\n')}

If the product in a slot is not in this catalog, describe it as best you can.`
  : ''}

Return ONLY valid JSON in this exact format:
{
  "slots": [
    { "labelCode": "A1", "rowKey": "A", "colIndex": 0, "product": "Potato Skins", "price": 1.60, "confidence": 0.9 },
    { "labelCode": "A3", "rowKey": "A", "colIndex": 1, "product": "Ruffles", "price": 1.40, "confidence": 0.85 }
  ],
  "totalSlots": 32,
  "confidence": 0.88
}

Rules:
- labelCode: the exact code printed on the machine shelf label (e.g. "A1", "B3", "D7")
- rowKey: just the letter part (e.g. "A", "B", "D")
- colIndex: 0-based position within the row (first slot in the row = 0, second = 1, etc.)
- product: use exact catalog name if recognized, otherwise describe from packaging, or null if slot is empty or unreadable
- price: the price shown on the label if visible, or null
- confidence: 0.0-1.0 for each slot
- Include ALL visible slots, even empty ones (set product to null)
- Read labels carefully — they are often on the shelf edge below each column`,
              },
            ],
          },
        ],
      })

      const text = response.content[0].type === 'text' ? response.content[0].text.trim() : '{}'
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      const result = jsonMatch ? JSON.parse(jsonMatch[0]) : { slots: [], totalSlots: 0, confidence: 0 }

      return NextResponse.json({ success: true, data: result }, { headers: corsHeaders })
    }

    if (analysisType === 'cc_reader') {
      const response = await client.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 256,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: { type: 'base64', media_type: 'image/jpeg', data: imageBase64 },
              },
              {
                type: 'text',
                text: `This is a photo of a vending machine payment/credit card reader (such as an ePort, Nayax, USA Technologies, Cantaloupe, or similar device). Find the white barcode label sticker on the device — the serial/reader ID is the alphanumeric code printed in text directly below or beside the barcode (e.g. "VK1001863385", "NAYAX-123456").

Read that number carefully from the label. Do not confuse it with other text on the device.

Respond with ONLY valid JSON in this exact format:
{"readerId":"VK1001863385","confidence":0.95}

Use null for readerId if you cannot read it clearly. confidence is 0.0 to 1.0.`,
              },
            ],
          },
        ],
      })

      const text = response.content[0].type === 'text' ? response.content[0].text.trim() : '{}'
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      const result = jsonMatch ? JSON.parse(jsonMatch[0]) : { readerId: null, confidence: 0 }

      return NextResponse.json({ success: true, data: result }, { headers: corsHeaders })
    }

    return NextResponse.json(
      { success: false, error: 'analysisType must be "machine", "model_plate", "slot_layout", or "cc_reader"' },
      { status: 400, headers: corsHeaders }
    )
  } catch (error) {
    console.error('[AI analyze-machine] Error:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'AI analysis failed' },
      { status: 500, headers: corsHeaders }
    )
  }
}
