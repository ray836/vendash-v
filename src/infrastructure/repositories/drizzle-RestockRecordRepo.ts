import { RestockRecord } from "@/core/domain/entities/RestockRecord"
import { RestockMachineDataDTO } from "@/core/domain/interfaces/dtos/RestockMachineDataDTO"
import { RestockRecordDTO } from "@/core/domain/interfaces/dtos/RestockRecordDTO"
import { RestockRecordRepository } from "@/core/domain/interfaces/RestockRecordRepository"
import {
  restockRecords,
  RestockMachineData,
} from "@/infrastructure/database/schema"
import { eq } from "drizzle-orm"
import { db } from "../database"
export class DrizzleRestockRecordRepo implements RestockRecordRepository {
  constructor(private readonly database: typeof db) {}

  async createRestockRecord(
    restockRecord: RestockRecord,
    stockedBy: string
  ): Promise<RestockRecordDTO> {
    const restockRecordData = await this.database
      .insert(restockRecords)
      .values({
        ...restockRecord,
        timestamp: new Date(restockRecord.timestamp),
        stockedBy: stockedBy,
      })
      .returning()
    if (restockRecordData.length === 0) {
      throw new Error("Failed to create restock record")
    }
    const machineData = await this.database
      .insert(RestockMachineData)
      .values(
        restockRecord.machineData.map((machine) => ({
          ...machine,
          createdBy: stockedBy,
        }))
      )
      .returning()
    if (machineData.length === 0) {
      throw new Error("Failed to create machine data")
    }
    const machineDataDTOs = machineData.map(
      (machine: {
        id: string
        machineId: string
        cashAmount: number
        pictures: string[] | null
        restockRecordId: string
      }) =>
        new RestockMachineDataDTO(
          machine.id,
          machine.machineId,
          machine.cashAmount,
          machine.pictures ?? [],
          machine.restockRecordId
        )
    )
    const restockRecordDTO = new RestockRecordDTO(
      restockRecordData[0].id,
      restockRecordData[0].routeId,
      restockRecordData[0].locationId,
      restockRecordData[0].createdAt,
      restockRecordData[0].notes ?? undefined,
      restockRecordData[0].timestamp.toISOString(),
      restockRecordData[0].stockedBy,
      machineDataDTOs
    )

    return restockRecordDTO
  }

  async getRestockRecord(id: string): Promise<RestockRecordDTO> {
    const restockRecordData = await this.database
      .select()
      .from(restockRecords)
      .where(eq(restockRecords.id, id))
    if (restockRecordData.length === 0) {
      throw new Error("Restock record not found")
    }
    const machineData = await this.database
      .select()
      .from(RestockMachineData)
      .where(eq(RestockMachineData.restockRecordId, id))
    if (machineData.length === 0) {
      throw new Error("Machine data not found")
    }
    const machineDataDTOs = machineData.map(
      (machine: {
        id: string
        machineId: string
        cashAmount: number
        pictures: string[] | null
        restockRecordId: string
      }) =>
        new RestockMachineDataDTO(
          machine.id,
          machine.machineId,
          machine.cashAmount,
          machine.pictures ?? [],
          machine.restockRecordId
        )
    )
    const restockRecordDTO = new RestockRecordDTO(
      restockRecordData[0].id,
      restockRecordData[0].routeId,
      restockRecordData[0].locationId,
      restockRecordData[0].createdAt,
      restockRecordData[0].notes ?? undefined,
      restockRecordData[0].timestamp.toISOString(),
      restockRecordData[0].stockedBy,
      machineDataDTOs
    )
    return restockRecordDTO
  }

  async getRestockRecords(routeId: string): Promise<RestockRecordDTO[]> {
    const restockRecordData = await this.database
      .select()
      .from(restockRecords)
      .where(eq(restockRecords.routeId, routeId))
    return restockRecordData.map(
      (restockRecord) =>
        new RestockRecordDTO(
          restockRecord.id,
          restockRecord.routeId,
          restockRecord.locationId,
          restockRecord.createdAt,
          restockRecord.notes ?? undefined,
          restockRecord.timestamp.toISOString(),
          restockRecord.stockedBy,
          []
        )
    )
  }

  async updateRestockRecord(
    restockRecord: RestockRecord
  ): Promise<RestockRecordDTO> {
    const restockRecordData = await this.database
      .update(restockRecords)
      .set({
        ...restockRecord,
        timestamp: new Date(restockRecord.timestamp),
      })
      .where(eq(restockRecords.id, restockRecord.id))
      .returning()
    if (restockRecordData.length === 0) {
      throw new Error("Restock record not found")
    }
    const machineData = await this.database
      .update(RestockMachineData)
      .set({
        ...restockRecord.machineData,
        createdBy: restockRecord.stockedBy,
      })
      .where(eq(RestockMachineData.restockRecordId, restockRecord.id))
      .returning()
    if (machineData.length === 0) {
      throw new Error("Machine data not found")
    }
    return new RestockRecordDTO(
      restockRecordData[0].id,
      restockRecordData[0].routeId,
      restockRecordData[0].locationId,
      restockRecordData[0].createdAt,
      restockRecordData[0].notes ?? undefined,
      restockRecordData[0].timestamp.toISOString(),
      restockRecordData[0].stockedBy,
      []
    )
  }

  async deleteRestockRecord(id: string): Promise<void> {
    await this.database.delete(restockRecords).where(eq(restockRecords.id, id))
  }
}
