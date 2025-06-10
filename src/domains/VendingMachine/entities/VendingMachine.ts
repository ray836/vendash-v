import { z } from "zod"
import { PublicVendingMachineDTO } from "../schemas/vendingMachineDTOs"
export enum MachineType {
  DRINK = "DRINK",
  SNACK = "SNACK",
}

export enum MachineStatus {
  ONLINE = "ONLINE",
  OFFLINE = "OFFLINE",
  MAINTENANCE = "MAINTENANCE",
  LOW_STOCK = "LOW_STOCK",
}

export const VendingMachineSchema = z.object({
  id: z.string().uuid(),
  type: z.enum([MachineType.DRINK, MachineType.SNACK]),
  locationId: z.string().uuid(),
  model: z.string().min(1),
  notes: z.string().optional(),
  status: z.enum([
    MachineStatus.ONLINE,
    MachineStatus.OFFLINE,
    MachineStatus.MAINTENANCE,
    MachineStatus.LOW_STOCK,
  ]),
  organizationId: z.string().uuid(),
  cardReaderId: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
  createdBy: z.string(),
  updatedBy: z.string(),
})

export type VendingMachineProps = z.infer<typeof VendingMachineSchema>

export class VendingMachine {
  readonly id: string
  readonly type: MachineType
  readonly locationId: string
  readonly model: string
  readonly notes?: string
  readonly status: MachineStatus
  readonly organizationId: string
  readonly cardReaderId?: string
  readonly createdAt: Date
  readonly updatedAt: Date
  readonly createdBy: string
  readonly updatedBy: string

  constructor(props: VendingMachineProps) {
    this.id = props.id
    this.type = props.type
    this.locationId = props.locationId
    this.model = props.model
    this.notes = props.notes
    this.status = props.status
    this.organizationId = props.organizationId
    this.cardReaderId = props.cardReaderId
    this.createdAt = props.createdAt
    this.updatedAt = props.updatedAt
    this.createdBy = props.createdBy
    this.updatedBy = props.updatedBy
  }

  static create(
    props: Omit<
      VendingMachineProps,
      "id" | "createdAt" | "updatedAt" | "createdBy" | "updatedBy" | "status"
    >
  ): VendingMachine {
    return new VendingMachine({
      ...props,
      id: crypto.randomUUID(),
      status: MachineStatus.ONLINE,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: "1",
      updatedBy: "1",
    })
  }

  update(
    props: Partial<
      Omit<
        VendingMachineProps,
        "id" | "createdAt" | "createdBy" | "organizationId"
      >
    >
  ): VendingMachine {
    return new VendingMachine({
      ...this,
      ...props,
      updatedAt: new Date(),
      updatedBy: "1",
    })
  }

  updateStatus(status: MachineStatus): VendingMachine {
    return this.update({ status })
  }

  toPublicDTO(): PublicVendingMachineDTO {
    return {
      id: this.id,
      type: this.type,
      locationId: this.locationId,
      model: this.model,
      organizationId: this.organizationId,
      status: this.status,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      notes: this.notes,
      cardReaderId: this.cardReaderId,
    }
  }
}
