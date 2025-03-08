import { User } from "@/core/domain/entities/User"
import { UserRepository } from "@/core/domain/interfaces/UserRepository"
import { UserDTO } from "../../core/domain/interfaces/dtos/UserDTO"
import { db } from "../database"
import { users } from "../database/schema"
import { eq } from "drizzle-orm"
import { CreateUserDTO } from "@/core/use-cases/User/dtos/CreateUserDTO"
import { randomUUID } from "node:crypto"
export class DrizzleUserRepo implements UserRepository {
  constructor(private readonly database: typeof db) {}

  async getUser(id: string): Promise<UserDTO> {
    const result = await this.database
      .select()
      .from(users)
      .where(eq(users.id, id))
    if (!result[0]) {
      throw new Error("User not found")
    }
    const user = result[0]
    return new UserDTO(
      user.id,
      user.firstName,
      user.lastName,
      user.email,
      user.role,
      user.organizationId
    )
  }
  async createUser(user: CreateUserDTO): Promise<UserDTO> {
    const result = await this.database
      .insert(users)
      .values({
        id: randomUUID(),
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        password: "test", // TODO: check on password
        role: user.role,
        organizationId: user.organizationId,
      })
      .returning()

    if (!result[0]) {
      throw new Error("User not found")
    }
    const newUser = result[0]
    return new UserDTO(
      newUser.id,
      newUser.firstName,
      newUser.lastName,
      newUser.email,
      newUser.role,
      newUser.organizationId
    )
  }
  async updateUser(user: User): Promise<UserDTO> {
    const result = await this.database
      .update(users)
      .set({
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
      })
      .where(eq(users.id, user.id))
      .returning()

    if (!result[0]) {
      throw new Error("User not found")
    }
    const updatedUser = result[0]
    return new UserDTO(
      updatedUser.id,
      updatedUser.firstName,
      updatedUser.lastName,
      updatedUser.email,
      updatedUser.role,
      updatedUser.organizationId
    )
  }

  async deleteUser(id: string): Promise<void> {
    await this.database.delete(users).where(eq(users.id, id))
  }
  async getUsers(organizationId: string): Promise<UserDTO[]> {
    const result = await this.database
      .select()
      .from(users)
      .where(eq(users.organizationId, organizationId))
    return result.map(
      (user) =>
        new UserDTO(
          user.id,
          user.firstName,
          user.lastName,
          user.email,
          user.role,
          user.organizationId
        )
    )
  }
}
