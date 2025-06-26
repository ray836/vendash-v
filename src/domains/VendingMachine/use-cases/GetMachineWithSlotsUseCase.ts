import { IVendingMachineRepository } from "../interfaces/IVendingMachineRepository"
import { ISlotRepository } from "../../Slot/interfaces/ISlotRepository"
import { ILocationRepository } from "../../Location/interfaces/ILocationRepository"
import { MachineWithSlotsDTO } from "../schemas/vendingMachineDTOs"

export class GetMachineWithSlotsUseCase {
  constructor(
    private readonly machineRepository: IVendingMachineRepository,
    private readonly slotRepository: ISlotRepository,
    private readonly locationRepository: ILocationRepository
  ) {}

  async execute(machineId: string): Promise<MachineWithSlotsDTO | null> {
    const machine = await this.machineRepository.findById(machineId)
    if (!machine) {
      return null
    }

    const slots = await this.slotRepository.getSlotsWithProducts(machineId)
    console.log("machine", machine)

    // Fetch location name
    const location = await this.locationRepository.findById(machine.locationId)
    const locationName = location?.name || undefined

    // Calculate setup status
    const hasSlots = slots.length > 0
    const hasCardReader = !!machine.cardReaderId
    const setupStatus = hasSlots && hasCardReader ? "complete" : "incomplete"
    const setupPercentage = ((hasSlots ? 1 : 0) + (hasCardReader ? 1 : 0)) * 50

    return {
      id: machine.id,
      type: machine.type,
      locationId: machine.locationId,
      locationName: locationName,
      model: machine.model,
      notes: machine.notes,
      status: machine.status,
      organizationId: machine.organizationId,
      cardReaderId: machine.cardReaderId,
      slots,
      createdAt: machine.createdAt,
      updatedAt: machine.updatedAt,
      setup: {
        status: setupStatus,
        percentage: setupPercentage,
      },
      lastRestocked: undefined, // TODO: Implement when restock tracking is added
      lastMaintenance: undefined, // TODO: Implement when maintenance tracking is added
    }
  }
}
