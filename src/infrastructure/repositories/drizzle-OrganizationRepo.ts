import { Organization } from "@/core/domain/entities/Organization"
import { OrganizationDTO } from "@/core/domain/interfaces/dtos/OrganizationDTO"
import { OrganizationRepository } from "@/core/domain/interfaces/OrganizationRepository"
import { db } from "../database"
import { organizations } from "../database/schema"
import { eq } from "drizzle-orm"
export class DrizzleOrganizationRepo implements OrganizationRepository {
  async createOrganization(
    organization: Organization
  ): Promise<OrganizationDTO> {
    const result = await db
      .insert(organizations)
      .values({
        id: organization.id,
        name: organization.name,
        address: organization.address,
      })
      .returning()
    if (!result[0]) {
      throw new Error("Organization not found")
    }
    const newOrganization = result[0]
    return new OrganizationDTO(
      newOrganization.id,
      newOrganization.name,
      newOrganization.address
    )
  }

  async updateOrganization(
    organization: Organization
  ): Promise<OrganizationDTO> {
    const result = await db
      .update(organizations)
      .set({
        name: organization.name,
      })
      .where(eq(organizations.id, organization.id))
      .returning()
    if (!result[0]) {
      throw new Error("Organization not found")
    }
    const updatedOrganization = result[0]
    return new OrganizationDTO(
      updatedOrganization.id,
      updatedOrganization.name,
      updatedOrganization.address
    )
  }

  async deleteOrganization(id: string): Promise<void> {
    await db.delete(organizations).where(eq(organizations.id, id))
  }

  async getOrganizations(): Promise<OrganizationDTO[]> {
    const result = await db.select().from(organizations)
    return result.map(
      (organization) =>
        new OrganizationDTO(
          organization.id,
          organization.name,
          organization.address
        )
    )
  }
}
