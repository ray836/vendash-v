import { BaseProductDTO } from "../DTOs/productDTOs"

export class Product {
  constructor(public props: BaseProductDTO) {}
  public get id() {
    return this.props.id
  }
  public get name() {
    return this.props.name
  }
  public get recommendedPrice() {
    return this.props.recommendedPrice
  }
  public get category() {
    return this.props.category
  }
  public get image() {
    return this.props.image
  }
  public get vendorLink() {
    return this.props.vendorLink
  }
  public get caseCost() {
    return this.props.caseCost
  }
  public get caseSize() {
    return this.props.caseSize
  }
  public get shippingAvailable() {
    return this.props.shippingAvailable
  }
  public get shippingTimeInDays() {
    return this.props.shippingTimeInDays
  }
  public get organizationId() {
    return this.props.organizationId
  }
}
