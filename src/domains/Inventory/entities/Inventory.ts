import { BaseInventoryDTO } from "../DTOs/inventoryDTOs"

export class Inventory {
  constructor(public props: BaseInventoryDTO) {}
  public get productId() {
    return this.props.productId
  }
  public get total() {
    return this.props.storage + this.props.machines
  }
  public get storage() {
    return this.props.storage
  }
  public get machines() {
    return this.props.machines
  }
  public get organizationId() {
    return this.props.organizationId
  }
}
