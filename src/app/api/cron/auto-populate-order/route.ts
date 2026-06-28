import { NextRequest, NextResponse } from "next/server"
import { db } from "@/infrastructure/database"
import { organizations } from "@/infrastructure/database/schema"
import { autoPopulateOrder } from "@/app/web/orders/actions"
import { checkAndSendOrderEmail } from "@/lib/order-email"

export const maxDuration = 60

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization")
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const allOrgs = await db.select({ id: organizations.id }).from(organizations)

  const results = []
  for (const org of allOrgs) {
    const populateResult = await autoPopulateOrder(org.id, "system")
    const emailResult = await checkAndSendOrderEmail(org.id)
    results.push({
      organizationId: org.id,
      ...populateResult,
      email: emailResult,
    })
  }

  return NextResponse.json({
    ran: new Date().toISOString(),
    organizations: results,
  })
}
