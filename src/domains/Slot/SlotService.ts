import { SlotRepository } from "@/infrastructure/repositories/SlotRepository"
import { VendingMachineRepository } from "@/infrastructure/repositories/VendingMachineRepository"
import { SaveSlotRequest } from "./schemas/SaveSlotsSchemas"

export async function saveSlots(
  slotRepo: SlotRepository,
  machineRepo: VendingMachineRepository,
  request: SaveSlotRequest
): Promise<void> {
  const machine = await machineRepo.findById(request.machineId)
  if (!machine) throw new Error("Vending machine not found")

  await slotRepo.saveSlots(request.machineId, request.userId, request.slots)
}
