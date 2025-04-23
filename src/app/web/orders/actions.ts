"use server"

import { AddItemToCurrentOrderUseCase } from "@/core/use-cases/Order/addItemToCurrentOrderUseCase"
import { DrizzleOrderRepository } from "@/infrastructure/repositories/drizzle-OrderRepo"
import { DrizzleProductRepository } from "@/infrastructure/repositories/drizzle-ProductRepo"
import { db } from "@/infrastructure/database"
import { GetCurrentOrderUseCase } from "@/core/use-cases/Order/getCurrentOrderUseCase"
import { UpdateOrderItemQuantityUseCase } from "@/core/use-cases/Order/updateOrderItemQuantityUseCase"
import { PlaceCurrentOrderUseCase } from "@/core/use-cases/Order/placeCurrentOrderUseCase"
import { PlaceCurrentOrderRequestDTO } from "@/core/domain/DTOs/OrderDTOs"

export async function testAddItemToOrder() {
  try {
    const orderRepo = new DrizzleOrderRepository(db)
    const productRepo = new DrizzleProductRepository(db)
    const useCase = new AddItemToCurrentOrderUseCase(orderRepo, productRepo)

    const result = await useCase.execute({
      organizationId: "1", // Replace with actual test org ID
      productId: "1", // Replace with actual test product ID
      quantity: 1,
      userId: "1", // Replace with actual test user ID
    })

    return { success: true, order: result }
  } catch (error) {
    console.error("Failed to add test item to order:", error)
    return { success: false, error: "Failed to add item to order" }
  }
}

export async function addProductToNextOrder(productId: string) {
  try {
    const orderRepo = new DrizzleOrderRepository(db)
    const productRepo = new DrizzleProductRepository(db)
    const useCase = new AddItemToCurrentOrderUseCase(orderRepo, productRepo)

    const result = await useCase.execute({
      organizationId: "1", // TODO: Get from session/context
      productId: productId,
      quantity: 1,
      userId: "1", // TODO: Get from session/context
    })

    return { success: true, order: result }
  } catch (error) {
    console.error("Failed to add product to order:", error)
    return { success: false, error: "Failed to add product to order" }
  }
}

export async function getCurrentOrder() {
  try {
    const orderRepo = new DrizzleOrderRepository(db)
    const productRepo = new DrizzleProductRepository(db)
    const useCase = new GetCurrentOrderUseCase(orderRepo, productRepo)

    const result = await useCase.execute("1") // TODO: Get from session/context
    return { success: true, order: result }
  } catch (error) {
    console.error("Failed to get current order:", error)
    return { success: false, error: "Failed to get current order" }
  }
}

export async function updateOrderItemQuantity(
  orderItemId: string,
  quantity: number
) {
  try {
    const orderRepo = new DrizzleOrderRepository(db)
    const useCase = new UpdateOrderItemQuantityUseCase(orderRepo)

    const result = await useCase.execute({
      orderItemId,
      quantity,
      userId: "1", // TODO: Get from session/context
    })

    return { success: result }
  } catch (error) {
    console.error("Failed to update order item quantity:", error)
    return {
      success: false,
      error: "Failed to update order item quantity",
    }
  }
}

export async function placeCurrentOrder(request: PlaceCurrentOrderRequestDTO) {
  try {
    const orderRepo = new DrizzleOrderRepository(db)
    const productRepo = new DrizzleProductRepository(db)
    const useCase = new PlaceCurrentOrderUseCase(orderRepo, productRepo)

    const result = await useCase.execute(request)
    return { success: true, order: result }
  } catch (error) {
    console.error("Failed to place order:", error)
    return { success: false, error: "Failed to place order" }
  }
}
