export class UserDTO {
  constructor(
    public id: string,
    public firstName: string,
    public lastName: string,
    public email: string,
    public role: string, // TODO: Not sure if this is needed
    public organizationId: string
  ) {}
}
