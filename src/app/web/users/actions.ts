"use server"

import { UserRole } from "@/domains/User/entities/User"
import * as UserService from "@/domains/User/UserService"
import { db } from "@/infrastructure/database"
import { UserRepository } from "@/infrastructure/repositories/UserRepository"
import { auth } from "@/lib/auth"

export async function createUser(user: {
  firstName: string
  lastName: string
  email: string
  role: string
}) {
  const session = await auth()
  if (!session) throw new Error('Unauthorized')
  const { organizationId } = session.user

  const repo = new UserRepository(db)
  const result = await UserService.createUser(repo, {
    organizationId,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    role: user.role as UserRole,
    password: crypto.randomUUID(),
  })
  return JSON.stringify(result)
}

export async function getUsers() {
  const session = await auth()
  if (!session) throw new Error('Unauthorized')
  const { organizationId } = session.user

  const repo = new UserRepository(db)
  return await UserService.getUsers(repo, organizationId)
}

export async function deleteUser(userId: string) {
  const session = await auth()
  if (!session) throw new Error('Unauthorized')

  const repo = new UserRepository(db)
  await UserService.deleteUser(repo, userId)
}
