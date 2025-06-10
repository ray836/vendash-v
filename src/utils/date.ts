import { GroupByType } from "@/domains/Transaction/schemas/GetTransactionGraphDataSchemas"

export function formatDateLabel(date: string, groupedBy: GroupByType): string {
  const dateObj = new Date(date)

  switch (groupedBy) {
    case GroupByType.DAY:
      return dateObj.toLocaleString("default", {
        month: "short",
        day: "numeric",
      })
    case GroupByType.WEEK:
      const weekNo = Math.ceil((dateObj.getDate() + dateObj.getDay()) / 7)
      return `Week ${weekNo}`
    case GroupByType.MONTH:
      return dateObj.toLocaleString("default", { month: "short" })
    default:
      return date
  }
}

export function formatWeekRangeLabel(weekKey: string): string {
  // weekKey format: "YYYY-Www"
  const [yearStr, weekStr] = weekKey.split("-W")
  const year = parseInt(yearStr, 10)
  const week = parseInt(weekStr, 10)

  // Get the first day of the year
  const firstDayOfYear = new Date(Date.UTC(year, 0, 1))
  // Calculate the day of the week (0 = Sunday, 1 = Monday, ...)
  const dayOfWeek = firstDayOfYear.getUTCDay() || 7
  // Calculate the date of the first Monday of the year
  const firstMonday = new Date(firstDayOfYear)
  if (dayOfWeek !== 1) {
    firstMonday.setUTCDate(firstDayOfYear.getUTCDate() + (8 - dayOfWeek))
  }
  // Calculate the start date of the given week
  const startDate = new Date(firstMonday)
  startDate.setUTCDate(firstMonday.getUTCDate() + (week - 1) * 7)
  // End date is 6 days after start date
  const endDate = new Date(startDate)
  endDate.setUTCDate(startDate.getUTCDate() + 6)

  // Format as "Mon D - Mon D"
  const startLabel = startDate.toLocaleString("default", {
    month: "short",
    day: "numeric",
  })
  const endLabel = endDate.toLocaleString("default", {
    month: "short",
    day: "numeric",
  })
  return `${startLabel} - ${endLabel}`
}
