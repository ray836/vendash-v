import { z } from "zod"

export const LocationSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  address: z.string().min(1),
  organizationId: z.string().uuid(),
  createdAt: z.date(),
  updatedAt: z.date(),
  createdBy: z.string(),
  updatedBy: z.string(),
})

export type LocationProps = z.infer<typeof LocationSchema>

export class Location {
  readonly id: string
  readonly name: string
  readonly address: string
  readonly organizationId: string
  readonly createdAt: Date
  readonly updatedAt: Date
  readonly createdBy: string
  readonly updatedBy: string

  constructor(props: LocationProps) {
    this.id = props.id
    this.name = props.name
    this.address = props.address
    this.organizationId = props.organizationId
    this.createdAt = props.createdAt
    this.updatedAt = props.updatedAt
    this.createdBy = props.createdBy
    this.updatedBy = props.updatedBy
  }

  static create(
    props: Omit<
      LocationProps,
      "id" | "createdAt" | "updatedAt" | "createdBy" | "updatedBy"
    >
  ): Location {
    return new Location({
      ...props,
      id: crypto.randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: "system",
      updatedBy: "system",
    })
  }

  update(
    props: Partial<Omit<LocationProps, "id" | "createdAt" | "createdBy">>
  ): Location {
    return new Location({
      ...this,
      ...props,
      updatedAt: new Date(),
      updatedBy: "system",
    })
  }
}
