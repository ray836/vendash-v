import { PreKit, PreKitItem } from "../entities/PreKit"
import { PublicPreKit } from "../schemas/PrekitSchemas"

export interface IPreKitRepository {
  create(
    preKit: PreKit,
    items: PreKitItem[],
    userId: string
  ): Promise<PublicPreKit>
  getByMachineId(machineId: string): Promise<PublicPreKit | null>
  getOrgPreKits(orgId: string): Promise<PublicPreKit[]>
  getItems(preKitId: string): Promise<PreKitItem[]>
  delete(id: string): Promise<void>
  updateItems(
    preKitId: string,
    items: PreKitItem[],
    userId: string
  ): Promise<void>
  updateStatus(preKitId: string, status: string, userId: string): Promise<void>
  findById(id: string): Promise<PreKit | null>
  getMachinePreKits(machineId: string): Promise<PreKit[]>
  updatePreKitItems(
    preKitId: string,
    items: PreKitItem[],
    userId: string
  ): Promise<void>
}
