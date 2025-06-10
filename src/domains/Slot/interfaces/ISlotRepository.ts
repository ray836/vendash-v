import { Slot } from "../entities/Slot"
import { PublicSlotWithProductDTO } from "../schemas/SlotSchemas"
import { SaveSlot } from "../schemas/SaveSlotsSchemas"

export interface ISlotRepository {
  findById(id: string): Promise<Slot | null>
  findByMachineId(machineId: string): Promise<Slot[]>
  findByOrganizationId(organizationId: string): Promise<Slot[]>
  create(slot: Slot): Promise<Slot>
  update(slot: Slot): Promise<Slot>
  delete(id: string): Promise<void>
  updateSlotQuantity(slotId: string, newQuantity: number): Promise<void>
  saveSlots(
    machineId: string,
    userId: string,
    updatedSlotsForMachine: SaveSlot[]
  ): Promise<void>
  getSlotsWithProducts(machineId: string): Promise<PublicSlotWithProductDTO[]>
}
