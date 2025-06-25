import React from "react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomBarTooltip(props: any) {
  const { active, payload, label } = props
  if (!active || !payload || !payload.length) return null
  const date = new Date(label as string)
  const formattedDate = date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  })
  return (
    <div
      style={{
        background: "#18181b",
        color: "#fff",
        borderRadius: 8,
        padding: "0.75rem 1rem",
        boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
        border: "1px solid #27272a",
        minWidth: 90,
      }}
    >
      <div style={{ fontSize: 13, color: "#a1a1aa", marginBottom: 4 }}>
        {formattedDate}
      </div>
      <div style={{ fontWeight: 600, color: "#22c55e", fontSize: 16 }}>
        ${payload[0].value?.toFixed(2)}
      </div>
    </div>
  )
}

// Helper to get the date range for an ISO week string (e.g., '2025-W23')
function getDateRangeOfISOWeek(isoWeekString: string) {
  const [yearStr, weekStr] = isoWeekString.split("-W")
  const year = Number(yearStr)
  const week = Number(weekStr)
  // Set to the first day of the year
  const simple = new Date(year, 0, 1 + (week - 1) * 7)
  // ISO week starts on Monday
  const dayOfWeek = simple.getDay()
  const ISOweekStart = new Date(simple)
  if (dayOfWeek <= 4)
    ISOweekStart.setDate(simple.getDate() - simple.getDay() + 1)
  else ISOweekStart.setDate(simple.getDate() + 8 - simple.getDay())
  const ISOweekEnd = new Date(ISOweekStart)
  ISOweekEnd.setDate(ISOweekStart.getDate() + 6)
  return {
    start: ISOweekStart,
    end: ISOweekEnd,
  }
}

function formatXAxisLabel(period: string) {
  if (/^\d{4}-\d{2}-\d{2}$/.test(period)) {
    // Daily: ISO date
    const date = new Date(period)
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
  } else if (/^\d{4}-W\d{1,2}$/.test(period)) {
    // Weekly: e.g., 2025-W23
    const { start, end } = getDateRangeOfISOWeek(period)
    const startStr = start.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    })
    const endStr = end.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    })
    return `${startStr}–${endStr}`
  } else if (/^\d{4}-\d{2}$/.test(period)) {
    // Monthly: e.g., 2025-06
    const [year, month] = period.split("-")
    const date = new Date(Number(year), Number(month) - 1)
    return date.toLocaleDateString("en-US", { month: "short", year: "numeric" })
  }
  return period
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomXAxisTick({
  x,
  y,
  payload,
  index,
  isMobile,
  visibleTicksCount,
  groupBy,
}: {
  x: number
  y: number
  payload: any
  index: number
  isMobile: boolean
  visibleTicksCount: number
  groupBy?: "daily" | "weekly" | "monthly"
}) {
  const label = formatXAxisLabel(payload.value)
  if (isMobile && groupBy === "daily") {
    const middle = Math.floor(visibleTicksCount / 2)
    if (index !== 0 && index !== visibleTicksCount - 1 && index !== middle) {
      return null // Don't render a label at all
    }
  }
  const yOffset = isMobile ? 14 : 10
  return (
    <g>
      <text
        x={x}
        y={y + yOffset}
        fill="#888"
        fontSize={isMobile ? 10 : 12}
        textAnchor="end"
        transform={`rotate(-45, ${x}, ${y + yOffset})`}
      >
        {label}
      </text>
    </g>
  )
}

export interface SalesChartData {
  period: string
  sales: number
}

export interface SalesChartProps {
  data: SalesChartData[]
  groupBy?: "daily" | "weekly" | "monthly"
  isMobile?: boolean
}

export function SalesChart({ data, isMobile, groupBy }: SalesChartProps) {
  const isWeekly = groupBy === "weekly"
  const margin = isWeekly
    ? { top: 10, right: 40, left: 40, bottom: 70 }
    : { top: 10, right: 10, left: 10, bottom: 30 }
  const chartHeight = isWeekly ? 260 : 200
  return (
    <div style={{ width: "100%", height: chartHeight }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={margin}>
          <CartesianGrid strokeDasharray="3 3" stroke="#444" />
          <XAxis
            dataKey="period"
            tick={(props) => (
              <CustomXAxisTick
                {...props}
                isMobile={!!isMobile}
                visibleTicksCount={data.length}
                groupBy={groupBy}
              />
            )}
            axisLine={false}
            tickLine={false}
            interval={0}
            dy={10}
            minTickGap={10}
          />
          <YAxis
            tick={{ fill: "#888", fontSize: 12 }}
            axisLine={false}
            tickLine={false}
            width={40}
            tickFormatter={(v) => `$${v}`}
          />
          <RechartsTooltip content={<CustomBarTooltip />} />
          <Bar dataKey="sales" fill="#22c55e" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
