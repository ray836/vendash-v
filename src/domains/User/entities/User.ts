import { BaseUserDTO } from "../schemas/UserSchemas"

export enum UserRole {
  ADMIN = "admin",
  USER = "user",
}

export class User {
  constructor(public props: BaseUserDTO) {}

  public get id() {
    return this.props.id
  }

  public get firstName() {
    return this.props.firstName
  }

  public get lastName() {
    return this.props.lastName
  }

  public get email() {
    return this.props.email
  }

  public get organizationId() {
    return this.props.organizationId
  }

  public get role() {
    return this.props.role
  }

  public get createdAt() {
    return this.props.createdAt
  }

  public get updatedAt() {
    return this.props.updatedAt
  }

  public get createdBy() {
    return this.props.createdBy
  }

  public get updatedBy() {
    return this.props.updatedBy
  }
}
