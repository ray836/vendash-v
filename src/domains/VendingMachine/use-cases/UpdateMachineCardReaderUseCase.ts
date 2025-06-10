import { IVendingMachineRepository } from "../interfaces/IVendingMachineRepository"
import { ISlotRepository } from "@/domains/Slot/interfaces/ISlotRepository"
import { Slot } from "@/domains/Slot/entities/Slot"
import { PublicVendingMachineDTO } from "../schemas/vendingMachineDTOs"

export class UpdateMachineCardReaderUseCase {
  constructor(
    private readonly vendingMachineRepository: IVendingMachineRepository,
    private readonly slotRepository: ISlotRepository
  ) {}

  async execute(
    machineId: string,
    cardReaderId: string,
    userId: string
  ): Promise<PublicVendingMachineDTO> {
    const currentMachine = await this.vendingMachineRepository.findById(
      machineId
    )
    if (!currentMachine) {
      throw new Error("Machine not found")
    }

    // Update the machine with the new cardReaderId
    const updatedMachine = currentMachine.update({
      cardReaderId: cardReaderId,
    })

    const savedMachine = await this.vendingMachineRepository.update(
      updatedMachine
    )

    // Update all slots with the new cardReaderId
    const slots = await this.slotRepository.findByMachineId(machineId)
    for (const slot of slots) {
      const updatedSlot = Slot.create({
        ...slot.toJSON(),
        cardReaderId: cardReaderId,
        updatedBy: userId,
      })
      await this.slotRepository.update(updatedSlot)
    }

    const publicDTO: PublicVendingMachineDTO = savedMachine.toPublicDTO()
    return publicDTO
  }
}
