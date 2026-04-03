import {
  preKits,
  preKitItems,
  products,
  vendingMachines,
  slots,
  routeStops,
  routes,
  locations,
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
    routeStopId: string | null
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
  machine?: { id: string } | null
  route?: { id: string; name: string } | null
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

export class PreKitRepository {
  constructor(private readonly database: typeof db) {}

  async create(preKit: PreKit, items: PreKitItem[], userId: string): Promise<PublicPreKit> {
    await this.database.insert(preKits).values({
      id: preKit.id,
      machineId: preKit.machineId,
      routeStopId: preKit.routeStopId ?? null,
      scheduledDate: preKit.scheduledDate ?? null,
      status: PreKitStatus.OPEN,
      lastRecalculatedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: userId,
      updatedBy: userId,
    })

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

    const itemsWithProducts = await Promise.all(
      insertedItems.map(async (item) => {
        const [product, slot] = await Promise.all([
          this.database.query.products.findFirst({ where: eq(products.id, item.productId) }),
          this.database.query.slots.findFirst({ where: eq(slots.id, item.slotId) }),
        ])
        if (!product) throw new Error(`Product not found for pre-kit item ${item.id}`)
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

    return { id: preKit.id, machineId: preKit.machineId, status: preKit.status, items: itemsWithProducts }
  }

  async getByMachineId(machineId: string): Promise<PublicPreKit | null> {
    const result = (await this.database
      .select({
        preKit: { id: preKits.id, machineId: preKits.machineId, status: preKits.status },
        items: { id: preKitItems.id, preKitId: preKitItems.preKitId, productId: preKitItems.productId, quantity: preKitItems.quantity, slotId: preKitItems.slotId },
        product: { image: products.image, name: products.name },
        slot: { currentQuantity: slots.currentQuantity, capacity: slots.capacity, labelCode: slots.labelCode },
      })
      .from(preKits)
      .leftJoin(preKitItems, eq(preKits.id, preKitItems.preKitId))
      .leftJoin(products, eq(preKitItems.productId, products.id))
      .leftJoin(slots, eq(preKitItems.slotId, slots.id))
      .where(eq(preKits.machineId, machineId))) as PreKitQueryResult[]

    if (!result || result.length === 0) return null

    const preKit = result[0].preKit
    const pkItems = result.filter(isValidPreKitRow).map(mapToPublicPreKitItem)

    return { id: preKit.id, machineId: preKit.machineId, status: preKit.status as PreKitStatus, items: pkItems }
  }

  async getOrgPreKits(orgId: string): Promise<PublicPreKit[]> {
    const result = (await this.database
      .select({
        preKit: { id: preKits.id, machineId: preKits.machineId, status: preKits.status, routeStopId: preKits.routeStopId },
        machine: { id: vendingMachines.id, locationId: vendingMachines.locationId },
        items: { id: preKitItems.id, preKitId: preKitItems.preKitId, productId: preKitItems.productId, quantity: preKitItems.quantity, slotId: preKitItems.slotId },
        product: { image: products.image, name: products.name },
        slot: { currentQuantity: slots.currentQuantity, capacity: slots.capacity, labelCode: slots.labelCode },
        route: { id: routes.id, name: routes.name },
        location: { name: locations.name },
      })
      .from(preKits)
      .leftJoin(vendingMachines, eq(preKits.machineId, vendingMachines.id))
      .leftJoin(locations, eq(vendingMachines.locationId, locations.id))
      .leftJoin(preKitItems, eq(preKits.id, preKitItems.preKitId))
      .leftJoin(products, eq(preKitItems.productId, products.id))
      .leftJoin(slots, eq(preKitItems.slotId, slots.id))
      .leftJoin(routeStops, eq(preKits.routeStopId, routeStops.id))
      .leftJoin(routes, eq(routeStops.routeId, routes.id))
      .where(eq(vendingMachines.organizationId, orgId))) as PreKitQueryResult[]

    if (!result) return []

    const preKitsMap = new Map<string, PublicPreKit>()
    for (const row of result) {
      if (!preKitsMap.has(row.preKit.id)) {
        preKitsMap.set(row.preKit.id, {
          id: row.preKit.id,
          machineId: row.preKit.machineId,
          status: row.preKit.status as PreKitStatus,
          items: [],
          routeId: row.route?.id || null,
          routeName: row.route?.name || null,
          routeStopId: row.preKit.routeStopId || null,
          locationName: (row as any).location?.name || null,
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
    await this.database.delete(preKitItems).where(eq(preKitItems.preKitId, id))
    await this.database.delete(preKits).where(eq(preKits.id, id))
  }

  async getItems(preKitId: string): Promise<PreKitItem[]> {
    const items = await this.database.query.preKitItems.findMany({
      where: eq(preKitItems.preKitId, preKitId),
    })
    return items.map((item) => new PreKitItem({
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

  async updateItems(preKitId: string, items: PreKitItem[], userId: string): Promise<void> {
    await this.database.delete(preKitItems).where(eq(preKitItems.preKitId, preKitId))
    await this.database.insert(preKitItems).values(
      items.map((item) => ({
        id: item.id,
        preKitId,
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

  async updateStatus(preKitId: string, status: string, userId: string): Promise<void> {
    await this.database
      .update(preKits)
      .set({ status, lastRecalculatedAt: new Date(), updatedAt: new Date(), updatedBy: userId })
      .where(eq(preKits.id, preKitId))
  }

  async findById(id: string): Promise<PreKit | null> {
    const result = await this.database.select().from(preKits).where(eq(preKits.id, id)).limit(1)
    if (result.length === 0) return null
    const preKit = result[0]
    return new PreKit({
      id: preKit.id,
      machineId: preKit.machineId,
      routeStopId: preKit.routeStopId ?? undefined,
      scheduledDate: preKit.scheduledDate ?? undefined,
      status: preKit.status as PreKitStatus,
      lastRecalculatedAt: preKit.lastRecalculatedAt ?? undefined,
      createdAt: preKit.createdAt,
      updatedAt: preKit.updatedAt,
      createdBy: preKit.createdBy,
      updatedBy: preKit.updatedBy ?? "",
    })
  }

  async findByMachineId(machineId: string): Promise<PreKit[]> {
    const result = await this.database.select().from(preKits).where(eq(preKits.machineId, machineId))
    return result.map((preKit) => new PreKit({
      id: preKit.id,
      machineId: preKit.machineId,
      routeStopId: preKit.routeStopId ?? undefined,
      scheduledDate: preKit.scheduledDate ?? undefined,
      status: preKit.status as PreKitStatus,
      lastRecalculatedAt: preKit.lastRecalculatedAt ?? undefined,
      createdAt: preKit.createdAt,
      updatedAt: preKit.updatedAt,
      createdBy: preKit.createdBy,
      updatedBy: preKit.updatedBy ?? "",
    }))
  }

  async updatePreKitItems(preKitId: string, items: PreKitItem[], userId: string): Promise<void> {
    await this.database.delete(preKitItems).where(eq(preKitItems.preKitId, preKitId))
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
