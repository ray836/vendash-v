import { IPreKitRepository } from "@/domains/PreKit/interfaces/IPreKitRepository"
import {
  preKits,
  preKitItems,
  products,
  vendingMachines,
  slots,
} from "../database/schema"
import { eq, and } from "drizzle-orm"
import { PreKit, PreKitItem } from "@/domains/PreKit/entities/PreKit"
import {
  BasePreKitItem,
  PreKitStatus,
  PublicPreKit,
  PublicPreKitItem,
} from "@/domains/PreKit/schemas/PrekitSchemas"
import { db } from "../database"

type PreKitQueryResult = {
  preKit: {
    id: string
    machineId: string
    status: string
  }
  items: {
    id: string
    preKitId: string
    productId: string
    quantity: number
    slotId: string
  } | null
  product: {
    image: string
    name: string
  } | null
  slot: {
    currentQuantity: number | null
    capacity: number | null
    labelCode: string
  } | null
  machine?: {
    id: string
  } | null
}

type ValidPreKitRow = PreKitQueryResult & {
  items: NonNullable<PreKitQueryResult["items"]>
  product: NonNullable<PreKitQueryResult["product"]>
}

function isValidPreKitRow(row: PreKitQueryResult): row is ValidPreKitRow {
  return row.items !== null && row.product !== null
}

function mapToPublicPreKitItem(row: ValidPreKitRow): PublicPreKitItem {
  return {
    id: row.items.id,
    preKitId: row.items.preKitId,
    productId: row.items.productId,
    quantity: row.items.quantity,
    slotId: row.items.slotId,
    productImage: row.product.image,
    productName: row.product.name,
    currentQuantity: row.slot?.currentQuantity ?? 0,
    capacity: row.slot?.capacity ?? 10,
    slotCode: row.slot?.labelCode ?? "",
  }
}

export class DrizzlePreKitRepository implements IPreKitRepository {
  constructor(private readonly database: typeof db) {}

  async create(
    preKit: PreKit,
    items: PreKitItem[],
    userId: string
  ): Promise<PublicPreKit> {
    // Insert pre-kit
    console.log("preKit", preKit)
    console.log("createdBy", userId)
    await this.database.insert(preKits).values({
      id: preKit.id,
      machineId: preKit.machineId,
      status: PreKitStatus.OPEN,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: userId,
      updatedBy: userId,
    })

    // Insert pre-kit items
    const insertedItems = await this.database
      .insert(preKitItems)
      .values(
        items.map((item) => ({
          id: crypto.randomUUID(),
          preKitId: preKit.id,
          productId: item.productId,
          quantity: item.quantity,
          slotId: item.slotId,
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: userId,
          updatedBy: userId,
        }))
      )
      .returning()

    // Get product and slot information for each item
    const itemsWithProducts = await Promise.all(
      insertedItems.map(async (item) => {
        const [product, slot] = await Promise.all([
          this.database.query.products.findFirst({
            where: eq(products.id, item.productId),
          }),
          this.database.query.slots.findFirst({
            where: eq(slots.id, item.slotId),
          }),
        ])

        if (!product) {
          throw new Error(`Product not found for pre-kit item ${item.id}`)
        }

        return {
          id: item.id,
          preKitId: item.preKitId,
          productId: item.productId,
          quantity: item.quantity,
          slotId: item.slotId,
          productImage: product.image,
          productName: product.name,
          currentQuantity: slot?.currentQuantity ?? 0,
          capacity: slot?.capacity ?? 10,
          slotCode: slot?.labelCode ?? "",
        }
      })
    )

    return {
      id: preKit.id,
      machineId: preKit.machineId,
      status: preKit.status,
      items: itemsWithProducts,
    }
  }

  async getByMachineId(machineId: string): Promise<PublicPreKit | null> {
    const result = (await this.database
      .select({
        preKit: {
          id: preKits.id,
          machineId: preKits.machineId,
          status: preKits.status,
        },
        items: {
          id: preKitItems.id,
          preKitId: preKitItems.preKitId,
          productId: preKitItems.productId,
          quantity: preKitItems.quantity,
          slotId: preKitItems.slotId,
        },
        product: {
          image: products.image,
          name: products.name,
        },
        slot: {
          currentQuantity: slots.currentQuantity,
          capacity: slots.capacity,
          labelCode: slots.labelCode,
        },
      })
      .from(preKits)
      .leftJoin(preKitItems, eq(preKits.id, preKitItems.preKitId))
      .leftJoin(products, eq(preKitItems.productId, products.id))
      .leftJoin(slots, eq(preKitItems.slotId, slots.id))
      .where(
        and(
          eq(preKits.machineId, machineId),
          eq(preKits.status, PreKitStatus.OPEN)
        )
      )) as PreKitQueryResult[]

    if (!result || result.length === 0) return null

    const preKit = result[0].preKit
    const items = result.filter(isValidPreKitRow).map(mapToPublicPreKitItem)

    return {
      id: preKit.id,
      machineId: preKit.machineId,
      status: preKit.status as PreKitStatus,
      items,
    }
  }

  async getOrgPreKits(orgId: string): Promise<PublicPreKit[]> {
    const result = (await this.database
      .select({
        preKit: {
          id: preKits.id,
          machineId: preKits.machineId,
          status: preKits.status,
        },
        machine: {
          id: vendingMachines.id,
        },
        items: {
          id: preKitItems.id,
          preKitId: preKitItems.preKitId,
          productId: preKitItems.productId,
          quantity: preKitItems.quantity,
          slotId: preKitItems.slotId,
        },
        product: {
          image: products.image,
          name: products.name,
        },
        slot: {
          currentQuantity: slots.currentQuantity,
          capacity: slots.capacity,
          labelCode: slots.labelCode,
        },
      })
      .from(preKits)
      .leftJoin(vendingMachines, eq(preKits.machineId, vendingMachines.id))
      .leftJoin(preKitItems, eq(preKits.id, preKitItems.preKitId))
      .leftJoin(products, eq(preKitItems.productId, products.id))
      .leftJoin(slots, eq(preKitItems.slotId, slots.id))
      .where(eq(vendingMachines.organizationId, orgId))) as PreKitQueryResult[]

    if (!result) return []

    // Group items by pre-kit
    const preKitsMap = new Map<string, PublicPreKit>()

    for (const row of result) {
      if (!preKitsMap.has(row.preKit.id)) {
        preKitsMap.set(row.preKit.id, {
          id: row.preKit.id,
          machineId: row.preKit.machineId,
          status: row.preKit.status as PreKitStatus,
          items: [],
        })
      }

      if (isValidPreKitRow(row)) {
        const preKit = preKitsMap.get(row.preKit.id)!
        preKit.items.push(mapToPublicPreKitItem(row))
      }
    }

    return Array.from(preKitsMap.values())
  }

  async delete(id: string): Promise<void> {
    // Delete pre-kit items first (due to foreign key constraint)
    await this.database.delete(preKitItems).where(eq(preKitItems.preKitId, id))

    // Delete pre-kit
    await this.database.delete(preKits).where(eq(preKits.id, id))
  }

  // Helper method for internal use
  private async getPreKitItems(preKitId: string): Promise<BasePreKitItem[]> {
    const items = await this.database.query.preKitItems.findMany({
      where: eq(preKitItems.preKitId, preKitId),
    })

    return items.map((item) => ({
      id: item.id,
      preKitId: item.preKitId,
      productId: item.productId,
      quantity: item.quantity,
      slotId: item.slotId,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      createdBy: item.createdBy,
      updatedBy: item.updatedBy,
    }))
  }

  async getItems(preKitId: string): Promise<PreKitItem[]> {
    const items = await this.database.query.preKitItems.findMany({
      where: eq(preKitItems.preKitId, preKitId),
    })

    return items.map((item) => {
      return new PreKitItem({
        id: item.id,
        preKitId: item.preKitId,
        productId: item.productId,
        quantity: item.quantity,
        slotId: item.slotId,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
        createdBy: item.createdBy,
        updatedBy: item.updatedBy,
      })
    })
  }

  async updateItems(
    preKitId: string,
    items: PreKitItem[],
    userId: string
  ): Promise<void> {
    // Delete existing items
    await this.database
      .delete(preKitItems)
      .where(eq(preKitItems.preKitId, preKitId))
    // Insert new items
    await this.database.insert(preKitItems).values(
      items.map((item) => ({
        id: item.id,
        preKitId: preKitId,
        productId: item.productId,
        quantity: item.quantity,
        slotId: item.slotId,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: userId,
        updatedBy: userId,
      }))
    )
  }

  async updateStatus(
    preKitId: string,
    status: string,
    userId: string
  ): Promise<void> {
    await this.database
      .update(preKits)
      .set({
        status,
        updatedAt: new Date(),
        updatedBy: userId,
      })
      .where(eq(preKits.id, preKitId))
  }

  async findById(id: string): Promise<PreKit | null> {
    const result = await this.database
      .select()
      .from(preKits)
      .where(eq(preKits.id, id))
      .limit(1)

    if (result.length === 0) {
      return null
    }

    const preKit = result[0]
    return new PreKit({
      id: preKit.id,
      machineId: preKit.machineId,
      status: preKit.status as PreKitStatus,
      createdAt: preKit.createdAt,
      updatedAt: preKit.updatedAt,
      createdBy: preKit.createdBy,
      updatedBy: preKit.updatedBy ?? "",
    })
  }

  async getMachinePreKits(machineId: string): Promise<PreKit[]> {
    const result = await this.database
      .select()
      .from(preKits)
      .where(eq(preKits.machineId, machineId))

    return result.map(
      (preKit) =>
        new PreKit({
          id: preKit.id,
          machineId: preKit.machineId,
          status: preKit.status as PreKitStatus,
          createdAt: preKit.createdAt,
          updatedAt: preKit.updatedAt,
          createdBy: preKit.createdBy,
          updatedBy: preKit.updatedBy ?? "",
        })
    )
  }

  async updatePreKitItems(
    preKitId: string,
    items: PreKitItem[],
    userId: string
  ): Promise<void> {
    // First delete existing items
    await this.database
      .delete(preKitItems)
      .where(eq(preKitItems.preKitId, preKitId))

    // Then insert new items
    if (items.length > 0) {
      await this.database.insert(preKitItems).values(
        items.map((item) => ({
          id: item.id,
          preKitId: item.preKitId,
          productId: item.productId,
          quantity: item.quantity,
          slotId: item.slotId,
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: userId,
          updatedBy: userId,
        }))
      )
    }
  }
}
