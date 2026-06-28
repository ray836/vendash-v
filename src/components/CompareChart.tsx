"use client"

import React from "react"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

export interface CompareChartProps {
  current: { period: string; sales: number }[]
  previous: { period: string; sales: number }[]
  currentLabel?: string
  previousLabel?: string
}

export function formatLabel(period: string): string {
  if (/^\d{4}-\d{2}-\d{2}$/.test(period)) {
    const date = new Date(period + "T00:00:00")
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
  }
  if (/^\d{4}-W\d{1,2}$/.test(period)) {
    const [yearStr, weekStr] = period.split("-W")
    const year = Number(yearStr)
    const week = Number(weekStr)
    const simple = new Date(year, 0, 1 + (week - 1) * 7)
    const dow = simple.getDay()
    const start = new Date(simple)
    if (dow <= 4) start.setDate(simple.getDate() - dow + 1)
    else start.setDate(simple.getDate() + 8 - dow)
    return start.toLocaleDateString("en-US", { month: "short", day: "numeric" })
  }
  if (/^\d{4}-\d{2}$/.test(period)) {
    const [year, month] = period.split("-")
    const date = new Date(Number(year), Number(month) - 1)
    return date.toLocaleDateString("en-US", { month: "short", year: "2-digit" })
  }
  return period
}

function labelInterval(n: number): number {
  if (n <= 12) return 1
  if (n <= 31) return 7
  if (n <= 90) return 14
  return 30
}

export function CompareChart({
  current,
  previous,
  currentLabel = "Current",
  previousLabel = "Previous",
}: CompareChartProps) {
  if (!current.length) {
    return (
      <div className="flex items-center justify-center h-[220px] text-muted-foreground text-sm">
        No data for this period
      </div>
    )
  }

  const maxVal = Math.max(
    ...current.map((d) => d.sales),
    ...previous.map((d) => d.sales),
    1
  )
  const chartHeight = 180
  const interval = labelInterval(current.length)

  return (
    <div className="w-full overflow-hidden">
      <div className="flex gap-4 mb-2 text-xs">
        <div className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded-sm bg-blue-500" />
          <span className="text-muted-foreground">{currentLabel}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded-sm bg-slate-300 dark:bg-slate-600" />
          <span className="text-muted-foreground">{previousLabel}</span>
        </div>
      </div>
      <div
        className="flex items-end gap-[3px]"
        style={{ height: chartHeight + 28 }}
      >
        {current.map((item, i) => {
          const prev = previous[i]
          const currH = Math.max((item.sales / maxVal) * chartHeight, item.sales > 0 ? 2 : 0)
          const prevH = prev ? Math.max((prev.sales / maxVal) * chartHeight, prev.sales > 0 ? 2 : 0) : 0
          const showLabel = i % interval === 0 || i === current.length - 1
          const label = formatLabel(item.period)

          return (
            <div
              key={i}
              className="flex-1 flex flex-col justify-end min-w-0"
              style={{ height: chartHeight + 28 }}
            >
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div
                      className="w-full flex gap-[1px] items-end cursor-pointer"
                      style={{ height: chartHeight }}
                    >
                      <div
                        className="flex-1 bg-blue-500 hover:bg-blue-400 rounded-t-sm transition-colors"
                        style={{ height: currH }}
                      />
                      <div
                        className="flex-1 bg-slate-300 dark:bg-slate-600 hover:bg-slate-200 dark:hover:bg-slate-500 rounded-t-sm transition-colors"
                        style={{ height: prevH }}
                      />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <div className="text-sm space-y-1">
                      <div className="font-semibold">{label}</div>
                      <div>{currentLabel}: ${item.sales.toFixed(2)}</div>
                      {prev && <div>{previousLabel}: ${prev.sales.toFixed(2)}</div>}
                      {prev && prev.sales > 0 && (
                        <div className={item.sales >= prev.sales ? "text-green-500" : "text-red-500"}>
                          {item.sales >= prev.sales ? "▲" : "▼"}{" "}
                          {Math.abs(Math.round(((item.sales - prev.sales) / prev.sales) * 100))}%
                        </div>
                      )}
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <div className="h-[20px] flex items-start justify-center w-full mt-1">
                {showLabel && (
                  <span className="text-[10px] text-muted-foreground leading-none text-center whitespace-nowrap">
                    {label}
                  </span>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
