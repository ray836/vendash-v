import { drizzle } from "drizzle-orm/neon-serverless"
import { neonConfig, Pool } from "@neondatabase/serverless"
import { config } from "dotenv"
import * as schema from "./schema"
import WebSocket from "ws"
import { eq } from "drizzle-orm"

// Load environment variables
config({ path: ".env" })

// Configure Neon to use WebSocket
neonConfig.webSocketConstructor = WebSocket

// Create the SQL client
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  connectionTimeoutMillis: 5000,
  idleTimeoutMillis: 10000,
  max: 10,
})

// Create database instance
const db = drizzle(pool, { schema })

async function cleanRoutes() {
  console.log("🧹 Cleaning up old routes and pre-kits...\n")

  try {
    // Delete stocking records first (foreign key to pre-kits)
    const deletedStockingRecords = await db.delete(schema.stockingRecords)
    console.log("✅ Deleted all stocking records")

    // Delete pre-kit items (foreign key constraint)
    const deletedItems = await db.delete(schema.preKitItems)
    console.log("✅ Deleted all pre-kit items")

    // Delete pre-kits
    const deletedPreKits = await db.delete(schema.preKits)
    console.log("✅ Deleted all pre-kits")

    // Delete route stops
    const deletedStops = await db.delete(schema.routeStops)
    console.log("✅ Deleted all route stops")

    // Delete route assignments
    const deletedAssignments = await db.delete(schema.routeAssignments)
    console.log("✅ Deleted all route assignments")

    // Delete routes
    const deletedRoutes = await db.delete(schema.routes)
    console.log("✅ Deleted all routes")

    console.log("\n" + "=".repeat(60))
    console.log("🎉 CLEANUP COMPLETED!")
    console.log("=".repeat(60))
    console.log("\n✅ All routes, stops, pre-kits, and items have been removed.")
    console.log("✅ You can now run: npm run db:seed:route\n")

  } catch (error) {
    console.error("❌ Error cleaning routes:", error)
    throw error
  } finally {
    await pool.end()
  }
}

// Run the cleanup
cleanRoutes()
  .then(() => {
    console.log("✅ Cleanup completed successfully")
    process.exit(0)
  })
  .catch((error) => {
    console.error("❌ Cleanup failed:", error)
    process.exit(1)
  })
