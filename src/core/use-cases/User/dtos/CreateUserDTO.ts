export class CreateUserDTO {
  constructor(
    public firstName: string,
    public lastName: string,
    public email: string,
    public organizationId: string,
    public role: string,
    public password: string = "test123"
  ) {}
}
