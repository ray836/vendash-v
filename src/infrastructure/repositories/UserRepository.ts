import { User, UserRole } from "@/domains/User/entities/User"
import { db } from "../database"
import { users } from "../database/schema"
import { eq } from "drizzle-orm"

export class UserRepository {
  constructor(private readonly database: typeof db) {}

  async findById(id: string): Promise<User | null> {
    const result = await this.database
      .select()
      .from(users)
      .where(eq(users.id, id))

    if (!result[0]) return null
    return this.toEntity(result[0])
  }

  async findByEmail(email: string): Promise<User | null> {
    const result = await this.database
      .select()
      .from(users)
      .where(eq(users.email, email))

    if (!result[0]) return null
    return this.toEntity(result[0])
  }

  async findByOrganizationId(organizationId: string): Promise<User[]> {
    const result = await this.database
      .select()
      .from(users)
      .where(eq(users.organizationId, organizationId))

    return result.map(this.toEntity)
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

    if (!result[0]) throw new Error("Failed to create user")
    return this.toEntity(result[0])
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

    if (!result[0]) throw new Error("User not found")
    return this.toEntity(result[0])
  }

  async delete(id: string): Promise<void> {
    await this.database.delete(users).where(eq(users.id, id))
  }

  private toEntity(data: typeof users.$inferSelect): User {
    return new User({
      id: data.id,
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      password: data.password ?? "",
      role: data.role as UserRole,
      organizationId: data.organizationId,
      createdAt: data.createdAt,
      updatedAt: data.createdAt,
      createdBy: "system",
      updatedBy: "system",
    })
  }
}
