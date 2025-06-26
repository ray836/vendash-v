import { IVendingMachineRepository } from "../interfaces/IVendingMachineRepository"
import { ILocationRepository } from "../../Location/interfaces/ILocationRepository"
import { PublicVendingMachineDTO } from "../schemas/vendingMachineDTOs"

export class GetVendingMachinesUseCase {
  constructor(
    private readonly vendingMachineRepository: IVendingMachineRepository,
    private readonly locationRepository: ILocationRepository
  ) {}

  async execute(organizationId: string): Promise<PublicVendingMachineDTO[]> {
    const vendingMachines =
      await this.vendingMachineRepository.findByOrganizationId(organizationId)

    // Fetch location names for all machines
    const locationIds = [
      ...new Set(vendingMachines.map((machine) => machine.locationId)),
    ]
    const locations = await Promise.all(
      locationIds.map((id) => this.locationRepository.findById(id))
    )

    // Create a map of locationId to location name
    const locationMap = new Map()
    locations.forEach((location) => {
      if (location) {
        locationMap.set(location.id, location.name)
      }
    })

    return vendingMachines.map((vendingMachine) => ({
      id: vendingMachine.id,
      type: vendingMachine.type,
      locationId: vendingMachine.locationId,
      locationName: locationMap.get(vendingMachine.locationId) || undefined,
      model: vendingMachine.model,
      notes: vendingMachine.notes,
      status: vendingMachine.status,
      organizationId: vendingMachine.organizationId,
      cardReaderId: vendingMachine.cardReaderId,
      createdAt: vendingMachine.createdAt,
      updatedAt: vendingMachine.updatedAt,
    }))
  }
}
