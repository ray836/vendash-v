import { IPreKitRepository } from "../../domain/interfaces/IPreKitRepository"
import {
  UpdatePreKitItemsRequestDTO,
  PreKitItemUpdateRequestDTOToPreKitItem,
} from "../../domain/DTOs/prekitDTOs"
import { PreKitItem } from "../../domain/entities/PreKit"

export class UpdatePreKitItemsUseCase {
  constructor(private preKitRepository: IPreKitRepository) {}

  async execute(
    request: UpdatePreKitItemsRequestDTO,
    userId: string
  ): Promise<void> {
    // Create new PreKitItem entities from the request
    const updatedItems: PreKitItem[] = request.items.map((item) =>
      PreKitItemUpdateRequestDTOToPreKitItem(
        {
          ...item,
        },
        userId,
        request.preKitId,
        item.id ?? crypto.randomUUID()
      )
    )

    // Update the items in the repository
    // This will replace all existing items with the new ones
    await this.preKitRepository.updateItems(
      request.preKitId,
      updatedItems,
      userId
    )
  }
}
