import { Organization } from "../entities/Organization"
import { OrganizationDTO } from "./dtos/OrganizationDTO"

export interface OrganizationRepository {
  createOrganization(organization: Organization): Promise<OrganizationDTO>
  updateOrganization(organization: Organization): Promise<OrganizationDTO>
  deleteOrganization(id: string): Promise<void>
  getOrganizations(): Promise<OrganizationDTO[]>
}
