import { IPreKitRepository } from "../../domain/interfaces/IPreKitRepository"
import {
  BasePreKitDTO,
  PreKitCreateRequestDTO,
  PublicPreKitDTO,
  PreKitStatus,
} from "../../domain/DTOs/prekitDTOs"
import { PreKitItemCreateRequestDTOToPreKitItem } from "../../domain/DTOs/prekitDTOs"
import { PreKit, PreKitItem } from "../../domain/entities/PreKit"

export class CreatePreKitUseCase {
  constructor(private preKitRepository: IPreKitRepository) {}

  async execute(
    request: PreKitCreateRequestDTO,
    userId: string
  ): Promise<PublicPreKitDTO> {
    const now = new Date()

    const preKit: BasePreKitDTO = {
      id: crypto.randomUUID(),
      machineId: request.machineId,
      status: PreKitStatus.OPEN,
      createdAt: now,
      updatedAt: now,
      createdBy: userId,
      updatedBy: userId,
    }

    const preKitItems: PreKitItem[] = request.items.map((item) =>
      PreKitItemCreateRequestDTOToPreKitItem(item, userId, userId, preKit.id)
    )

    const createdPreKit = await this.preKitRepository.create(
      new PreKit(preKit),
      preKitItems,
      userId
    )

    return {
      id: createdPreKit.id,
      machineId: createdPreKit.machineId,
      status: createdPreKit.status,
      items: [], // TODO: Add items
    }
  }
}
