export class CreateLocationDTO {
  constructor(
    public readonly name: string,
    public readonly address: string,
    public readonly organizationId: string
  ) {}
}
