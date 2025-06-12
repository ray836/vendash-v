import { PublicLocationDTO } from "@/domains/Location/schemas/locationDTOs"

export class RouteStopDTO {
  constructor(
    public id: string,
    public routeId: string,
    public location: PublicLocationDTO,
    public sequence: number,
    public estimatedArrivalTime: Date,
    public actualArrivalTime?: Date,
    public status: "pending" | "completed" | "skipped" = "pending"
  ) {}

  static create(
    routeId: string,
    location: PublicLocationDTO,
    sequence: number,
    estimatedArrivalTime: Date
  ): RouteStopDTO {
    return new RouteStopDTO(
      crypto.randomUUID(),
      routeId,
      location,
      sequence,
      estimatedArrivalTime
    )
  }

  complete(actualArrivalTime: Date): RouteStopDTO {
    return new RouteStopDTO(
      this.id,
      this.routeId,
      this.location,
      this.sequence,
      this.estimatedArrivalTime,
      actualArrivalTime,
      "completed"
    )
  }

  skip(): RouteStopDTO {
    return new RouteStopDTO(
      this.id,
      this.routeId,
      this.location,
      this.sequence,
      this.estimatedArrivalTime,
      this.actualArrivalTime,
      "skipped"
    )
  }
}
