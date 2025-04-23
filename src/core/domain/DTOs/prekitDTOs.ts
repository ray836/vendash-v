import { z } from "zod"
import { PublicProductDTO } from "./productDTOs"
import { PreKitItem } from "../entities/PreKit"

export enum PreKitStatus {
  OPEN = "OPEN",
  PICKED = "PICKED",
  STOCKED = "STOCKED",
}

export const BasePreKitItemDTO = z.object({
  id: z.string(),
  preKitId: z.string(),
  productId: z.string(),
  quantity: z.number(),
  slotId: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
  createdBy: z.string(),
  updatedBy: z.string(),
})

export type BasePreKitItemDTO = z.infer<typeof BasePreKitItemDTO>

export const PublicPreKitItemDTO = BasePreKitItemDTO.pick({
  id: true,
  preKitId: true,
  productId: true,
  quantity: true,
  slotId: true,
}).extend({
  productImage: z.string(),
  productName: z.string(),
})

export type PublicPreKitItemDTO = z.infer<typeof PublicPreKitItemDTO>

export const PreKitItemCreateRequestDTO = BasePreKitItemDTO.pick({
  productId: true,
  quantity: true,
  slotId: true,
})

export type PreKitItemCreateRequestDTO = z.infer<
  typeof PreKitItemCreateRequestDTO
>

export const PreKitItemCreateRequestDTOToPreKitItem = (
  preKitItem: PreKitItemCreateRequestDTO,
  createdBy: string,
  updatedBy: string,
  preKitId: string
): PreKitItem => {
  return new PreKitItem({
    id: crypto.randomUUID(),
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: createdBy,
    updatedBy: updatedBy,
    ...preKitItem,
    preKitId: preKitId,
  })
}

export const BasePreKitDTO = z.object({
  id: z.string(),
  machineId: z.string(),
  status: z.nativeEnum(PreKitStatus),
  createdAt: z.date(),
  updatedAt: z.date(),
  createdBy: z.string(),
  updatedBy: z.string(),
})

export type BasePreKitDTO = z.infer<typeof BasePreKitDTO>

export const PublicPreKitDTO = BasePreKitDTO.pick({
  id: true,
  machineId: true,
  status: true,
}).extend({
  items: z.array(PublicPreKitItemDTO),
})

export type PublicPreKitDTO = z.infer<typeof PublicPreKitDTO>

export const PreKitCreateRequestDTO = BasePreKitDTO.pick({
  machineId: true,
}).extend({
  items: z.array(PreKitItemCreateRequestDTO),
})

export type PreKitCreateRequestDTO = z.infer<typeof PreKitCreateRequestDTO>

export const PreKitItemDTOToPublicPreKitItemDTO = (
  item: BasePreKitItemDTO,
  product: PublicProductDTO
): PublicPreKitItemDTO => {
  return {
    ...item,
    productImage: product.image,
    productName: product.name,
  }
}

export const PreKitDTOToPublicPreKitDTO = (
  preKit: BasePreKitDTO,
  items: PublicPreKitItemDTO[]
): PublicPreKitDTO => {
  return {
    id: preKit.id,
    machineId: preKit.machineId,
    status: preKit.status,
    items,
  }
}

export const PreKitItemUpdateRequestDTO = PreKitItemCreateRequestDTO.pick({
  slotId: true,
  quantity: true,
  productId: true,
}).extend({
  id: z.string().optional(),
})

export type PreKitItemUpdateRequestDTO = z.infer<
  typeof PreKitItemUpdateRequestDTO
>

export const UpdatePreKitItemsRequestDTO = z.object({
  preKitId: z.string(),
  items: z.array(PreKitItemUpdateRequestDTO),
})

export type UpdatePreKitItemsRequestDTO = z.infer<
  typeof UpdatePreKitItemsRequestDTO
>

export const PreKitItemUpdateRequestDTOToPreKitItem = (
  preKitItem: PreKitItemUpdateRequestDTO,
  updatedBy: string,
  preKitId: string,
  id: string
): PreKitItem => {
  return new PreKitItem({
    ...preKitItem,
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: updatedBy,
    updatedBy: updatedBy,
    preKitId: preKitId,
    id: id,
  })
}
