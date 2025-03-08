export class VendingMachineDTO {
  constructor(
    public id: string,
    public type: string,
    public locationId: string,
    public organizationId: string,
    public notes?: string,
    public model?: string
  ) {}
}
