import { RestockRecordDTO } from "./dtos/RestockRecordDTO"
import { RestockRecord } from "../entities/RestockRecord"
export interface RestockRecordRepository {
  createRestockRecord(
    restockRecord: RestockRecord,
    createdBy: string
  ): Promise<RestockRecordDTO>
  getRestockRecord(id: string): Promise<RestockRecordDTO>
  getRestockRecords(routeId: string): Promise<RestockRecordDTO[]>
  updateRestockRecord(
    restockRecord: RestockRecord,
    updatedBy: string
  ): Promise<RestockRecordDTO>
  deleteRestockRecord(id: string): Promise<void>
}
