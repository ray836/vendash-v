"use server"

import { db } from "@/infrastructure/database"
import { VendingMachineRepository } from "@/infrastructure/repositories/VendingMachineRepository"
import { LocationRepository } from "@/infrastructure/repositories/LocationRepository"
import { TransactionRepository } from "@/infrastructure/repositories/TransactionRepository"
import * as VendingMachineService from "@/domains/VendingMachine/VendingMachineService"
import * as LocationService from "@/domains/Location/LocationService"
import * as TransactionService from "@/domains/Transaction/TransactionService"
import { MachineStatus, MachineType } from "@/domains/VendingMachine/entities/VendingMachine"
import { auth } from "@/lib/auth"

export async function createMachine(machine: {
  type: MachineType
  locationName: string
  model: string
  notes?: string
  cardReaderId?: string
}) {
  const session = await auth()
  if (!session) throw new Error('Unauthorized')
  const { organizationId } = session.user

  const locationRepo = new LocationRepository(db)
  const location = await LocationService.createLocation(locationRepo, {
    name: machine.locationName,
    address: machine.locationName,
    organizationId,
  })

  const machineRepo = new VendingMachineRepository(db)
  const result = await VendingMachineService.createMachine(machineRepo, {
    type: machine.type,
    locationId: location.id,
    model: machine.model,
    notes: machine.notes,
    organizationId,
    cardReaderId: machine.cardReaderId,
  })
  return JSON.stringify(result)
}

export async function getMachines() {
  const session = await auth()
  if (!session) throw new Error('Unauthorized')
  const { organizationId } = session.user

  try {
    const machineRepo = new VendingMachineRepository(db)
    const locationRepo = new LocationRepository(db)
    const machines = await VendingMachineService.getMachines(machineRepo, locationRepo, organizationId)
    return JSON.stringify(machines)
  } catch (error) {
    console.error("Failed to fetch machines:", error)
    throw new Error("Failed to fetch machines")
  }
}

export async function updateMachineStatus(id: string, status: MachineStatus) {
  try {
    const machineRepo = new VendingMachineRepository(db)
    const result = await VendingMachineService.updateMachineStatus(machineRepo, id, { status })
    return JSON.stringify({ success: true, data: result })
  } catch (error) {
    return JSON.stringify({ success: false, error: error instanceof Error ? error.message : "An unknown error occurred", data: null })
  }
}

export async function getLocations() {
  const session = await auth()
  if (!session) throw new Error('Unauthorized')
  const { organizationId } = session.user

  const locationRepo = new LocationRepository(db)
  return LocationService.getLocations(locationRepo, organizationId)
}

export async function deleteMachine(id: string) {
  const machineRepo = new VendingMachineRepository(db)
  await VendingMachineService.deleteMachine(machineRepo, id)
}

export async function getMachinePerformance() {
  const session = await auth()
  if (!session) throw new Error("Unauthorized")
  const { organizationId } = session.user

  const machineRepo = new VendingMachineRepository(db)
  const locationRepo = new LocationRepository(db)
  const txRepo = new TransactionRepository(db)

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  const [machines, transactions] = await Promise.all([
    VendingMachineService.getMachines(machineRepo, locationRepo, organizationId),
    TransactionService.getOrgTransactions(txRepo, organizationId, startOfMonth, now),
  ])

  const results = machines
    .filter((m) => m.cardReaderId)
    .map((m) => {
      const machineTxs = transactions.filter((t) => t.cardReaderId === m.cardReaderId)
      let revenue = 0
      let cogs = 0
      for (const tx of machineTxs) {
        revenue += tx.total
        for (const item of tx.items ?? []) {
          const cost = Number(item.product?.caseCost ?? 0)
          const size = Number(item.product?.caseSize ?? 0)
          if (cost > 0 && size > 0) cogs += (cost / size) * (item.quantity ?? 1)
        }
      }
      const profit = cogs > 0 ? Math.round((revenue - cogs) * 100) / 100 : null
      const margin = revenue > 0 && profit !== null ? Math.round((profit / revenue) * 100) : null
      return {
        id: m.id,
        locationName: m.locationName ?? null,
        revenue: Math.round(revenue * 100) / 100,
        profit,
        margin,
        txCount: machineTxs.length,
      }
    })
    .filter((m) => m.revenue > 0 || m.txCount > 0)
    .sort((a, b) => (b.margin ?? -1) - (a.margin ?? -1))

  return results
}
