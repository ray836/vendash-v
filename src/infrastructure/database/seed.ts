import { drizzle } from "drizzle-orm/neon-serverless"
import { neonConfig, Pool } from "@neondatabase/serverless"
import { config } from "dotenv"
import * as schema from "./schema"
import { nanoid } from "nanoid"
import bcrypt from "bcryptjs"
import WebSocket from "ws"

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

async function seed() {
  console.log("Starting database seed...")

  try {
    // Create default organization with fixed ID
    const orgId = "org-demo-001"
    await db.insert(schema.organizations).values({
      id: orgId,
      name: "Demo Organization",
      address: "123 Demo Street, Demo City, DC 12345",
    }).onConflictDoNothing()

    console.log("Created organization:", orgId)

    // Create default admin user with fixed ID
    const adminUserId = "user-admin-001"
    const hashedPassword = await bcrypt.hash("demo123", 10)

    await db.insert(schema.users).values({
      id: adminUserId,
      firstName: "Demo",
      lastName: "Admin",
      email: "admin@demo.com",
      password: hashedPassword,
      role: "admin",
      organizationId: orgId,
    }).onConflictDoNothing()

    console.log("Created admin user:", adminUserId)

    // Create some demo drivers with fixed IDs
    const driverIds = []
    const drivers = [
      { id: "driver-001", firstName: "John", lastName: "Doe", email: "john.doe@demo.com" },
      { id: "driver-002", firstName: "Jane", lastName: "Smith", email: "jane.smith@demo.com" },
      { id: "driver-003", firstName: "Mike", lastName: "Johnson", email: "mike.johnson@demo.com" },
      { id: "driver-004", firstName: "Sarah", lastName: "Williams", email: "sarah.williams@demo.com" },
    ]

    for (const driver of drivers) {
      const driverId = driver.id
      driverIds.push(driverId)

      await db.insert(schema.users).values({
        id: driverId,
        firstName: driver.firstName,
        lastName: driver.lastName,
        email: driver.email,
        password: hashedPassword,
        role: "driver",
        organizationId: orgId,
      }).onConflictDoNothing()
    }

    console.log("Created drivers:", driverIds.length)

    // Create demo locations with fixed IDs and coordinates (SF Bay Area)
    const locationData = [
      { id: "loc-001", name: "TechHub HQ", address: "123 Innovation Drive", latitude: 37.7749, longitude: -122.4194 },
      { id: "loc-002", name: "Riverside Office", address: "456 Commerce Blvd", latitude: 37.7849, longitude: -122.4294 },
      { id: "loc-003", name: "Metro Shopping", address: "789 Retail Plaza", latitude: 37.7949, longitude: -122.4394 },
      { id: "loc-004", name: "University Library", address: "555 Campus Way", latitude: 37.8049, longitude: -122.4494 },
      { id: "loc-005", name: "City Gym", address: "321 Fitness Ave", latitude: 37.8149, longitude: -122.4594 },
      { id: "loc-006", name: "Greenfield Hospital", address: "321 Medical Center Dr", latitude: 37.8249, longitude: -122.4694 },
    ]

    for (const loc of locationData) {
      await db.insert(schema.locations).values({
        ...loc,
        organizationId: orgId,
      }).onConflictDoNothing()
    }

    console.log("Created locations:", locationData.length)

    // Create some demo products
    const productData = [
      { id: "prod-001", name: "Lay's Classic Chips", category: "chips", recommendedPrice: "1.50", caseCost: "24.00", caseSize: "24", image: "https://placehold.co/200x200?text=Lays" },
      { id: "prod-002", name: "Doritos Nacho Cheese", category: "chips", recommendedPrice: "1.50", caseCost: "24.00", caseSize: "24", image: "https://placehold.co/200x200?text=Doritos" },
      { id: "prod-003", name: "Coca-Cola", category: "drink", recommendedPrice: "2.00", caseCost: "30.00", caseSize: "24", image: "https://placehold.co/200x200?text=Coke" },
      { id: "prod-004", name: "Snickers Bar", category: "candy", recommendedPrice: "1.25", caseCost: "18.00", caseSize: "24", image: "https://placehold.co/200x200?text=Snickers" },
      { id: "prod-005", name: "M&Ms Peanut", category: "candy", recommendedPrice: "1.25", caseCost: "18.00", caseSize: "24", image: "https://placehold.co/200x200?text=M&Ms" },
    ]

    for (const product of productData) {
      await db.insert(schema.products).values({
        ...product,
        vendorLink: "https://www.samsclub.com",
        shippingAvailable: true,
        shippingTimeInDays: 3,
        organizationId: orgId,
      }).onConflictDoNothing()
    }

    console.log("Created products:", productData.length)

    // Create vending machines at each location
    const machineData = [
      { id: "vm-001", locationId: "loc-001", type: "snack", model: "Dixie Narco 501E" },
      { id: "vm-002", locationId: "loc-001", type: "drink", model: "Royal Vendors Vision 500" },
      { id: "vm-003", locationId: "loc-002", type: "snack", model: "Crane National 167" },
      { id: "vm-004", locationId: "loc-003", type: "drink", model: "Vendo 721" },
      { id: "vm-005", locationId: "loc-004", type: "snack", model: "AMS Sensit 3" },
      { id: "vm-006", locationId: "loc-005", type: "drink", model: "Pepsi 276" },
    ]

    for (const machine of machineData) {
      await db.insert(schema.vendingMachines).values({
        ...machine,
        status: "ONLINE",
        organizationId: orgId,
        createdBy: adminUserId,
        updatedBy: adminUserId,
      }).onConflictDoNothing()
    }

    console.log("Created vending machines:", machineData.length)

    // Create slots for each machine with some inventory
    let slotCount = 0
    for (const machine of machineData) {
      // Add 5 slots per machine with different products
      for (let i = 0; i < 5; i++) {
        const product = productData[i % productData.length]
        await db.insert(schema.slots).values({
          id: `slot-${machine.id}-${i + 1}`,
          machineId: machine.id,
          productId: product.id,
          labelCode: `${String.fromCharCode(65 + Math.floor(i / 5))}${(i % 5) + 1}`, // A1, A2, etc.
          price: product.recommendedPrice,
          capacity: 10,
          currentQuantity: Math.floor(Math.random() * 5), // Random 0-4 (below threshold)
          sequenceNumber: i + 1,
          organizationId: orgId,
          createdBy: adminUserId,
          updatedBy: adminUserId,
        }).onConflictDoNothing()
        slotCount++
      }
    }

    console.log("Created slots:", slotCount)

    // Create inventory for products
    for (const product of productData) {
      await db.insert(schema.inventory).values({
        productId: product.id,
        organizationId: orgId,
        storage: 100, // 100 units in storage
        machines: 0,
      }).onConflictDoNothing()
    }

    console.log("Created inventory records:", productData.length)

    console.log("Database seed completed successfully!")
    console.log("\nYou can now login with:")
    console.log("Email: admin@demo.com")
    console.log("Password: demo123")

  } catch (error) {
    console.error("Error seeding database:", error)
    throw error
  }
}

// Run the seed
seed()
  .then(() => {
    console.log("Seed completed")
    process.exit(0)
  })
  .catch((error) => {
    console.error("Seed failed:", error)
    process.exit(1)
  })