import { defineConfig } from "drizzle-kit"
import * as dotenv from "dotenv"

// Load environment variables
dotenv.config()

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set")
}

export default defineConfig({
  schema: "./src/infrastructure/database/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
})
