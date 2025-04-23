import { BaseSlotDTO } from "../DTOs/slotDTOs"
export class Slot {
  constructor(public props: BaseSlotDTO) {}
  public get id() {
    return this.props.id
  }
  public get organizationId() {
    return this.props.organizationId
  }
  public get machineId() {
    return this.props.machineId
  }
  public get productId() {
    return this.props.productId
  }
  public get labelCode() {
    return this.props.labelCode
  }
  public get capacity() {
    return this.props.capacity
  }
  public get currentQuantity() {
    return this.props.currentQuantity
  }
  public get price() {
    return this.props.price
  }
  public get cardReaderSlotId() {
    return this.props.ccReaderCode
  }
}
