"use server"
import { UserRole } from "@/core/domain/entities/User"
import { UserUseCase } from "@/core/use-cases/User/UserUseCase"
import { db } from "@/infrastructure/database"
import { DrizzleUserRepo } from "@/infrastructure/repositories/drizzle-UserRepo"

const organizationId = "1"

export async function createUser(user: {
  firstName: string
  lastName: string
  email: string
  role: string
}) {
  console.log("createUser", user)
  const drizzleUserRepository = new DrizzleUserRepo(db)
  console.log("here")
  const userUseCase = new UserUseCase(drizzleUserRepository)
  console.log("here2")
  const result = await userUseCase.createUser({
    organizationId: organizationId,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    role: user.role as UserRole,
    password: "test123",
  })
  console.log("result", result)
  return JSON.stringify(result)
}

export async function getUsers() {
  const drizzleUserRepository = new DrizzleUserRepo(db)
  const userUseCase = new UserUseCase(drizzleUserRepository)
  return (await userUseCase.getUsers(organizationId)).map((user) => ({
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    role: user.role,
    organizationId: user.organizationId,
  }))
}

export async function deleteUser(userId: string) {
  const drizzleUserRepository = new DrizzleUserRepo(db)
  const userUseCase = new UserUseCase(drizzleUserRepository)
  await userUseCase.deleteUser(userId)
}
