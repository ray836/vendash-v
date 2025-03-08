export class User {
  constructor(
    public id: string,
    public firstName: string,
    public lastName: string,
    public email: string,
    public organizationId: string,
    public role: UserRole
  ) {}
}

export enum UserRole {
  ADMIN = "admin",
  USER = "user",
}
