import { BaseVendingMachineDTO } from "../DTOs/vendingMachineDTOs"
export enum MachineType {
  DRINK = "DRINK",
  SNACK = "SNACK",
}

export enum MachineStatus {
  ONLINE = "ONLINE",
  OFFLINE = "OFFLINE",
  MAINTENANCE = "MAINTENANCE",
  LOW_STOCK = "LOW_STOCK",
}

export class VendingMachine {
  constructor(public props: BaseVendingMachineDTO) {}
}
