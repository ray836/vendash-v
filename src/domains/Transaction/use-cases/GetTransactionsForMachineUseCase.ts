import { ITransactionRepository } from "../repositories/ITransactionRepository"
import { GetTransactionsForMachineResponseDTO } from "../schemas/GetTransactionsForMachineSchema"

export class GetTransactionsForMachineUseCase {
  constructor(private readonly transactionRepository: ITransactionRepository) {}

  async execute(
    machineId: string,
    startDate: Date,
    endDate: Date
  ): Promise<GetTransactionsForMachineResponseDTO> {
    const transactions = await this.transactionRepository.findByMachineId(
      machineId,
      startDate,
      endDate
    )

    // Convert transactions to public format
    const publicTransactions = transactions.map((transaction) => ({
      id: transaction.id,
      organizationId: transaction.organizationId,
      transactionType: transaction.transactionType,
      createdAt: transaction.createdAt,
      total: transaction.total,
      last4CardDigits: transaction.last4CardDigits,
      cardReaderId: transaction.cardReaderId,
      vendingMachineId: machineId,
    }))

    // Group by day
    const dailyMap = new Map<string, typeof publicTransactions>()
    publicTransactions.forEach((tx) => {
      const day = tx.createdAt.toISOString().split("T")[0]
      if (!dailyMap.has(day)) dailyMap.set(day, [])
      dailyMap.get(day)!.push(tx)
    })
    const daily = Array.from(dailyMap.values()).flat()
    const dailyAverage = dailyMap.size
      ? Array.from(dailyMap.values()).reduce(
          (sum, txs) => sum + txs.reduce((s, t) => s + t.total, 0),
          0
        ) / dailyMap.size
      : 0

    // Group by week (YYYY-WW)
    function getWeek(date: Date) {
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
    const weeklyMap = new Map<string, typeof publicTransactions>()
    publicTransactions.forEach((tx) => {
      const week = getWeek(tx.createdAt)
      if (!weeklyMap.has(week)) weeklyMap.set(week, [])
      weeklyMap.get(week)!.push(tx)
    })
    const weekly = Array.from(weeklyMap.values()).flat()
    const weeklyAverage = weeklyMap.size
      ? Array.from(weeklyMap.values()).reduce(
          (sum, txs) => sum + txs.reduce((s, t) => s + t.total, 0),
          0
        ) / weeklyMap.size
      : 0

    // Group by month (YYYY-MM)
    const monthlyMap = new Map<string, typeof publicTransactions>()
    publicTransactions.forEach((tx) => {
      const month = `${tx.createdAt.getFullYear()}-${String(
        tx.createdAt.getMonth() + 1
      ).padStart(2, "0")}`
      if (!monthlyMap.has(month)) monthlyMap.set(month, [])
      monthlyMap.get(month)!.push(tx)
    })
    const monthly = Array.from(monthlyMap.values()).flat()
    const monthlyAverage = monthlyMap.size
      ? Array.from(monthlyMap.values()).reduce(
          (sum, txs) => sum + txs.reduce((s, t) => s + t.total, 0),
          0
        ) / monthlyMap.size
      : 0

    return {
      transactions: publicTransactions,
      daily,
      dailyAverage,
      weekly,
      weeklyAverage,
      monthly,
      monthlyAverage,
    }
  }
}
