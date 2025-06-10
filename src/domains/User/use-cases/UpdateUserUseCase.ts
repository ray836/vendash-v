import { IUserRepository } from "../interfaces/IUserRepository"
import { User } from "../entities/User"
import { createHash } from "crypto"
import {
  UpdateUserRequestDTO,
  UpdateUserResponseDTO,
} from "../schemas/UpdateUserRequestSchema"

export class UpdateUserUseCase {
  constructor(private readonly userRepository: IUserRepository) {}

  async execute(
    id: string,
    data: UpdateUserRequestDTO,
    updatedBy: string
  ): Promise<UpdateUserResponseDTO> {
    // Get the existing user
    const existingUser = await this.userRepository.findById(id)
    if (!existingUser) {
      throw new Error("User not found")
    }

    // Hash the password if it's being updated
    let hashedPassword = existingUser.props.password
    if (data.password) {
      hashedPassword = createHash("sha256").update(data.password).digest("hex")
    }

    // Create the updated user entity
    const updatedUser = new User({
      ...existingUser.props,
      ...data,
      password: hashedPassword,
      updatedAt: new Date(),
      updatedBy,
    })

    // Save the updated user
    const savedUser = await this.userRepository.update(updatedUser)

    // Return the public DTO
    return {
      id: savedUser.id,
      firstName: savedUser.firstName,
      lastName: savedUser.lastName,
      email: savedUser.email,
      organizationId: savedUser.organizationId,
      role: savedUser.role,
    }
  }
}
