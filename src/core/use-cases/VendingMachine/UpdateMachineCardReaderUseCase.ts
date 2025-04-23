import { VendingMachineRepository } from "@/core/domain/interfaces/VendingMachineRepository"
import { SlotRepository } from "@/core/domain/interfaces/SlotRepository"
import {
  PublicVendingMachineDTO,
  BaseVendingMachineDTOToPublicVendingMachineDTO,
} from "@/core/domain/DTOs/vendingMachineDTOs"
export class UpdateMachineCardReaderUseCase {
  constructor(
    private readonly vendingMachineRepository: VendingMachineRepository,
    private readonly slotRepository: SlotRepository
  ) {}

  async execute(
    machineId: string,
    cardReaderId: string,
    userId: string
  ): Promise<PublicVendingMachineDTO> {
    const currentMachine =
      await this.vendingMachineRepository.getVendingMachine(machineId)
    if (!currentMachine) {
      throw new Error("Machine not found")
    }
    console.log("current machine", currentMachine)
    const newMachine = await this.vendingMachineRepository.updateVendingMachine(
      {
        ...currentMachine.props,
        cardReaderId: cardReaderId,
      },
      userId,
      machineId
    )
    console.log("got here???")
    // update all slots with the new cardReaderId
    const slots = await this.slotRepository.getSlots(machineId)
    for (const slot of slots) {
      slot.props.cardReaderId = cardReaderId
      await this.slotRepository.updateSlot(slot, userId)
    }
    console.log("updated all slots")
    return BaseVendingMachineDTOToPublicVendingMachineDTO(newMachine.props)
  }
}
