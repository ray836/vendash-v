import { IUserRepository } from "../interfaces/IUserRepository"
import { PublicUserDTO } from "../schemas/UserSchemas"

export class GetUsersUseCase {
  constructor(private readonly userRepository: IUserRepository) {}

  async execute(organizationId: string): Promise<PublicUserDTO[]> {
    // Get all users for the organization
    const users = await this.userRepository.findByOrganizationId(organizationId)

    // Map to public DTOs
    return users.map((user) => ({
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      organizationId: user.organizationId,
      role: user.role,
    }))
  }
}
