import { User } from "./entities/User"
import { UserRepository } from "@/infrastructure/repositories/UserRepository"
import { createHash } from "crypto"
import { CreateUserRequestDTO, CreateUserResponseDTO } from "./schemas/CreateUserRequestSchema"
import { UpdateUserRequestDTO, UpdateUserResponseDTO } from "./schemas/UpdateUserRequestSchema"
import { PublicUserDTO } from "./schemas/UserSchemas"

export async function getUsers(
  repo: UserRepository,
  organizationId: string
): Promise<PublicUserDTO[]> {
  const users = await repo.findByOrganizationId(organizationId)
  return users.map((user) => ({
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    organizationId: user.organizationId,
    role: user.role,
  }))
}

export async function createUser(
  repo: UserRepository,
  data: CreateUserRequestDTO
): Promise<CreateUserResponseDTO> {
  const hashedPassword = createHash("sha256").update(data.password).digest("hex")
  const user = new User({
    id: crypto.randomUUID(),
    firstName: data.firstName,
    lastName: data.lastName,
    email: data.email,
    organizationId: data.organizationId,
    role: data.role,
    password: hashedPassword,
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: "system",
    updatedBy: "system",
  })
  const created = await repo.create(user)
  return {
    id: created.id,
    firstName: created.firstName,
    lastName: created.lastName,
    email: created.email,
    organizationId: created.organizationId,
    role: created.role,
  }
}

export async function updateUser(
  repo: UserRepository,
  id: string,
  data: UpdateUserRequestDTO,
  updatedBy: string
): Promise<UpdateUserResponseDTO> {
  const existing = await repo.findById(id)
  if (!existing) throw new Error("User not found")

  let hashedPassword = existing.props.password
  if (data.password) {
    hashedPassword = createHash("sha256").update(data.password).digest("hex")
  }

  const updated = new User({
    ...existing.props,
    ...data,
    password: hashedPassword,
    updatedAt: new Date(),
    updatedBy,
  })
  const saved = await repo.update(updated)
  return {
    id: saved.id,
    firstName: saved.firstName,
    lastName: saved.lastName,
    email: saved.email,
    organizationId: saved.organizationId,
    role: saved.role,
  }
}

export async function deleteUser(
  repo: UserRepository,
  id: string
): Promise<void> {
  const existing = await repo.findById(id)
  if (!existing) throw new Error("User not found")
  await repo.delete(id)
}
