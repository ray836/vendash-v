import { GroupByType } from "@/domains/Transaction/schemas/GetTransactionGraphDataSchemas"

export function formatDateLabel(date: string, groupedBy: GroupByType): string {
  const dateObj = new Date(date)

  switch (groupedBy) {
    case GroupByType.DAY:
      return dateObj.toLocaleString("default", {
        month: "short",
        day: "numeric",
        timeZone: "UTC",
      })
    case GroupByType.WEEK:
      const weekNo = Math.ceil((dateObj.getUTCDate() + dateObj.getUTCDay()) / 7)
      return `Week ${weekNo}`
    case GroupByType.MONTH:
      return dateObj.toLocaleString("default", { month: "short", timeZone: "UTC" })
    default:
      return date
  }
}

export function formatWeekRangeLabel(weekKey: string): string {
  let startDate: Date

  if (weekKey.includes("T") || /^\d{4}-\d{2}-\d{2}$/.test(weekKey)) {
    // ISO date string from SQL — the date itself is the week start (Monday)
    startDate = new Date(weekKey)
  } else {
    // Legacy "YYYY-Www" format
    const [yearStr, weekStr] = weekKey.split("-W")
    const year = parseInt(yearStr, 10)
    const week = parseInt(weekStr, 10)
    const firstDayOfYear = new Date(Date.UTC(year, 0, 1))
    const dayOfWeek = firstDayOfYear.getUTCDay() || 7
    const firstMonday = new Date(firstDayOfYear)
    if (dayOfWeek !== 1) {
      firstMonday.setUTCDate(firstDayOfYear.getUTCDate() + (8 - dayOfWeek))
    }
    startDate = new Date(firstMonday)
    startDate.setUTCDate(firstMonday.getUTCDate() + (week - 1) * 7)
  }

  const endDate = new Date(startDate)
  endDate.setUTCDate(startDate.getUTCDate() + 6)

  const startLabel = startDate.toLocaleString("default", { month: "short", day: "numeric", timeZone: "UTC" })
  const endLabel = endDate.toLocaleString("default", { month: "short", day: "numeric", timeZone: "UTC" })
  return `${startLabel} - ${endLabel}`
}
