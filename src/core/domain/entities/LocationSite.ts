import { randomUUID } from "crypto"
export class LocationSite {
  constructor(
    public address: string,
    public name: string,
    public id: string = randomUUID(),
    public organizationId: string
  ) {}
}
