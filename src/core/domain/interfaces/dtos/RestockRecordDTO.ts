import { RestockMachineDataDTO } from "./RestockMachineDataDTO"

export class RestockRecordDTO {
  constructor(
    public id: string,
    public routeId: string,
    public locationId: string,
    public createdAt: Date,
    public notes: string | undefined,
    public timestamp: string,
    public stockedBy: string,
    public machineData: RestockMachineDataDTO[]
  ) {}
}
