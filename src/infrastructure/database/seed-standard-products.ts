import { drizzle } from "drizzle-orm/neon-serverless"
import { neonConfig, Pool } from "@neondatabase/serverless"
import { config } from "dotenv"
import * as schema from "./schema"
import WebSocket from "ws"

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

// Starter set of common vending products for the shared catalog.
// region: null = available everywhere (region filtering not wired up yet).
// Stable string ids ("std-*") so re-running is idempotent via onConflictDoNothing.
type SeedStandardProduct = {
  id: string
  name: string
  category: string
  recommendedPrice: string
  caseCost: string
  caseSize: string
  shelfLifeDays: number
  image: string
}

const STANDARD_PRODUCTS: SeedStandardProduct[] = [
  // --- Chips & savory snacks ---
  { id: "std-lays-classic", name: "Lay's Classic Potato Chips", category: "chips", recommendedPrice: "1.50", caseCost: "21.98", caseSize: "40", shelfLifeDays: 60, image: "https://placehold.co/200x200?text=Lay%27s" },
  { id: "std-doritos-nacho", name: "Doritos Nacho Cheese", category: "chips", recommendedPrice: "1.75", caseCost: "23.48", caseSize: "40", shelfLifeDays: 60, image: "https://placehold.co/200x200?text=Doritos" },
  { id: "std-cheetos-crunchy", name: "Cheetos Crunchy", category: "chips", recommendedPrice: "1.75", caseCost: "23.48", caseSize: "40", shelfLifeDays: 60, image: "https://placehold.co/200x200?text=Cheetos" },
  { id: "std-ruffles-cheddar", name: "Ruffles Cheddar & Sour Cream", category: "chips", recommendedPrice: "1.75", caseCost: "23.48", caseSize: "40", shelfLifeDays: 60, image: "https://placehold.co/200x200?text=Ruffles" },
  { id: "std-sunchips-harvest", name: "SunChips Harvest Cheddar", category: "chips", recommendedPrice: "1.75", caseCost: "23.48", caseSize: "40", shelfLifeDays: 60, image: "https://placehold.co/200x200?text=SunChips" },
  { id: "std-cheezit", name: "Cheez-It Original", category: "snack", recommendedPrice: "1.75", caseCost: "19.98", caseSize: "30", shelfLifeDays: 120, image: "https://placehold.co/200x200?text=Cheez-It" },
  { id: "std-pretzels", name: "Rold Gold Pretzels", category: "snack", recommendedPrice: "1.50", caseCost: "18.98", caseSize: "40", shelfLifeDays: 120, image: "https://placehold.co/200x200?text=Pretzels" },

  // --- Cookies & sweet snacks ---
  { id: "std-oreo", name: "Oreo Cookies (2-pack)", category: "cookies", recommendedPrice: "1.50", caseCost: "16.98", caseSize: "30", shelfLifeDays: 180, image: "https://placehold.co/200x200?text=Oreo" },
  { id: "std-chips-ahoy", name: "Chips Ahoy! (2-pack)", category: "cookies", recommendedPrice: "1.50", caseCost: "16.98", caseSize: "30", shelfLifeDays: 180, image: "https://placehold.co/200x200?text=Chips+Ahoy" },
  { id: "std-poptart", name: "Pop-Tarts Frosted Strawberry", category: "snack", recommendedPrice: "1.50", caseCost: "17.98", caseSize: "36", shelfLifeDays: 180, image: "https://placehold.co/200x200?text=Pop-Tarts" },

  // --- Candy ---
  { id: "std-snickers", name: "Snickers Bar", category: "candy", recommendedPrice: "1.50", caseCost: "26.98", caseSize: "48", shelfLifeDays: 270, image: "https://placehold.co/200x200?text=Snickers" },
  { id: "std-mms-peanut", name: "M&M's Peanut", category: "candy", recommendedPrice: "1.50", caseCost: "26.98", caseSize: "48", shelfLifeDays: 270, image: "https://placehold.co/200x200?text=M%26M%27s" },
  { id: "std-kitkat", name: "Kit Kat", category: "candy", recommendedPrice: "1.50", caseCost: "26.98", caseSize: "48", shelfLifeDays: 270, image: "https://placehold.co/200x200?text=Kit+Kat" },
  { id: "std-skittles", name: "Skittles Original", category: "candy", recommendedPrice: "1.50", caseCost: "25.98", caseSize: "36", shelfLifeDays: 365, image: "https://placehold.co/200x200?text=Skittles" },
  { id: "std-reeses", name: "Reese's Peanut Butter Cups", category: "candy", recommendedPrice: "1.50", caseCost: "26.98", caseSize: "48", shelfLifeDays: 270, image: "https://placehold.co/200x200?text=Reese%27s" },

  // --- Drinks ---
  { id: "std-coke-20oz", name: "Coca-Cola 20oz", category: "drink", recommendedPrice: "2.00", caseCost: "28.98", caseSize: "24", shelfLifeDays: 270, image: "https://placehold.co/200x200?text=Coca-Cola" },
  { id: "std-diet-coke-20oz", name: "Diet Coke 20oz", category: "drink", recommendedPrice: "2.00", caseCost: "28.98", caseSize: "24", shelfLifeDays: 270, image: "https://placehold.co/200x200?text=Diet+Coke" },
  { id: "std-sprite-20oz", name: "Sprite 20oz", category: "drink", recommendedPrice: "2.00", caseCost: "28.98", caseSize: "24", shelfLifeDays: 270, image: "https://placehold.co/200x200?text=Sprite" },
  { id: "std-pepsi-20oz", name: "Pepsi 20oz", category: "drink", recommendedPrice: "2.00", caseCost: "28.98", caseSize: "24", shelfLifeDays: 270, image: "https://placehold.co/200x200?text=Pepsi" },
  { id: "std-gatorade", name: "Gatorade Fruit Punch 20oz", category: "drink", recommendedPrice: "2.25", caseCost: "21.98", caseSize: "24", shelfLifeDays: 270, image: "https://placehold.co/200x200?text=Gatorade" },
  { id: "std-water-16oz", name: "Bottled Water 16.9oz", category: "drink", recommendedPrice: "1.25", caseCost: "5.98", caseSize: "40", shelfLifeDays: 365, image: "https://placehold.co/200x200?text=Water" },
  { id: "std-redbull", name: "Red Bull Energy 12oz", category: "drink", recommendedPrice: "3.00", caseCost: "33.98", caseSize: "24", shelfLifeDays: 365, image: "https://placehold.co/200x200?text=Red+Bull" },
]

async function seedStandardProducts() {
  console.log("Seeding standard product catalog...")

  let inserted = 0
  for (const product of STANDARD_PRODUCTS) {
    const result = await db
      .insert(schema.standardProducts)
      .values({
        ...product,
        vendorLink: "https://www.samsclub.com",
        region: null,
      })
      .onConflictDoNothing()
      .returning({ id: schema.standardProducts.id })
    inserted += result.length
  }

  console.log(
    `Standard catalog seed complete: ${inserted} inserted, ${STANDARD_PRODUCTS.length - inserted} already present.`
  )
}

seedStandardProducts()
  .then(() => {
    console.log("Done.")
    process.exit(0)
  })
  .catch((error) => {
    console.error("Standard catalog seed failed:", error)
    process.exit(1)
  })
