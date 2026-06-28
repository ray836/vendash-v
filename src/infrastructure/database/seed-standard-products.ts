import { drizzle } from "drizzle-orm/neon-serverless"
import { neonConfig, Pool } from "@neondatabase/serverless"
import { config } from "dotenv"
import * as schema from "./schema"
import WebSocket from "ws"
import { eq, like } from "drizzle-orm"

// Load environment variables
config({ path: ".env" })

// Configure Neon to use WebSocket
neonConfig.webSocketConstructor = WebSocket

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  connectionTimeoutMillis: 5000,
  idleTimeoutMillis: 10000,
  max: 10,
})

const db = drizzle(pool, { schema })

// Seed the shared catalog by promoting an existing org's products into
// standard_products. Those products carry real (scraped) vendor images, so the
// catalog ships with real photos instead of placeholders.
//
// SOURCE_ORG is the org whose products become the catalog. Stable ids
// ("std-from-<productId>") keep it idempotent. Region is null = everywhere
// (filtering not wired up yet).
const SOURCE_ORG = process.env.CATALOG_SOURCE_ORG ?? "1"

async function seedStandardProductsFromOrg() {
  console.log(`Seeding catalog from org "${SOURCE_ORG}" products...`)

  // 1. Drop legacy placeholder rows (placehold.co images). Safe: catalog rows
  //    are only deletable when nothing references them via sourceStandardId.
  const removed = await db
    .delete(schema.standardProducts)
    .where(like(schema.standardProducts.image, "%placehold.co%"))
    .returning({ id: schema.standardProducts.id })
  if (removed.length) console.log(`Removed ${removed.length} placeholder catalog rows.`)

  // 2. Load the source org's products and the names already in the catalog
  //    (dedupe by name, so re-running or multiple sources don't duplicate).
  const [sourceProducts, existing] = await Promise.all([
    db.select().from(schema.products).where(eq(schema.products.organizationId, SOURCE_ORG)),
    db.select({ name: schema.standardProducts.name }).from(schema.standardProducts),
  ])
  const existingNames = new Set(existing.map((e) => e.name.toLowerCase()))

  // 3. Promote each product into the catalog.
  let inserted = 0
  for (const p of sourceProducts) {
    if (existingNames.has(p.name.toLowerCase())) continue
    const result = await db
      .insert(schema.standardProducts)
      .values({
        id: `std-from-${p.id}`,
        name: p.name,
        recommendedPrice: p.recommendedPrice,
        category: p.category,
        image: p.image,
        vendorLink: p.vendorLink,
        vendorSku: p.vendorSku,
        barcode: p.barcode,
        caseCost: p.caseCost,
        caseSize: p.caseSize,
        shelfLifeDays: p.shelfLifeDays,
        region: null,
      })
      .onConflictDoNothing()
      .returning({ id: schema.standardProducts.id })
    if (result.length) {
      inserted += 1
      existingNames.add(p.name.toLowerCase())
    }
  }

  const total = (await db.select().from(schema.standardProducts)).length
  console.log(
    `Catalog seed complete: promoted ${inserted} of ${sourceProducts.length} org products. Catalog now has ${total} products.`
  )
}

seedStandardProductsFromOrg()
  .then(() => {
    console.log("Done.")
    process.exit(0)
  })
  .catch((error) => {
    console.error("Catalog seed failed:", error)
    process.exit(1)
  })
