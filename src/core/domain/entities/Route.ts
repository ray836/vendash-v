import { randomUUID } from "crypto"
import { RouteStop } from "./RouteStop"

export class Route {
  constructor(
    public stops: RouteStop[],
    public name: string = "",
    public isActive: boolean = true,
    public organizationId: string,
    public id: string = randomUUID()
  ) {}
}
