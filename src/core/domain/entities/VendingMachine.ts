import { randomUUID } from "crypto"

export enum MachineType {
  DRINK = "DRINK",
  SNACK = "SNACK",
}

export class VendingMachine {
  constructor(
    public type: MachineType,
    public locationId: string,
    public id: string = randomUUID(),
    public notes: string = "",
    public organizationId: string,
    public model: string
  ) {}
}
