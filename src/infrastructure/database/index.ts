// import { drizzle } from "drizzle-orm/node-postgres"
// import { Pool } from "pg"
// import * as schema from "./schema"

// // Only create the pool on the server side
// let db: ReturnType<typeof drizzle>

// if (typeof window === "undefined") {
//   const pool = new Pool({
//     host: "localhost",
//     port: 5432,
//     database: "vendash",
//     user: "postgres",
//     password: "postgres",
//     ssl: false, // Explicitly disable SSL for local development
//   })

//   db = drizzle(pool, { schema })
// } else {
//   throw new Error("Database connection cannot be established in browser")
// }

// export { db }

// src/db.ts
import { drizzle } from "drizzle-orm/neon-http"
import { neon } from "@neondatabase/serverless"
import { config } from "dotenv"
import * as schema from "./schema"

config({ path: ".env" })

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is not set")
}

// Create the SQL client
const sql = neon(process.env.DATABASE_URL)

// Create and export the database instance with schema
export const db = drizzle(sql, { schema })
