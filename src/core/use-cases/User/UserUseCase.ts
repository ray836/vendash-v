import { User } from "@/core/domain/entities/User"
import { UserRepository } from "@/core/domain/interfaces/UserRepository"
import { UserDTO } from "@/core/domain/interfaces/dtos/UserDTO"
import { CreateUserDTO } from "./dtos/CreateUserDTO"
export class UserUseCase {
  constructor(private readonly userRepository: UserRepository) {}

  async createUser(user: CreateUserDTO): Promise<UserDTO> {
    return this.userRepository.createUser(user)
  }

  // TODO: This will be more specific
  async updateUser(user: User): Promise<UserDTO> {
    return this.userRepository.updateUser(user)
  }

  async deleteUser(id: string): Promise<void> {
    return this.userRepository.deleteUser(id)
  }

  async getUsers(organizationId: string): Promise<UserDTO[]> {
    return this.userRepository.getUsers(organizationId)
  }
}
