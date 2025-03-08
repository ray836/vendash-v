import { MachineType } from "@/core/domain/entities/VendingMachine"

export class CreateVendingMachineDTO {
  constructor(
    public organizationId: string,
    public creator: string,
    public type: MachineType,
    public locationId: string,
    public notes: string = "",
    public model: string
  ) {}
}
