import { LocationDTO } from "./LocationDTO"

export class RouteStopDTO {
  constructor(
    public id: string,
    public location: LocationDTO,
    public vendingMachineIds: string[],
    public order: number,
    public notes?: string,
    public isComplete: boolean = false
  ) {}
}
