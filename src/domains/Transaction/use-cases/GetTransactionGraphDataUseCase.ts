import { ITransactionRepository } from "../repositories/ITransactionRepository"
import { GetTransactionGraphDataResponseDTO } from "../schemas/GetTransactionGraphDataSchemas"
import { GetTransactionGraphDataRequestDTO } from "../schemas/GetTransactionGraphDataSchemas"
import { GroupByType } from "../schemas/GetTransactionGraphDataSchemas"

export class GetTransactionGraphDataUseCase {
  constructor(private readonly transactionRepository: ITransactionRepository) {}

  async execute(
    request: GetTransactionGraphDataRequestDTO
  ): Promise<GetTransactionGraphDataResponseDTO> {
    const transactions = await this.transactionRepository.findByOrganizationId(
      request.organizationId,
      request.startDate,
      request.endDate
    )

    // Helper function to get the group key based on the grouping type
    function getGroupKey(date: Date, groupedBy: GroupByType): string {
      if (groupedBy === GroupByType.DAY) {
        return date.toISOString().split("T")[0] // YYYY-MM-DD
      }
      if (groupedBy === GroupByType.WEEK) {
        const d = new Date(
          Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
        )
        d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7))
        const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
        const weekNo = Math.ceil(
          ((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7
        )
        return `${d.getUTCFullYear()}-W${weekNo}`
      }
      if (groupedBy === GroupByType.MONTH) {
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
          2,
          "0"
        )}`
      }
      return ""
    }

    // Group transactions by the specified period
    const groupedMap = transactions.reduce((acc, transaction) => {
      const key = getGroupKey(transaction.createdAt, request.groupedBy)
      if (!acc[key]) {
        acc[key] = {
          date: key,
          totalSales: 0,
          totalTransactions: 0,
        }
      }
      acc[key].totalSales += transaction.total
      acc[key].totalTransactions += 1
      return acc
    }, {} as Record<string, { date: string; totalSales: number; totalTransactions: number }>)

    // Convert the grouped map to an array and sort by date
    const groupedData = Object.values(groupedMap)
      .map((group) => ({
        ...group,
        totalSales: Math.round(group.totalSales * 100) / 100,
      }))
      .sort((a, b) => a.date.localeCompare(b.date))

    // Calculate totals and averages based on the grouped data
    const totalSales =
      Math.round(
        groupedData.reduce((acc, group) => acc + group.totalSales, 0) * 100
      ) / 100
    const totalTransactions = groupedData.reduce(
      (acc, group) => acc + group.totalTransactions,
      0
    )

    // Calculate averages per period (day/week/month)
    const averageSales =
      groupedData.length > 0
        ? Math.round((totalSales / groupedData.length) * 100) / 100
        : 0
    const averageTransactions =
      groupedData.length > 0
        ? Math.round((totalTransactions / groupedData.length) * 100) / 100
        : 0

    return {
      totalSales,
      totalTransactions,
      averageSales,
      averageTransactions,
      groupedBy: request.groupedBy,
      groupedData,
    }
  }
}
