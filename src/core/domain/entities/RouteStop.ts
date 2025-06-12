import { randomUUID } from "crypto"
import { Location } from "@/domains/Location/entities/Location"

export class RouteStop {
  constructor(
    public id: string,
    public routeId: string,
    public location: Location,
    public sequence: number,
    public estimatedArrivalTime: Date,
    public actualArrivalTime?: Date,
    public status: "pending" | "completed" | "skipped" = "pending"
  ) {}

  static create(
    routeId: string,
    location: Location,
    sequence: number,
    estimatedArrivalTime: Date
  ): RouteStop {
    return new RouteStop(
      randomUUID(),
      routeId,
      location,
      sequence,
      estimatedArrivalTime
    )
  }

  complete(actualArrivalTime: Date): RouteStop {
    return new RouteStop(
      this.id,
      this.routeId,
      this.location,
      this.sequence,
      this.estimatedArrivalTime,
      actualArrivalTime,
      "completed"
    )
  }

  skip(): RouteStop {
    return new RouteStop(
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
