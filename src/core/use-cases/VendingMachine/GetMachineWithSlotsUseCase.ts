import { VendingMachineRepository } from "@/core/domain/interfaces/VendingMachineRepository"
import { SlotRepository } from "@/core/domain/interfaces/SlotRepository"
import { PublicVendingMachineDTO } from "@/core/domain/DTOs/vendingMachineDTOs"
import { PublicSlotWithProductDTO } from "@/core/domain/DTOs/slotDTOs"

export interface MachineWithSlotsDTO {
  machine: PublicVendingMachineDTO
  slots: PublicSlotWithProductDTO[]
  revenue: {
    daily: number
    weekly: number
    monthly: number
  }
  alerts: string[]
  lastRestocked: Date
  lastMaintenance: Date
  setup: {
    status: string
    percentage: number
  }
}

export class GetMachineWithSlotsUseCase {
  constructor(
    private readonly machineRepository: VendingMachineRepository,
    private readonly slotRepository: SlotRepository
  ) {}

  async execute(machineId: string): Promise<MachineWithSlotsDTO | null> {
    try {
      const machine = await this.machineRepository.getVendingMachine(machineId)
      if (!machine) {
        return null
      }

      const slots = await this.slotRepository.getSlotsWithProducts(machineId)

      return {
        machine: {
          id: machine.props.id,
          type: machine.props.type,
          locationId: machine.props.locationId,
          model: machine.props.model,
          notes: machine.props.notes,
          cardReaderId: machine.props.cardReaderId,
          status: machine.props.status,
          organizationId: machine.props.organizationId,
        },
        slots,
        revenue: {
          daily: 0,
          weekly: 0,
          monthly: 0,
        },
        alerts: [],
        lastRestocked: new Date(),
        lastMaintenance: new Date(),
        setup: {
          status: "Not Configured",
          percentage: 0,
        },
      }
    } catch (error) {
      console.error("Failed to get machine with slots:", error)
      throw new Error("Failed to get machine with slots")
    }
  }
}
