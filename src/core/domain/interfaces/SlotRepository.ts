import { PublicSlotWithProductDTO } from "@/core/domain/DTOs/slotDTOs"
import { Slot } from "@/core/domain/entities/Slot"
export interface SlotRepository {
  findByOrganizationId(organizationId: string): Promise<Slot[]>
  saveSlots(machineId: string, slots: Slot[]): Promise<void>
  getSlots(machineId: string): Promise<Slot[]>
  getSlotsWithProducts(machineId: string): Promise<PublicSlotWithProductDTO[]>
  updateSlot(slot: Slot, userId: string): Promise<void>
}
