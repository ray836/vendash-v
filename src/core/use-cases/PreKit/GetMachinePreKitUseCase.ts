import { IPreKitRepository } from "../../domain/interfaces/IPreKitRepository"
import {
  PublicPreKitDTO,
  PreKitItemDTOToPublicPreKitItemDTO,
} from "../../domain/DTOs/prekitDTOs"
import { ProductRepository } from "../../domain/interfaces/ProductRepository"
import { ProductDTOToPublicProductDTO } from "../../domain/DTOs/productDTOs"

export class GetMachinePreKitUseCase {
  constructor(
    private preKitRepository: IPreKitRepository,
    private productRepository: ProductRepository
  ) {}

  async execute(machineId: string): Promise<PublicPreKitDTO | null> {
    const preKit = await this.preKitRepository.getByMachineId(machineId)

    if (!preKit) return null

    const items = await this.preKitRepository.getItems(preKit.id)

    const itemsWithProduct = await Promise.all(
      items.map(async (item) => {
        const product = await this.productRepository.findById(item.productId)
        return {
          ...item,
          product,
        }
      })
    )

    return {
      id: preKit.id,
      machineId: preKit.machineId,
      status: preKit.status,
      items: itemsWithProduct.map((item) =>
        PreKitItemDTOToPublicPreKitItemDTO(
          item.props,
          ProductDTOToPublicProductDTO(item.product!.props)
        )
      ),
    }
  }
}
