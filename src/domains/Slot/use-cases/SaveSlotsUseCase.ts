import { ISlotRepository } from "../interfaces/ISlotRepository"
import { IVendingMachineRepository } from "@/domains/VendingMachine/interfaces/IVendingMachineRepository"
import { SaveSlotRequest } from "../schemas/SaveSlotsSchemas"
export class SaveSlotsUseCase {
  constructor(
    private readonly slotRepository: ISlotRepository,
    private readonly machineRepository: IVendingMachineRepository
  ) {}

  async execute(request: SaveSlotRequest): Promise<void> {
    try {
      // Get the vending machine to access its cardReaderId
      const machine = await this.machineRepository.findById(request.machineId)
      if (!machine) {
        throw new Error("Vending machine not found")
      }

      await this.slotRepository.saveSlots(
        request.machineId,
        request.userId,
        request.slots
      )
    } catch (error) {
      console.error("Failed to save slots:", error)
      throw new Error("Failed to save machine configuration")
    }
  }
}
