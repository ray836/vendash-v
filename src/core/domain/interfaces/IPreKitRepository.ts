import { PreKit, PreKitItem } from "../entities/PreKit"
export interface IPreKitRepository {
  create(preKit: PreKit, items: PreKitItem[], userId: string): Promise<PreKit>
  getByMachineId(machineId: string): Promise<PreKit | null>
  getItems(preKitId: string): Promise<PreKitItem[]>
  delete(id: string): Promise<void>
  updateItems(
    preKitId: string,
    items: PreKitItem[],
    userId: string
  ): Promise<void>
}
