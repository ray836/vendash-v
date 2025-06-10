import { User, UserRole } from "@/domains/User/entities/User"
import { IUserRepository } from "@/domains/User/interfaces/IUserRepository"
import { db } from "../database"
import { users } from "../database/schema"
import { eq } from "drizzle-orm"

export class DrizzleUserRepo implements IUserRepository {
  constructor(private readonly database: typeof db) {}

  async findById(id: string): Promise<User | null> {
    const result = await this.database
      .select()
      .from(users)
      .where(eq(users.id, id))

    if (!result[0]) {
      return null
    }

    const user = result[0]
    return new User({
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      password: user.password,
      role: user.role as UserRole,
      organizationId: user.organizationId,
      createdAt: user.createdAt,
      updatedAt: user.createdAt,
      createdBy: "system",
      updatedBy: "system",
    })
  }

  async findByEmail(email: string): Promise<User | null> {
    const result = await this.database
      .select()
      .from(users)
      .where(eq(users.email, email))

    if (!result[0]) {
      return null
    }

    const user = result[0]
    return new User({
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      password: user.password,
      role: user.role as UserRole,
      organizationId: user.organizationId,
      createdAt: user.createdAt,
      updatedAt: user.createdAt,
      createdBy: "system",
      updatedBy: "system",
    })
  }

  async findByOrganizationId(organizationId: string): Promise<User[]> {
    const result = await this.database
      .select()
      .from(users)
      .where(eq(users.organizationId, organizationId))

    return result.map(
      (user) =>
        new User({
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          password: user.password,
          role: user.role as UserRole,
          organizationId: user.organizationId,
          createdAt: user.createdAt,
          updatedAt: user.createdAt,
          createdBy: "system",
          updatedBy: "system",
        })
    )
  }

  async create(user: User): Promise<User> {
    const result = await this.database
      .insert(users)
      .values({
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        password: user.props.password,
        role: user.role,
        organizationId: user.organizationId,
      })
      .returning()

    if (!result[0]) {
      throw new Error("Failed to create user")
    }

    const newUser = result[0]
    return new User({
      id: newUser.id,
      firstName: newUser.firstName,
      lastName: newUser.lastName,
      email: newUser.email,
      password: newUser.password,
      role: newUser.role as UserRole,
      organizationId: newUser.organizationId,
      createdAt: newUser.createdAt,
      updatedAt: newUser.createdAt,
      createdBy: "system",
      updatedBy: "system",
    })
  }

  async update(user: User): Promise<User> {
    const result = await this.database
      .update(users)
      .set({
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        password: user.props.password,
        role: user.role,
        organizationId: user.organizationId,
      })
      .where(eq(users.id, user.id))
      .returning()

    if (!result[0]) {
      throw new Error("User not found")
    }

    const updatedUser = result[0]
    return new User({
      id: updatedUser.id,
      firstName: updatedUser.firstName,
      lastName: updatedUser.lastName,
      email: updatedUser.email,
      password: updatedUser.password,
      role: updatedUser.role as UserRole,
      organizationId: updatedUser.organizationId,
      createdAt: updatedUser.createdAt,
      updatedAt: updatedUser.createdAt,
      createdBy: "system",
      updatedBy: "system",
    })
  }

  async delete(id: string): Promise<void> {
    await this.database.delete(users).where(eq(users.id, id))
  }
}
