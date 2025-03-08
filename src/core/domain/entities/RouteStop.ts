import { randomUUID } from "crypto"
import { LocationSite } from "./LocationSite"

export class RouteStop {
  constructor(
    public id: string = randomUUID(),
    public location: LocationSite,
    public vendingMachineIds: string[],
    public order: number,
    public notes?: string,
    public isComplete: boolean = false
  ) {}
}
