interface InventoryDistributionBarProps {
  inMachines: number
  inStorage: number
  totalCapacity?: number
  showPercentage?: boolean
  className?: string
}

export function InventoryDistributionBar({
  inMachines,
  inStorage,
  totalCapacity,
  showPercentage = true,
  className,
}: InventoryDistributionBarProps) {
  const total = totalCapacity || inMachines + inStorage
  const machinePercentage = Math.round((inMachines / total) * 100)
  const storagePercentage = Math.round((inStorage / total) * 100)

  return (
    <div className={`space-y-1 ${className}`}>
      {/* Top labels */}
      <div className="flex justify-between items-center text-sm">
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-3 rounded-sm bg-primary" />
          <span>In Machines</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span>In Storage</span>
          <div className="h-3 w-3 rounded-sm bg-sky-500" />
        </div>
      </div>

      {/* The bar - thinner now */}
      <div className="relative">
        <div className="overflow-hidden rounded-full bg-muted">
          <div
            className="h-2.5 bg-sky-500 transition-all"
            style={{
              width: `${storagePercentage}%`,
              float: "right",
            }}
          />
          <div
            className="h-2.5 bg-primary transition-all"
            style={{
              width: `${machinePercentage}%`,
            }}
          />
        </div>
      </div>

      {/* Bottom values */}
      <div className="flex justify-between items-center text-sm">
        <div>
          <span className="font-medium">{inMachines} units</span>
          {showPercentage && (
            <span className="text-muted-foreground ml-1">
              ({machinePercentage}%)
            </span>
          )}
        </div>
        <div>
          <span className="font-medium">{inStorage} units</span>
          {showPercentage && (
            <span className="text-muted-foreground ml-1">
              ({storagePercentage}%)
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
