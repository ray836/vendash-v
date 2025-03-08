import { db } from "../infrastructure/database"
import { vendingMachines } from "../infrastructure/database/schema"
import { sql } from "drizzle-orm"

async function dropTables() {
  try {
    await db.execute(sql`DROP TABLE IF EXISTS ${vendingMachines} CASCADE`)
    console.log("Tables dropped successfully")
    process.exit(0)
  } catch (error) {
    console.error("Error dropping tables:", error)
    process.exit(1)
  }
}

dropTables()
