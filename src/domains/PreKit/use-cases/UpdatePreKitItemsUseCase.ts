import { IPreKitRepository } from "../interfaces/IPreKitRepository"
import { PreKitItem } from "../entities/PreKit"
import { UpdatePreKitRequest } from "../schemas/UpdatePreKitSchemas"

export class UpdatePreKitItemsUseCase {
  constructor(private preKitRepository: IPreKitRepository) {}

  async execute(request: UpdatePreKitRequest): Promise<void> {
    // TODO: This isn't updating it's removing all items and recreating as new.
    const updatedItems: PreKitItem[] = request.items.map(
      (item) =>
        new PreKitItem({
          ...item,
          createdAt: new Date(), // TODO: Remove this
          updatedAt: new Date(),
          createdBy: request.userId, // TODO: Remove this
          updatedBy: request.userId,
          preKitId: request.id,
          id: item.id ?? crypto.randomUUID(),
        })
    )

    await this.preKitRepository.updateItems(
      request.id,
      updatedItems,
      request.userId
    )
  }
}
