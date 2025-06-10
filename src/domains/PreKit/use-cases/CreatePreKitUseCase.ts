import { IPreKitRepository } from "../interfaces/IPreKitRepository"
import { PreKit, PreKitItem } from "../entities/PreKit"
import {
  CreatePreKitRequest,
  CreatePreKitResponse,
} from "../schemas/CreatePreKitSchemas"

import { BasePreKit, PreKitStatus } from "../schemas/PrekitSchemas"
export class CreatePreKitUseCase {
  constructor(private preKitRepository: IPreKitRepository) {}

  async execute(request: CreatePreKitRequest): Promise<CreatePreKitResponse> {
    const now = new Date()

    const preKit: BasePreKit = {
      id: crypto.randomUUID(),
      machineId: request.machineId,
      status: PreKitStatus.OPEN,
      createdAt: now,
      updatedAt: now,
      createdBy: request.userId,
      updatedBy: request.userId,
    }

    const preKitItems: PreKitItem[] = request.items.map(
      (item) =>
        new PreKitItem({
          ...item,
          id: crypto.randomUUID(),
          createdAt: now,
          updatedAt: now,
          createdBy: request.userId,
          updatedBy: request.userId,
          preKitId: preKit.id,
        })
    )

    const createdPreKit = await this.preKitRepository.create(
      new PreKit(preKit),
      preKitItems,
      request.userId
    )

    return createdPreKit as CreatePreKitResponse
  }
}
