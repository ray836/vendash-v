import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/infrastructure/database'
import { organizations, integrationLogs } from '@/infrastructure/database/schema'
import { eq } from 'drizzle-orm'
import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs'
import { nanoid } from 'nanoid'

const QUEUE_URL = 'https://sqs.us-west-2.amazonaws.com/475191662736/VendashTransaction'

/**
 * POST /api/transactions/ingest
 *
 * Accepts Cantaloupe ePort transaction data via HTTP POST (as configured in SeedLive).
 * Authenticates via Basic Auth (username = org API key, password ignored), then
 * forwards the raw CSV body to AWS SQS for the Lambda to process — same path as
 * the dev simulate-transaction endpoint.
 *
 * Body: CSV line in ePort format:
 *   "cardReaderId","transactionId","type","cardNumber",price,selectionCode($price),qty,"date","time"
 *
 * Returns 200 on success, 401 if auth fails, 400 if body is missing.
 */
// SeedLive sends a GET request to verify the endpoint before POSTing
export async function GET() {
  return new NextResponse('VendorPro ingest endpoint ready', { status: 200 })
}

export async function POST(request: NextRequest) {
  // --- Authentication ---
  const authHeader = request.headers.get('Authorization') ?? ''
  const match = authHeader.match(/^Basic\s+(.+)$/i)
  if (!match) {
    return new NextResponse('Unauthorized', {
      status: 401,
      headers: { 'WWW-Authenticate': 'Basic realm="VendorPro"' },
    })
  }

  const decoded = Buffer.from(match[1], 'base64').toString('utf-8')
  const apiKey = decoded.split(':')[0]

  const [org] = await db
    .select({ id: organizations.id, apiKey: organizations.apiKey })
    .from(organizations)
    .where(eq(organizations.apiKey, apiKey))
    .limit(1)

  if (!org) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  // --- Validate body ---
  const body = await request.text()
  if (!body.trim()) {
    return new NextResponse('Empty body', { status: 400 })
  }

  // --- Forward to SQS ---
  if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
    console.error('[transactions/ingest] AWS credentials not configured')
    return new NextResponse('Service unavailable', { status: 503 })
  }

  try {
    const sqs = new SQSClient({
      region: 'us-west-2',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
    })

    await sqs.send(new SendMessageCommand({
      QueueUrl: QUEUE_URL,
      MessageBody: body.trim(),
    }))

    await db.insert(integrationLogs).values({
      id: nanoid(),
      organizationId: org.id,
      source: 'cantaloupe',
      status: 'success',
      message: null,
    })

    return new NextResponse('OK', { status: 200 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('[transactions/ingest] Failed to send to SQS:', error)

    await db.insert(integrationLogs).values({
      id: nanoid(),
      organizationId: org.id,
      source: 'cantaloupe',
      status: 'error',
      message,
    }).catch(() => {/* non-fatal */})

    return new NextResponse('Internal Server Error', { status: 500 })
  }
}
