"use client"

import { Package } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface MiniPreKitCardProps {
  preKit: {
    id: string
    machineId: string
    status: string
    items: any[]
  }
  onClick: () => void
}

export function MiniPreKitCard({ preKit, onClick }: MiniPreKitCardProps) {
  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case "OPEN":
        return "bg-blue-100 text-blue-800"
      case "PICKED":
        return "bg-yellow-100 text-yellow-800"
      case "STOCKED":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div
      className="border rounded-lg p-3 hover:bg-accent/50 cursor-pointer transition-colors flex flex-col gap-2"
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Package className="h-4 w-4 text-primary" />
          <span className="font-medium text-sm">{preKit.machineId}</span>
        </div>
        <Badge className={getStatusColor(preKit.status)}>
          {preKit.status}
        </Badge>
      </div>
      <div className="text-xs text-muted-foreground">
        {preKit.items.length} item{preKit.items.length !== 1 ? 's' : ''}
      </div>
    </div>
  )
}
