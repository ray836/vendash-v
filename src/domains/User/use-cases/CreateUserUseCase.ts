import { IUserRepository } from "../interfaces/IUserRepository"
import { User } from "../entities/User"
import { createHash } from "crypto"
import {
  CreateUserRequestDTO,
  CreateUserResponseDTO,
} from "../schemas/CreateUserRequestSchema"

export class CreateUserUseCase {
  constructor(private readonly userRepository: IUserRepository) {}

  async execute(data: CreateUserRequestDTO): Promise<CreateUserResponseDTO> {
    // Hash the password using SHA-256
    const hashedPassword = createHash("sha256")
      .update(data.password)
      .digest("hex")

    // Create the user entity
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
      createdBy: "system", // This should be replaced with the actual user ID
      updatedBy: "system", // This should be replaced with the actual user ID
    })

    // Save the user
    const createdUser = await this.userRepository.create(user)

    // Return the public DTO
    return {
      id: createdUser.id,
      firstName: createdUser.firstName,
      lastName: createdUser.lastName,
      email: createdUser.email,
      organizationId: createdUser.organizationId,
      role: createdUser.role,
    }
  }
}
