import { IUserRepository } from "../interfaces/IUserRepository"

export class DeleteUserUseCase {
  constructor(private readonly userRepository: IUserRepository) {}

  async execute(id: string): Promise<void> {
    // Check if the user exists
    const existingUser = await this.userRepository.findById(id)
    if (!existingUser) {
      throw new Error("User not found")
    }

    // Delete the user
    await this.userRepository.delete(id)
  }
}
