import {
  PublicSlotDTO,
  PublicSlotWithProductDTO,
} from "@/core/domain/DTOs/slotDTOs"
import { Slot } from "@/core/domain/entities/Slot"
export interface SlotRepository {
  saveSlots(machineId: string, slots: Slot[]): Promise<void>
  getSlots(machineId: string): Promise<PublicSlotDTO[]>
  getSlotsWithProducts(machineId: string): Promise<PublicSlotWithProductDTO[]>
}
