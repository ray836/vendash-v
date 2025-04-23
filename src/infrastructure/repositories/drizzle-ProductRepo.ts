import { ProductRepository } from "@/core/domain/interfaces/ProductRepository"
import { Product } from "@/core/domain/entities/Product"
import { products } from "@/infrastructure/database/schema"
import { db } from "../database"
import { eq } from "drizzle-orm"
import { PublicProductDTO } from "@/core/domain/DTOs/productDTOs"
export class DrizzleProductRepository implements ProductRepository {
  constructor(private readonly database: typeof db) {}

  async create(product: Product): Promise<PublicProductDTO> {
    const result = await this.database
      .insert(products)
      .values({
        id: product.id,
        name: product.name,
        recommendedPrice: product.recommendedPrice.toString(),
        category: product.category,
        image: product.image,
        vendorLink: product.vendorLink,
        caseCost: product.caseCost.toString(),
        caseSize: product.caseSize.toString(),
        shippingAvailable: product.shippingAvailable,
        shippingTimeInDays: product.shippingTimeInDays,
        organizationId: product.organizationId,
      })
      .returning()
    const createdProduct = result[0]
    if (!createdProduct) {
      throw new Error("Product not found")
    }

    // Create proper BaseProductDTO and return new Product instance
    return PublicProductDTO.parse({
      ...createdProduct,
      recommendedPrice: parseFloat(createdProduct.recommendedPrice),
      caseCost: parseFloat(createdProduct.caseCost),
      caseSize: parseFloat(createdProduct.caseSize),
    })
  }

  async findById(id: string): Promise<Product | null> {
    console.log("here7")
    const result = await this.database
      .select()
      .from(products)
      .where(eq(products.id, id))
    const product = result[0]
    console.log("here6")
    console.log(product)
    if (!product) {
      return null
    }
    return new Product({
      ...product,
      recommendedPrice: parseFloat(product.recommendedPrice),
      caseCost: parseFloat(product.caseCost),
      caseSize: parseFloat(product.caseSize),
    })
  }

  async findAll(): Promise<PublicProductDTO[]> {
    const result = await this.database.select().from(products)
    return result.map((product) =>
      PublicProductDTO.parse({
        ...product,
        recommendedPrice: parseFloat(product.recommendedPrice),
        caseCost: parseFloat(product.caseCost),
        caseSize: parseFloat(product.caseSize),
      })
    )
  }

  async findByOrganizationId(
    organizationId: string
  ): Promise<PublicProductDTO[]> {
    const result = await this.database
      .select()
      .from(products)
      .where(eq(products.organizationId, organizationId))
    return result.map((product) =>
      PublicProductDTO.parse({
        ...product,
        recommendedPrice: parseFloat(product.recommendedPrice),
        caseCost: parseFloat(product.caseCost),
        caseSize: parseFloat(product.caseSize),
      })
    )
  }

  async update(product: Product): Promise<Product> {
    const result = await this.database
      .update(products)
      .set({
        name: product.name,
        recommendedPrice: product.recommendedPrice.toString(),
        category: product.category,
        image: product.image,
        vendorLink: product.vendorLink,
        caseCost: product.caseCost.toString(),
        caseSize: product.caseSize.toString(),
        shippingAvailable: product.shippingAvailable,
        shippingTimeInDays: product.shippingTimeInDays,
      })
      .where(eq(products.id, product.id))
      .returning()
    const updatedProduct = result[0]
    if (!updatedProduct) {
      throw new Error("Product not found")
    }
    return new Product({
      ...updatedProduct,
      recommendedPrice: parseFloat(updatedProduct.recommendedPrice),
      caseCost: parseFloat(updatedProduct.caseCost),
      caseSize: parseFloat(updatedProduct.caseSize),
    })
  }

  async delete(id: string): Promise<void> {
    await this.database.delete(products).where(eq(products.id, id))
  }
}
