import { IPreKitRepository } from "../interfaces/IPreKitRepository"
import { PreKitStatus } from "../schemas/PrekitSchemas"

export class PickPreKitUseCase {
  constructor(private preKitRepository: IPreKitRepository) {}

  async execute(preKitId: string, userId: string): Promise<void> {
    await this.preKitRepository.updateStatus(
      preKitId,
      PreKitStatus.PICKED,
      userId
    )
  }
}
