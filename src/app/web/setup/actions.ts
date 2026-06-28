"use server"

import { db } from "@/infrastructure/database"
import { VendingMachineRepository } from "@/infrastructure/repositories/VendingMachineRepository"
import { ProductRepository } from "@/infrastructure/repositories/ProductRepository"
import { SlotRepository } from "@/infrastructure/repositories/SlotRepository"
import { auth } from "@/lib/auth"

export type SetupStatus = {
  machine: { id: string; model: string; type: string; cardReaderId: string | null } | null
  productCount: number
  hasConfiguredSlots: boolean
}

/** Snapshot of the org's setup progress, used to drive the wizard checklist. */
export async function getSetupStatus(): Promise<SetupStatus> {
  const session = await auth()
  if (!session) throw new Error("Unauthorized")
  const { organizationId } = session.user

  const machineRepo = new VendingMachineRepository(db)
  const productRepo = new ProductRepository(db)
  const slotRepo = new SlotRepository(db)

  const [machines, products] = await Promise.all([
    machineRepo.findByOrganizationId(organizationId),
    productRepo.findByOrganizationId(organizationId),
  ])

  const machine = machines[0] ?? null
  let hasConfiguredSlots = false
  if (machine) {
    const slots = await slotRepo.findByMachineId(machine.id)
    hasConfiguredSlots = slots.some((s) => !!s.productId)
  }

  return {
    machine: machine
      ? { id: machine.id, model: machine.model, type: machine.type, cardReaderId: machine.cardReaderId ?? null }
      : null,
    productCount: products.length,
    hasConfiguredSlots,
  }
}
