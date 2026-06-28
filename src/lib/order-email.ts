import { Resend } from "resend"
import { db } from "@/infrastructure/database"
import { organizations, orders } from "@/infrastructure/database/schema"
import { eq, desc, and } from "drizzle-orm"
import { SlotRepository } from "@/infrastructure/repositories/SlotRepository"
import { InventoryRepository } from "@/infrastructure/repositories/InventoryRepository"
import { ProductRepository } from "@/infrastructure/repositories/ProductRepository"
import { TransactionRepository } from "@/infrastructure/repositories/TransactionRepository"
import {
  PAD_WINDOW_DAYS,
  MIN_ORDER_TOTAL,
  weightedAvgDailySales,
  daysUntilOut,
  classifyPrimaryReason,
  basePrimaryCases,
  sellsThroughBeforeExpiry,
} from "@/domains/Inventory/inventoryForecast"

// ---------------------------------------------------------------------------
// Rules for whether an email is worth sending
// ---------------------------------------------------------------------------

const COOLDOWN_DAYS = 3
const MIN_ACTIVE_DAILY_SALES = 0.3  // ~2 sales/week = "active" seller
const HIGH_VELOCITY_SALES = 0.5     // ~3.5 sales/week = "high velocity"
const MIN_PRIMARY_VALUE = 20        // primary items must total ≥ $20
const MAX_PADDING_RATIO = 2         // padding ≤ 2× primary value (otherwise waste)
const URGENT_DAYS = 7               // days remaining = ordering today is critical
const CRITICAL_ITEM_THRESHOLD = 3   // 3+ items projected low = enough urgency alone

// ---------------------------------------------------------------------------
// Email content types
// ---------------------------------------------------------------------------

interface EmailOrderItem {
  name: string
  image: string
  reason: "out_of_stock" | "insufficient_stock" | "projected_low" | "pad_to_minimum"
  daysUntilStorageOut: number | null
  caseCost: number
  caseSize: number
  avgDailySales: number
}

// ---------------------------------------------------------------------------
// Core check: should we send an email for this organization?
// ---------------------------------------------------------------------------

export async function checkAndSendOrderEmail(organizationId: string): Promise<{
  sent: boolean
  reason: string
}> {
  // Load org to check cooldown and notification email
  const [org] = await db
    .select()
    .from(organizations)
    .where(eq(organizations.id, organizationId))

  if (!org?.notificationEmail) {
    return { sent: false, reason: "No notification email configured for this organization" }
  }

  // Rule 1a: Cooldown — no email if one was sent recently
  if (org.lastOrderEmailSentAt) {
    const daysSinceLast = (Date.now() - org.lastOrderEmailSentAt.getTime()) / (1000 * 60 * 60 * 24)
    if (daysSinceLast < COOLDOWN_DAYS) {
      return { sent: false, reason: `Cooldown: last email sent ${Math.floor(daysSinceLast)} days ago` }
    }
  }

  // Rule 1b: Don't email if an order was placed very recently
  const [recentOrder] = await db
    .select({ createdAt: orders.createdAt })
    .from(orders)
    .where(and(eq(orders.organizationId, organizationId), eq(orders.status, "placed")))
    .orderBy(desc(orders.createdAt))
    .limit(1)

  if (recentOrder) {
    const daysSinceOrder = (Date.now() - recentOrder.createdAt.getTime()) / (1000 * 60 * 60 * 24)
    if (daysSinceOrder < 2) {
      return { sent: false, reason: "Order was placed within the last 2 days" }
    }
  }

  // Analyze current inventory / sales to build email items
  const analysis = await analyzeOrderUrgency(organizationId)

  if (!analysis.primaryItems.length) {
    return { sent: false, reason: "No primary items need ordering" }
  }

  // Rule 2: At least one actively-selling item must be in the primary list
  const hasActiveSeller = analysis.primaryItems.some((i) => i.avgDailySales >= MIN_ACTIVE_DAILY_SALES)
  if (!hasActiveSeller) {
    return { sent: false, reason: "All flagged items have near-zero sales velocity — not worth ordering yet" }
  }

  // Rule 3: Primary order value must be meaningful + padding must not overwhelm it
  if (analysis.primaryTotal < MIN_PRIMARY_VALUE) {
    return { sent: false, reason: `Primary order total ($${analysis.primaryTotal.toFixed(2)}) is below minimum threshold ($${MIN_PRIMARY_VALUE})` }
  }
  if (analysis.paddingNeeded > analysis.primaryTotal * MAX_PADDING_RATIO) {
    return { sent: false, reason: `Too much padding needed ($${analysis.paddingNeeded.toFixed(2)}) relative to primary needs ($${analysis.primaryTotal.toFixed(2)})` }
  }

  // Rule 4: Must have genuine urgency (at least one of these)
  const hasUrgentItem = analysis.primaryItems.some(
    (i) => i.daysUntilStorageOut !== null && i.daysUntilStorageOut < URGENT_DAYS
  )
  const hasEmptyHighVelocityItem = analysis.primaryItems.some(
    (i) => i.reason === "out_of_stock" && i.avgDailySales >= HIGH_VELOCITY_SALES
  )
  const hasManyLowItems = analysis.primaryItems.length >= CRITICAL_ITEM_THRESHOLD

  if (!hasUrgentItem && !hasEmptyHighVelocityItem && !hasManyLowItems) {
    return { sent: false, reason: "Not urgent enough yet — no items critically low, no high-velocity stockouts, and fewer than 3 items flagged" }
  }

  // All rules passed — send the email
  const emailItems = [
    ...analysis.primaryItems.sort((a, b) => {
      // Sort by urgency: out_of_stock first, then by days remaining asc
      if (a.reason === "out_of_stock" && b.reason !== "out_of_stock") return -1
      if (b.reason === "out_of_stock" && a.reason !== "out_of_stock") return 1
      return (a.daysUntilStorageOut ?? 999) - (b.daysUntilStorageOut ?? 999)
    }),
    ...analysis.padItems,
  ]

  const sent = await sendOrderReadyEmail(org.notificationEmail, emailItems, analysis.estimatedTotal)

  if (sent) {
    await db
      .update(organizations)
      .set({ lastOrderEmailSentAt: new Date() })
      .where(eq(organizations.id, organizationId))

    return { sent: true, reason: `Email sent to ${org.notificationEmail}` }
  }

  return { sent: false, reason: "Email send failed (check RESEND_API_KEY)" }
}

// ---------------------------------------------------------------------------
// Analyze what genuinely needs ordering (mirrors autoPopulateOrder logic)
// ---------------------------------------------------------------------------

async function analyzeOrderUrgency(organizationId: string): Promise<{
  primaryItems: EmailOrderItem[]
  padItems: EmailOrderItem[]
  primaryTotal: number
  paddingNeeded: number
  estimatedTotal: number
}> {
  const slotRepo = new SlotRepository(db)
  const inventoryRepo = new InventoryRepository(db)
  const productRepo = new ProductRepository(db)
  const txRepo = new TransactionRepository(db)

  const now = new Date()
  const start35Days = new Date(now.getTime() - 35 * 24 * 60 * 60 * 1000)
  const start7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

  const [allSlots, inventoryList, allProducts, txData] = await Promise.all([
    slotRepo.findByOrganizationId(organizationId),
    inventoryRepo.findByOrganizationId(organizationId),
    productRepo.findByOrganizationId(organizationId),
    txRepo.findByOrganizationIdWithItems(organizationId, start35Days, now),
  ])

  const inventoryMap = new Map(inventoryList.map((inv) => [inv.productId, inv]))
  const productMap = new Map(allProducts.map((p) => [p.id, p]))

  const salesMap35 = new Map<string, number>()
  const salesMap7 = new Map<string, number>()
  for (const tx of txData) {
    for (const item of tx.items) {
      if (item.productId) {
        salesMap35.set(item.productId, (salesMap35.get(item.productId) ?? 0) + item.quantity)
        if (new Date(tx.createdAt) >= start7Days) {
          salesMap7.set(item.productId, (salesMap7.get(item.productId) ?? 0) + item.quantity)
        }
      }
    }
  }

  const slotsByProduct = new Map<string, { totalCapacity: number; totalCurrentQty: number }>()
  for (const slot of allSlots) {
    if (!slot.productId) continue
    const existing = slotsByProduct.get(slot.productId)
    if (existing) {
      existing.totalCapacity += slot.capacity
      existing.totalCurrentQty += slot.currentQuantity
    } else {
      slotsByProduct.set(slot.productId, { totalCapacity: slot.capacity, totalCurrentQty: slot.currentQuantity })
    }
  }

  const primaryItems: EmailOrderItem[] = []
  const padItems: EmailOrderItem[] = []

  for (const [productId, slotData] of slotsByProduct.entries()) {
    const product = productMap.get(productId)
    if (!product) continue

    const inv = inventoryMap.get(productId)
    const storageQty = inv?.storage ?? 0
    const caseSize = Number(product.caseSize) || 1
    const caseCost = Number(product.caseCost) || 0

    const avgDailySales = weightedAvgDailySales(salesMap7.get(productId) ?? 0, salesMap35.get(productId) ?? 0)
    const daysUntilStorageOut = daysUntilOut(storageQty, avgDailySales)

    const totalSlotDeficit = Math.max(0, slotData.totalCapacity - slotData.totalCurrentQty)
    const unitsToOrder = Math.max(0, totalSlotDeficit - storageQty)

    const item: EmailOrderItem = {
      name: product.name,
      image: product.image ?? "",
      reason: "projected_low",
      daysUntilStorageOut,
      caseCost,
      caseSize,
      avgDailySales,
    }

    const primaryReason = classifyPrimaryReason({ storageQty, totalSlotDeficit, unitsToOrder, daysUntilStorageOut })
    if (primaryReason) {
      primaryItems.push({ ...item, reason: primaryReason })
    } else if (
      avgDailySales > 0 &&
      daysUntilStorageOut !== null &&
      daysUntilStorageOut < PAD_WINDOW_DAYS &&
      sellsThroughBeforeExpiry({ avgDailySales, caseSize, shelfLifeDays: product.shelfLifeDays })
    ) {
      padItems.push({ ...item, reason: "pad_to_minimum" })
    }
  }

  const primaryTotal = primaryItems.reduce(
    (sum, i) =>
      sum +
      basePrimaryCases({ reason: "projected_low", unitsToOrder: 0, avgDailySales: i.avgDailySales, caseSize: i.caseSize }) *
        i.caseCost,
    0
  )

  const estimatedTotal = Math.max(primaryTotal, MIN_ORDER_TOTAL)
  const paddingNeeded = Math.max(0, MIN_ORDER_TOTAL - primaryTotal)

  return { primaryItems, padItems, primaryTotal, paddingNeeded, estimatedTotal }
}

// ---------------------------------------------------------------------------
// Build and send the email
// ---------------------------------------------------------------------------

async function sendOrderReadyEmail(
  to: string,
  items: EmailOrderItem[],
  estimatedTotal: number
): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    console.error("RESEND_API_KEY not set — skipping email")
    return false
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://vendash-v.vercel.app"
  const resend = new Resend(apiKey)

  const urgentCount = items.filter(
    (i) => i.reason !== "pad_to_minimum"
  ).length

  const subject = urgentCount === 1
    ? `1 product needs reordering — VendorPro`
    : `${urgentCount} products need reordering — VendorPro`

  function reasonLabel(item: EmailOrderItem): string {
    if (item.reason === "out_of_stock") return "🔴 Out of stock"
    if (item.reason === "insufficient_stock") return "🟠 Machine needs restocking"
    if (item.reason === "projected_low") {
      const days = item.daysUntilStorageOut
      if (days !== null && days <= 7) return `🔴 ~${days} days left`
      if (days !== null) return `🟡 ~${days} days left`
    }
    if (item.reason === "pad_to_minimum") {
      return item.daysUntilStorageOut
        ? `⚪ ~${item.daysUntilStorageOut} days left — added to reach $50`
        : "⚪ Added to reach $50 minimum"
    }
    return ""
  }

  const itemRows = items.slice(0, 8).map((item) => `
    <tr>
      <td style="padding:10px 0;border-bottom:1px solid #2a2a2a;">
        <strong style="color:#fff;font-size:14px;">${item.name}</strong>
      </td>
      <td style="padding:10px 12px;border-bottom:1px solid #2a2a2a;color:#aaa;font-size:13px;white-space:nowrap;">
        ${reasonLabel(item)}
      </td>
      <td style="padding:10px 0 10px 12px;border-bottom:1px solid #2a2a2a;color:#aaa;font-size:13px;white-space:nowrap;text-align:right;">
        $${item.caseCost.toFixed(2)}/case
      </td>
    </tr>
  `).join("")

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:560px;margin:40px auto;padding:0 16px;">

    <div style="margin-bottom:24px;">
      <span style="font-size:20px;font-weight:700;color:#fff;">VendorPro</span>
    </div>

    <div style="background:#141414;border:1px solid #2a2a2a;border-radius:12px;overflow:hidden;">
      <div style="padding:28px 28px 20px;border-bottom:1px solid #2a2a2a;">
        <p style="margin:0 0 6px;font-size:12px;text-transform:uppercase;letter-spacing:.08em;color:#666;">Action needed</p>
        <h1 style="margin:0;font-size:22px;font-weight:700;color:#fff;line-height:1.3;">
          Your vending machine<br>needs restocking
        </h1>
      </div>

      <div style="padding:20px 28px;">
        <table style="width:100%;border-collapse:collapse;">
          ${itemRows}
        </table>
      </div>

      <div style="padding:16px 28px;border-top:1px solid #2a2a2a;display:flex;justify-content:space-between;align-items:center;">
        <div>
          <p style="margin:0;font-size:12px;color:#666;">Estimated order total</p>
          <p style="margin:4px 0 0;font-size:20px;font-weight:700;color:#fff;">~$${estimatedTotal.toFixed(2)}</p>
        </div>
      </div>

      <div style="padding:20px 28px;border-top:1px solid #2a2a2a;">
        <a href="${appUrl}/web/orders"
           style="display:block;text-align:center;background:#fff;color:#000;text-decoration:none;padding:14px 24px;border-radius:8px;font-weight:600;font-size:15px;">
          Review &amp; Place Order →
        </a>
      </div>
    </div>

    <p style="margin:24px 0 0;font-size:12px;color:#555;text-align:center;">
      VendorPro automatically prepared this order based on your inventory and sales data.<br>
      <a href="${appUrl}/web/orders" style="color:#666;">Manage notifications in settings</a>
    </p>
  </div>
</body>
</html>`

  try {
    const { error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL ?? "VendorPro <noreply@vendash-v.vercel.app>",
      to,
      subject,
      html,
    })

    if (error) {
      console.error("Resend error:", error)
      return false
    }
    return true
  } catch (err) {
    console.error("Failed to send email:", err)
    return false
  }
}
