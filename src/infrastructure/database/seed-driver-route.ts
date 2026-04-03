import { drizzle } from "drizzle-orm/neon-serverless"
import { neonConfig, Pool } from "@neondatabase/serverless"
import { config } from "dotenv"
import * as schema from "./schema"
import { nanoid } from "nanoid"
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

async function seedDriverRoute() {
  console.log("🚚 Creating route for driver ID 1 (Ray Grant)...\n")

  try {
    const orgId = "org-demo-001"
    const driverId = "1" // Ray Grant - matches the actual user in database
    const adminUserId = "user-admin-001"

    // Get TODAY'S date (this is critical!)
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    console.log(`📅 Today's date: ${today.toISOString()}`)

    // Create a route
    const routeId = `route-${nanoid()}`

    await db.insert(schema.routes).values({
      id: routeId,
      name: "Downtown Route",
      description: "Morning route covering downtown locations",
      organizationId: orgId,
      assignedToUserId: driverId,
      scheduledDate: today,
      estimatedDuration: 120, // 2 hours
      status: "PLANNED",
      createdBy: adminUserId,
      updatedBy: adminUserId,
    })

    console.log(`✅ Created route: ${routeId}`)

    // Create route assignment for today
    const assignmentId = `assignment-${nanoid()}`

    await db.insert(schema.routeAssignments).values({
      id: assignmentId,
      routeId: routeId,
      assignedToUserId: driverId,
      scheduledDate: today,
      status: "scheduled",
      estimatedDuration: 120,
      createdBy: adminUserId,
    })

    console.log(`✅ Assigned route to driver ID 1 (Ray Grant)`)

    // Add stops to the route with machines
    const stopsData = [
      {
        locationId: "loc-001",
        order: 1,
        estimatedTime: 30,
        notes: "Use side entrance",
        machines: ["vm-001", "vm-002"] // TechHub HQ has 2 machines
      },
      {
        locationId: "loc-002",
        order: 2,
        estimatedTime: 25,
        notes: null,
        machines: ["vm-003"] // Riverside Office has 1 machine
      },
      {
        locationId: "loc-003",
        order: 3,
        estimatedTime: 20,
        notes: null,
        machines: ["vm-004"] // Metro Shopping has 1 machine
      },
      {
        locationId: "loc-004",
        order: 4,
        estimatedTime: 30,
        notes: "Check with front desk first",
        machines: ["vm-005"] // University Library has 1 machine
      },
    ]

    let totalMachines = 0
    let preKitCount = 0
    let itemCount = 0

    for (const stop of stopsData) {
      const stopId = `stop-${nanoid()}`

      await db.insert(schema.routeStops).values({
        id: stopId,
        routeId: routeId,
        locationId: stop.locationId,
        order: stop.order,
        isComplete: false,
        estimatedTime: stop.estimatedTime,
        notes: stop.notes,
      })

      console.log(`  ✅ Stop ${stop.order} - Location ${stop.locationId} (${stop.machines.length} machine${stop.machines.length > 1 ? 's' : ''})`)
      totalMachines += stop.machines.length

      // Create pre-kits for this stop's machines
      for (const machineId of stop.machines) {
        const preKitId = `prekit-${nanoid()}`

        await db.insert(schema.preKits).values({
          id: preKitId,
          routeStopId: stopId,
          machineId: machineId,
          status: "OPEN",
          createdBy: adminUserId,
          updatedBy: adminUserId,
        })

        preKitCount++

        // Add pre-kit items for each slot in the machine
        // Based on seed data, each machine has 5 slots (slot-{machineId}-1 through slot-{machineId}-5)
        for (let slotNum = 1; slotNum <= 5; slotNum++) {
          const slotId = `slot-${machineId}-${slotNum}`
          const itemId = `prekit-item-${nanoid()}`

          // Get the slot to find the product_id
          const slot = await db.query.slots.findFirst({
            where: (slots, { eq }) => eq(slots.id, slotId)
          })

          if (!slot) {
            console.log(`    ⚠️  Slot ${slotId} not found, skipping...`)
            continue
          }

          // Random quantity between 3-7 items to load
          const quantity = Math.floor(Math.random() * 5) + 3

          await db.insert(schema.preKitItems).values({
            id: itemId,
            preKitId: preKitId,
            productId: slot.productId ?? '', // Get product from the slot
            slotId: slotId,
            quantity: quantity,
            createdBy: adminUserId,
            updatedBy: adminUserId,
          })

          itemCount++
        }

        console.log(`  ✅ Pre-kit for ${machineId} (5 items)`)
      }
    }

    console.log(`\n✅ Created ${preKitCount} pre-kits with ${itemCount} total items`)

    console.log("\n" + "=".repeat(60))
    console.log("🎉 ROUTE CREATED SUCCESSFULLY!")
    console.log("=".repeat(60))
    console.log("\n📋 Summary:")
    console.log(`   Route ID: ${routeId}`)
    console.log(`   Route Name: Downtown Route`)
    console.log(`   Driver: John Doe (driver-001)`)
    console.log(`   Date: ${today.toLocaleDateString()}`)
    console.log(`   Stops: ${stopsData.length}`)
    console.log(`   Machines: ${totalMachines}`)
    console.log(`   Pre-kits: ${preKitCount}`)
    console.log(`   Items: ${itemCount}`)
    console.log("\n✅ You can now open the mobile app and pull to refresh!")
    console.log("   The route should appear immediately.\n")

  } catch (error) {
    console.error("❌ Error seeding driver route:", error)
    throw error
  } finally {
    await pool.end()
  }
}

// Run the seed
seedDriverRoute()
  .then(() => {
    console.log("✅ Script completed successfully")
    process.exit(0)
  })
  .catch((error) => {
    console.error("❌ Script failed:", error)
    process.exit(1)
  })
