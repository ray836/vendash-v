"use server"
import { UserRole } from "@/domains/User/entities/User"
import { CreateUserUseCase } from "@/domains/User/use-cases/CreateUserUseCase"
import { DeleteUserUseCase } from "@/domains/User/use-cases/DeleteUserUseCase"
import { GetUsersUseCase } from "@/domains/User/use-cases/GetUsersUseCase"
import { db } from "@/infrastructure/database"
import { DrizzleUserRepo } from "@/infrastructure/repositories/DrizzleUserRepository"

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
  const createUserUseCase = new CreateUserUseCase(drizzleUserRepository)
  console.log("here2")
  const result = await createUserUseCase.execute({
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
  const getUsersUseCase = new GetUsersUseCase(drizzleUserRepository)
  return await getUsersUseCase.execute(organizationId)
}

export async function deleteUser(userId: string) {
  const drizzleUserRepository = new DrizzleUserRepo(db)
  const deleteUserUseCase = new DeleteUserUseCase(drizzleUserRepository)
  await deleteUserUseCase.execute(userId)
}
