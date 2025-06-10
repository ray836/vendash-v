"use server"

import { db } from "@/infrastructure/database"
import { DrizzleOrderRepository } from "@/infrastructure/repositories/DrizzleOrderRepository"
import { AddItemToCurrentOrderUseCase } from "@/domains/Order/use-cases/AddItemToCurrentOrderUseCase"
import { GetCurrentOrderUseCase } from "@/domains/Order/use-cases/GetCurrentOrderUseCase"
import { UpdateOrderItemQuantityUseCase } from "@/domains/Order/use-cases/UpdateOrderItemQuantityUseCase"
import { PlaceCurrentOrderUseCase } from "@/domains/Order/use-cases/PlaceCurrentOrderUseCase"
import { PlaceCurrentOrderRequestDTO } from "@/domains/Order/schemas/orderDTOs"
import { DrizzleProductRepository } from "@/infrastructure/repositories/DrizzleProductRepository"
import { DrizzleInventoryRepository } from "@/infrastructure/repositories/DrizzleInventoryRepository"

const orderRepo = new DrizzleOrderRepository(db)
const productRepo = new DrizzleProductRepository(db)
const inventoryRepo = new DrizzleInventoryRepository(db)

export async function testAddItemToOrder() {
  try {
    const useCase = new AddItemToCurrentOrderUseCase(orderRepo, productRepo)
    const result = await useCase.execute({
      organizationId: "1",
      productId: "1",
      quantity: 1,
      userId: "1",
    })
    return { success: true, data: result }
  } catch (error) {
    console.error("Error adding test item to order:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to add test item",
    }
  }
}

export async function addProductToNextOrder(productId: string) {
  try {
    const useCase = new AddItemToCurrentOrderUseCase(orderRepo, productRepo)
    const result = await useCase.execute({
      organizationId: "1", // TODO: Get from session/context
      productId: productId,
      quantity: 1,
      userId: "1", // TODO: Get from session/context
    })
    return { success: true, data: result }
  } catch (error) {
    console.error("Error adding product to order:", error)
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to add product to order",
    }
  }
}

export async function getCurrentOrder() {
  try {
    const useCase = new GetCurrentOrderUseCase(orderRepo, productRepo)
    const result = await useCase.execute("1")
    return { success: true, order: result }
  } catch (error) {
    console.error("Error getting current order:", error)
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to get current order",
    }
  }
}

export async function updateOrderItemQuantity(
  orderItemId: string,
  quantity: number
) {
  try {
    const useCase = new UpdateOrderItemQuantityUseCase(orderRepo)
    const result = await useCase.execute({
      orderItemId,
      quantity,
      userId: "1",
    })
    return { success: true, data: result }
  } catch (error) {
    console.error("Error updating order item quantity:", error)
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to update quantity",
    }
  }
}

export async function placeCurrentOrder(request: PlaceCurrentOrderRequestDTO) {
  try {
    const useCase = new PlaceCurrentOrderUseCase(
      orderRepo,
      productRepo,
      inventoryRepo
    )
    const order = await useCase.execute(request)

    return {
      success: true,
      order,
    }
  } catch (error) {
    console.error("Error placing order:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to place order",
    }
  }
}
