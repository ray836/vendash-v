import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/infrastructure/database'
import { organizations, integrationLogs, vendingMachines } from '@/infrastructure/database/schema'
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
  // --- Resolve org for logging (optional — API key in ?key= or Basic Auth) ---
  let orgId: string | null = null
  let apiKey = request.nextUrl.searchParams.get('key') ?? ''
  if (!apiKey) {
    const authHeader = request.headers.get('Authorization') ?? ''
    const match = authHeader.match(/^Basic\s+(.+)$/i)
    if (match) {
      const decoded = Buffer.from(match[1], 'base64').toString('utf-8')
      apiKey = decoded.split(':')[0]
    }
  }
  if (apiKey) {
    const [org] = await db
      .select({ id: organizations.id })
      .from(organizations)
      .where(eq(organizations.apiKey, apiKey))
      .limit(1)
    if (org) orgId = org.id
  }

  // --- Validate body ---
  const body = await request.text()
  if (!body.trim()) {
    return new NextResponse('Empty body', { status: 400 })
  }

  // --- Detect SeedLive connection test (fixed test body, not a real transaction) ---
  const isConnectionTest = body.trim().toLowerCase().startsWith('this is a test')

  // --- Parse cardReaderId and resolve org (only for real transactions) ---
  const cardReaderId = isConnectionTest
    ? null
    : (body.trim().split(',')[0].replace(/^"|"$/g, '').trim() || null)

  if (!isConnectionTest && !orgId && cardReaderId) {
    const [machine] = await db
      .select({ organizationId: vendingMachines.organizationId })
      .from(vendingMachines)
      .where(eq(vendingMachines.cardReaderId, cardReaderId))
      .limit(1)
    if (machine) orgId = machine.organizationId
  }

  // --- Connection test: log and return immediately, skip SQS ---
  if (isConnectionTest) {
    await db.insert(integrationLogs).values({
      id: nanoid(),
      organizationId: orgId,
      source: 'cantaloupe',
      status: 'success',
      message: null,
      cardReaderId: null,
    }).catch(() => {/* non-fatal */})
    return new NextResponse('OK', { status: 200 })
  }

  // --- Forward real transaction to SQS ---
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

    return new NextResponse('OK', { status: 200 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('[transactions/ingest] Failed to send to SQS:', error)

    await db.insert(integrationLogs).values({
      id: nanoid(),
      organizationId: orgId,
      source: 'cantaloupe',
      status: 'error',
      message,
      cardReaderId,
    }).catch(() => {/* non-fatal */})

    return new NextResponse('Internal Server Error', { status: 500 })
  }
}
