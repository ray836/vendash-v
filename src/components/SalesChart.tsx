"use client"

import React from "react"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

export interface SalesChartData {
  period: string
  sales: number
  cost?: number
}

export interface SalesChartProps {
  data: SalesChartData[]
  groupBy?: "daily" | "weekly" | "monthly"
  isMobile?: boolean
}

function formatLabel(period: string): string {
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

export function SalesChart({ data, groupBy }: SalesChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[220px] text-muted-foreground text-sm">
        No data for this period
      </div>
    )
  }

  const hasCostData = data.some((d) => d.cost != null && d.cost > 0)
  const maxSales = Math.max(...data.map((d) => d.sales), 1)
  const chartHeight = 180
  const interval = labelInterval(data.length)

  return (
    <div className="w-full overflow-hidden">
      {hasCostData && (
        <div className="flex gap-4 mb-2 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="inline-block w-3 h-3 rounded-sm bg-green-500" />
            <span className="text-muted-foreground">Profit</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="inline-block w-3 h-3 rounded-sm bg-orange-400" />
            <span className="text-muted-foreground">Cost</span>
          </div>
        </div>
      )}
      <div
        className="flex items-end gap-[2px]"
        style={{ height: chartHeight + 28 }}
      >
        {data.map((item, i) => {
          const label = formatLabel(item.period)
          const showLabel = i % interval === 0 || i === data.length - 1
          const cost = hasCostData ? Math.min(item.cost ?? 0, item.sales) : 0
          const profit = item.sales - cost
          const totalHeight = Math.max((item.sales / maxSales) * chartHeight, 2)
          const costHeight = item.sales > 0 ? (cost / item.sales) * totalHeight : 0
          const profitHeight = totalHeight - costHeight

          return (
            <div
              key={i}
              className="flex-1 flex flex-col justify-end items-center min-w-0"
              style={{ height: chartHeight + 28 }}
            >
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="w-full flex flex-col justify-end cursor-pointer rounded-t-sm overflow-hidden" style={{ height: totalHeight }}>
                      <div className="w-full bg-green-500 hover:bg-green-400 transition-colors" style={{ height: profitHeight }} />
                      {hasCostData && costHeight > 0 && (
                        <div className="w-full bg-orange-400 hover:bg-orange-300 transition-colors" style={{ height: costHeight }} />
                      )}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <div className="text-sm space-y-1">
                      <div className="font-semibold">{label}</div>
                      <div>Revenue: ${item.sales.toFixed(2)}</div>
                      {hasCostData && (
                        <>
                          <div>Cost: ${cost.toFixed(2)}</div>
                          <div>Profit: ${profit.toFixed(2)}</div>
                          <div>Margin: {item.sales > 0 ? Math.round((profit / item.sales) * 100) : 0}%</div>
                        </>
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
