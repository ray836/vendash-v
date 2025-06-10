import { IPreKitRepository } from "@/domains/PreKit/interfaces/IPreKitRepository"
import { IInventoryRepository } from "@/domains/Inventory/interfaces/IInventoryRepository"
import { ISlotRepository } from "@/domains/Slot/interfaces/ISlotRepository"
import { PreKitStatus } from "@/domains/PreKit/schemas/PreKitStatus"

interface StockPreKitUseCaseProps {
  preKitRepository: IPreKitRepository
  slotRepository: ISlotRepository
  inventoryRepository: IInventoryRepository
}

export class StockPreKitUseCase {
  constructor(private readonly props: StockPreKitUseCaseProps) {}

  async execute(
    preKitId: string,
    userId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // 1. Get the pre-kit details
      const preKit = await this.props.preKitRepository.findById(preKitId)
      if (!preKit) {
        return { success: false, error: "Pre-kit not found" }
      }

      // 2. Verify pre-kit is in PICKED status
      if (preKit.status !== PreKitStatus.PICKED) {
        return {
          success: false,
          error:
            "Pre-kit must be in PICKED status to be stocked: current status is " +
            preKit.status,
        }
      }

      // 3. Get pre-kit items
      const items = await this.props.preKitRepository.getItems(preKitId)

      // 4. Update slot quantities in vending machine
      for (const item of items) {
        const slot = await this.props.slotRepository.findById(item.slotId)
        if (!slot) {
          return { success: false, error: `Slot ${item.slotId} not found` }
        }

        // Update slot quantity
        await this.props.slotRepository.updateSlotQuantity(
          item.slotId,
          slot.currentQuantity + item.quantity
        )

        // Update inventory quantity
        await this.props.inventoryRepository.updateInventoryQuantity(
          item.productId,
          -item.quantity // Subtract from inventory
        )
      }

      // 5. Update pre-kit status to STOCKED
      await this.props.preKitRepository.updateStatus(
        preKitId,
        PreKitStatus.STOCKED,
        userId
      )

      return { success: true }
    } catch (error) {
      console.error("Error stocking pre-kit:", error)
      return { success: false, error: "Failed to stock pre-kit" }
    }
  }
}
