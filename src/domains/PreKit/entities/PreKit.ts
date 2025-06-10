import { BasePreKit, BasePreKitItem } from "../schemas/PrekitSchemas"

export class PreKitItem {
  constructor(public props: BasePreKitItem) {}
  public get id() {
    return this.props.id
  }
  public get preKitId() {
    return this.props.preKitId
  }
  public get productId() {
    return this.props.productId
  }
  public get slotId() {
    return this.props.slotId
  }
  public get quantity() {
    return this.props.quantity
  }
  public get createdAt() {
    return this.props.createdAt
  }
  public get updatedAt() {
    return this.props.updatedAt
  }
  public get createdBy() {
    return this.props.createdBy
  }
  public get updatedBy() {
    return this.props.updatedBy
  }
}

export class PreKit {
  constructor(public props: BasePreKit) {}
  public get id() {
    return this.props.id
  }
  public get machineId() {
    return this.props.machineId
  }
  public get status() {
    return this.props.status
  }
  public get createdAt() {
    return this.props.createdAt
  }
  public get updatedAt() {
    return this.props.updatedAt
  }
  public get createdBy() {
    return this.props.createdBy
  }
  public get updatedBy() {
    return this.props.updatedBy
  }
}
