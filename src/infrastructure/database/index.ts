import { drizzle } from "drizzle-orm/neon-serverless"
import { neonConfig, Pool } from "@neondatabase/serverless"
import { config } from "dotenv"
import * as schema from "./schema"
import { WebSocket } from "ws"

config({ path: ".env" })

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is not set")
}

// Configure Neon to use WebSocket only in development
if (process.env.NODE_ENV === "development") {
  neonConfig.webSocketConstructor = WebSocket
}

// Create the SQL client
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Add connection timeout
  connectionTimeoutMillis: 5000,
  // Add idle timeout
  idleTimeoutMillis: 10000,
  // Add max connection pool size
  max: 10,
})

// Create and export the database instance with schema
export const db = drizzle(pool, { schema })
