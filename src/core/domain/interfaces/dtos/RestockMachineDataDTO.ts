export class RestockMachineDataDTO {
  constructor(
    public id: string,
    public machineId: string,
    public cashAmount: number,
    public pictures: string[],
    public restockRecordId: string
  ) {}
}
