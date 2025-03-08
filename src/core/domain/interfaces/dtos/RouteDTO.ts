import { RouteStopDTO } from "./RouteStopDTO"

export class RouteDTO {
  constructor(
    public id: string,
    public name: string,
    public stops: RouteStopDTO[],
    public organizationId: string,
    public isActive: boolean = true
  ) {}
}
