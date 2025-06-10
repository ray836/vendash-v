import { BaseSlotDTO } from "../schemas/SlotSchemas"
import { randomUUID } from "crypto"

export class Slot {
  private props: BaseSlotDTO

  private constructor(props: BaseSlotDTO) {
    this.props = props
  }

  public static create(props: Partial<BaseSlotDTO>): Slot {
    const now = new Date()

    return new Slot({
      id: props.id || randomUUID(),
      organizationId: props.organizationId || "",
      machineId: props.machineId || "",
      productId: props.productId || "",
      labelCode: props.labelCode || "",
      ccReaderCode: props.ccReaderCode || "",
      cardReaderId: props.cardReaderId || "",
      price: props.price || 0,
      sequenceNumber: props.sequenceNumber || 0,
      capacity: props.capacity || 0,
      currentQuantity: props.currentQuantity || 0,
      createdAt: props.createdAt || now,
      updatedAt: props.updatedAt || now,
      createdBy: props.createdBy || "system",
      updatedBy: props.updatedBy || "system",
    })
  }

  public get id(): string {
    return this.props.id
  }

  public get organizationId(): string {
    return this.props.organizationId
  }

  public get machineId(): string {
    return this.props.machineId
  }

  public get productId(): string {
    return this.props.productId
  }

  public get labelCode(): string {
    return this.props.labelCode
  }

  public get ccReaderCode(): string | undefined {
    return this.props.ccReaderCode
  }

  public get cardReaderId(): string | undefined {
    return this.props.cardReaderId
  }

  public get price(): number {
    return this.props.price
  }

  public get sequenceNumber(): number {
    return this.props.sequenceNumber
  }

  public get capacity(): number {
    return this.props.capacity
  }

  public get currentQuantity(): number {
    return this.props.currentQuantity
  }

  public get row(): string | undefined {
    return this.props.labelCode.charAt(0)
  }

  public get column(): number | undefined {
    return parseInt(this.props.labelCode.slice(-1))
  }

  public get createdAt(): Date {
    return this.props.createdAt
  }

  public get updatedAt(): Date {
    return this.props.updatedAt
  }

  public get createdBy(): string {
    return this.props.createdBy
  }

  public get updatedBy(): string {
    return this.props.updatedBy
  }

  public toJSON() {
    return {
      id: this.id,
      organizationId: this.organizationId,
      machineId: this.machineId,
      productId: this.productId,
      labelCode: this.labelCode,
      ccReaderCode: this.ccReaderCode,
      cardReaderId: this.cardReaderId,
      price: this.price,
      sequenceNumber: this.sequenceNumber,
      capacity: this.capacity,
      currentQuantity: this.currentQuantity,
      row: this.row,
      column: this.column,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      createdBy: this.createdBy,
      updatedBy: this.updatedBy,
    }
  }
}
