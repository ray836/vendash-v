interface CompactInventoryBarProps {
  inMachines: number
  inStorage: number
  totalCapacity?: number
  className?: string
}

export function CompactInventoryBar({
  inMachines,
  inStorage,
  totalCapacity,
  className,
}: CompactInventoryBarProps) {
  const total = totalCapacity || inMachines + inStorage
  const machinePercentage = Math.round((inMachines / total) * 100)
  const storagePercentage = Math.round((inStorage / total) * 100)
  const totalInventory = inMachines + inStorage

  return (
    <div className={`${className}`}>
      <div className="flex items-center gap-2">
        <div className="flex-1">
          <div className="relative h-2 overflow-hidden rounded-full bg-muted">
            <div
              className="absolute right-0 top-0 h-full bg-sky-500 transition-all"
              style={{ width: `${storagePercentage}%` }}
            />
            <div
              className="absolute left-0 top-0 h-full bg-primary transition-all"
              style={{ width: `${machinePercentage}%` }}
            />
          </div>
        </div>

        <div className="flex items-center text-xs whitespace-nowrap">
          <span className="font-medium">
            {totalInventory} / {total}
          </span>
        </div>
      </div>
    </div>
  )
}
