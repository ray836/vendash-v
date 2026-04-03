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

// How often to show an x-axis label given N bars
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

  const maxSales = Math.max(...data.map((d) => d.sales), 1)
  const chartHeight = 180
  const interval = labelInterval(data.length)

  return (
    <div className="w-full overflow-hidden">
      <div
        className="flex items-end gap-[2px]"
        style={{ height: chartHeight + 28 }}
      >
        {data.map((item, i) => {
          const barHeight = Math.max((item.sales / maxSales) * chartHeight, 2)
          const label = formatLabel(item.period)
          const showLabel = i % interval === 0 || i === data.length - 1

          return (
            <div
              key={i}
              className="flex-1 flex flex-col justify-end items-center min-w-0"
              style={{ height: chartHeight + 28 }}
            >
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div
                      className="w-full bg-green-500 hover:bg-green-400 rounded-t-sm transition-colors cursor-pointer"
                      style={{ height: `${barHeight}px` }}
                    />
                  </TooltipTrigger>
                  <TooltipContent>
                    <div className="text-sm">
                      <div className="font-semibold">{label}</div>
                      <div>${item.sales.toFixed(2)}</div>
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
