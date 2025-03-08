import { UserDTO } from "@/core/domain/interfaces/dtos/UserDTO"
import { User } from "../entities/User"
import { CreateUserDTO } from "@/core/use-cases/User/dtos/CreateUserDTO"
export interface UserRepository {
  getUser(id: string): Promise<UserDTO>
  createUser(user: CreateUserDTO): Promise<UserDTO>
  updateUser(user: User): Promise<UserDTO>
  deleteUser(id: string): Promise<void>
  getUsers(organizationId: string): Promise<UserDTO[]>
}
