import { DollarSign, ShoppingCart, Store } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

interface SalesStatsProps {
  totalSales: number
  totalRevenue: number
  uniqueMachines: number
  salesChangePct?: number | null
  revenueChangePct?: number | null
  machinesChange?: number
  isLoading?: boolean
}

function ChangeLabel({ pct }: { pct: number | null | undefined }) {
  if (pct == null) return <p className="text-xs text-muted-foreground">No data last month</p>
  const sign = pct >= 0 ? "+" : ""
  const color = pct >= 0 ? "text-green-600" : "text-red-500"
  return (
    <p className={`text-xs ${color}`}>
      {sign}{pct}% from last month
    </p>
  )
}

export function SalesStats({
  totalSales,
  totalRevenue,
  uniqueMachines,
  salesChangePct,
  revenueChangePct,
  machinesChange,
  isLoading = false,
}: SalesStatsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
          <ShoppingCart className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <>
              <Skeleton className="h-8 w-20 mb-1" />
              <Skeleton className="h-3 w-32" />
            </>
          ) : (
            <>
              <div className="text-2xl font-bold">{totalSales}</div>
              <ChangeLabel pct={salesChangePct} />
            </>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <>
              <Skeleton className="h-8 w-20 mb-1" />
              <Skeleton className="h-3 w-32" />
            </>
          ) : (
            <>
              <div className="text-2xl font-bold">${totalRevenue.toFixed(2)}</div>
              <ChangeLabel pct={revenueChangePct} />
            </>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Active Machines</CardTitle>
          <Store className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <>
              <Skeleton className="h-8 w-20 mb-1" />
              <Skeleton className="h-3 w-32" />
            </>
          ) : (
            <>
              <div className="text-2xl font-bold">{uniqueMachines}</div>
              {machinesChange != null && (
                <p className={`text-xs ${machinesChange >= 0 ? "text-green-600" : "text-red-500"}`}>
                  {machinesChange >= 0 ? "+" : ""}{machinesChange} vs last month
                </p>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
