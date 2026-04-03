import { NextRequest, NextResponse } from 'next/server'
import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders })
}

/**
 * POST /api/dev/simulate-transaction
 *
 * Sends a fake ePort transaction to the SQS queue so the Lambda processes it
 * end-to-end — enabling full simulation of the slot linking flow.
 *
 * Body:
 *   cardReaderId: string   — the ePort device ID (e.g. "VK1001863385")
 *   selectionCode: string  — the reader's slot number (e.g. "001")
 *   price: number          — sale price (default 1.50)
 */
export async function POST(request: NextRequest) {
  try {
    const { cardReaderId, selectionCode, price = 1.50 } = await request.json()

    if (!cardReaderId || !selectionCode) {
      return NextResponse.json(
        { success: false, error: 'cardReaderId and selectionCode are required' },
        { status: 400, headers: corsHeaders }
      )
    }

    if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
      return NextResponse.json(
        { success: false, error: 'AWS credentials not configured' },
        { status: 500, headers: corsHeaders }
      )
    }

    const sqs = new SQSClient({
      region: 'us-west-2',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
    })

    const now = new Date()
    const date = `${String(now.getMonth() + 1).padStart(2, '0')}/${String(now.getDate()).padStart(2, '0')}/${now.getFullYear()}`
    const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`
    const transactionId = `SIM-${Date.now()}`
    const priceFormatted = price.toFixed(2)

    const csvBody = `"${cardReaderId}","${transactionId}","SALE","4111111111111111",${priceFormatted},${selectionCode}($${priceFormatted}),1,"${date}","${time}"`

    await sqs.send(new SendMessageCommand({
      QueueUrl: 'https://sqs.us-west-2.amazonaws.com/475191662736/VendashTransaction',
      MessageBody: csvBody,
    }))

    return NextResponse.json(
      { success: true, message: 'Transaction sent to SQS', transactionId },
      { headers: corsHeaders }
    )
  } catch (error) {
    console.error('[simulate-transaction] Error:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to send transaction' },
      { status: 500, headers: corsHeaders }
    )
  }
}
