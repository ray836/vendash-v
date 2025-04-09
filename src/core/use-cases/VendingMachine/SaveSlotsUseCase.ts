import { SlotRepository } from "@/core/domain/interfaces/SlotRepository"
import { VendingMachineRepository } from "@/core/domain/interfaces/VendingMachineRepository"
import { PublicSlotDTO } from "@/core/domain/DTOs/slotDTOs"
import { Slot } from "@/core/domain/entities/Slot"
import { randomUUID } from "node:crypto"

export class SaveSlotsUseCase {
  constructor(
    private readonly slotRepository: SlotRepository,
    private readonly machineRepository: VendingMachineRepository
  ) {}

  async execute(machineId: string, slots: PublicSlotDTO[]): Promise<void> {
    try {
      // Get the vending machine to access its cardReaderId
      const machine = await this.machineRepository.getVendingMachine(machineId)
      if (!machine) {
        throw new Error("Vending machine not found")
      }

      // Map publicSlotDTO to Slot with cardReaderId from machine
      const slotEntities = slots.map(
        (s) =>
          new Slot({
            ...s,
            cardReaderId: machine.props.cardReaderId,
            createdBy: "1",
            updatedBy: "1",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            id: s.id || randomUUID(),
            sequenceNumber: slots.indexOf(s) + 1,
          })
      )

      await this.slotRepository.saveSlots(machineId, slotEntities)
    } catch (error) {
      console.error("Failed to save slots:", error)
      throw new Error("Failed to save machine configuration")
    }
  }
}
