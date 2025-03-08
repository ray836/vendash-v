import { randomUUID } from "crypto"

export type MachineData = {
  id: string
  machineId: string
  cashAmount: number
  pictures: string[]
  restockRecordId: string
}

// RestockRecord is specific to a location but the picture and cash amount are specific to a machine
export class RestockRecord {
  constructor(
    public routeId: string,
    public locationId: string,
    public machineData: MachineData[],
    public notes: string,
    public timestamp: string,
    public id: string = randomUUID(),
    public stockedBy: string
  ) {}
}
