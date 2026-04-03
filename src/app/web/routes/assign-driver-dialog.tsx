"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Calendar } from "@/components/ui/calendar"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { CalendarIcon, User, Clock, MapPin } from "lucide-react"
import { getDrivers } from "./actions"
import { useSession } from "@/lib/use-session"

interface AssignDriverDialogProps {
  route?: any
  open: boolean
  onOpenChange: (open: boolean) => void
  onAssign: (assignment: any) => void
}

export function AssignDriverDialog({
  route,
  open,
  onOpenChange,
  onAssign,
}: AssignDriverDialogProps) {
  const { data: session } = useSession()
  const [selectedDriver, setSelectedDriver] = useState("")
  const [scheduledDate, setScheduledDate] = useState<Date | undefined>(new Date())
  const [startTime, setStartTime] = useState("08:00")
  const [estimatedDuration, setEstimatedDuration] = useState("")
  const [notes, setNotes] = useState("")
  const [drivers, setDrivers] = useState<any[]>([])
  const [isLoadingDrivers, setIsLoadingDrivers] = useState(false)

  useEffect(() => {
    if (route) {
      // Pre-fill estimated duration from route if available
      setEstimatedDuration(route.estimatedDuration?.toString() || "")
    }
  }, [route])

  // Load drivers when dialog opens
  useEffect(() => {
    if (open) {
      loadDrivers()
    } else {
      // Reset drivers when dialog closes
      setDrivers([])
    }
  }, [open])

  const loadDrivers = async () => {
    // Prevent multiple concurrent loads
    if (isLoadingDrivers) return

    setIsLoadingDrivers(true)
    try {
      const result = await getDrivers()
      console.log("Drivers result:", result)

      if (result.success && result.data) {
        setDrivers(result.data)
        console.log("Loaded drivers:", result.data.length)
      } else {
        // Use mock drivers as fallback
        const mockDrivers = [
          { id: "driver-001", firstName: "John", lastName: "Doe", email: "john.doe@demo.com", status: "available" },
          { id: "driver-002", firstName: "Jane", lastName: "Smith", email: "jane.smith@demo.com", status: "available" },
          { id: "driver-003", firstName: "Mike", lastName: "Johnson", email: "mike.johnson@demo.com", status: "busy" },
          { id: "driver-004", firstName: "Sarah", lastName: "Williams", email: "sarah.williams@demo.com", status: "available" },
        ]
        setDrivers(mockDrivers)
      }
    } catch (error) {
      console.error("Failed to load drivers:", error)
      // Fallback to mock data on error - matches seeded driver IDs
      const mockDrivers = [
        { id: "driver-001", firstName: "John", lastName: "Doe", email: "john.doe@demo.com", status: "available" },
        { id: "driver-002", firstName: "Jane", lastName: "Smith", email: "jane.smith@demo.com", status: "available" },
        { id: "driver-003", firstName: "Mike", lastName: "Johnson", email: "mike.johnson@demo.com", status: "busy" },
        { id: "driver-004", firstName: "Sarah", lastName: "Williams", email: "sarah.williams@demo.com", status: "available" },
      ]
      setDrivers(mockDrivers)
    } finally {
      setIsLoadingDrivers(false)
    }
  }

  const handleAssign = () => {
    if (!selectedDriver || !scheduledDate) return

    const assignment = {
      routeId: route?.id,
      driverId: selectedDriver,
      scheduledDate: scheduledDate,
      startTime: startTime,
      estimatedDuration: parseInt(estimatedDuration) || route?.estimatedDuration || 0,
      notes: notes,
    }

    onAssign(assignment)

    // Reset form
    setSelectedDriver("")
    setScheduledDate(new Date())
    setStartTime("08:00")
    setNotes("")
  }

  const selectedDriverInfo = drivers.find(d => d.id === selectedDriver)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Assign Driver to Route</DialogTitle>
          <DialogDescription>
            Schedule a driver for "{route?.name}"
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Route Info */}
          {route && (
            <div className="rounded-lg bg-muted/50 p-3 space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{route.stops?.length || 0} stops</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span>Est. {Math.floor(route.estimatedDuration / 60)}h {route.estimatedDuration % 60}m</span>
              </div>
            </div>
          )}

          {/* Driver Selection */}
          <div className="grid gap-2">
            <Label htmlFor="driver">Select Driver</Label>
            <Select value={selectedDriver} onValueChange={setSelectedDriver}>
              <SelectTrigger id="driver">
                <SelectValue placeholder="Choose a driver" />
              </SelectTrigger>
              <SelectContent>
                {drivers.map(driver => (
                  <SelectItem
                    key={driver.id}
                    value={driver.id}
                    disabled={driver.status === "busy"}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <User className="h-3 w-3" />
                        <span>{driver.firstName} {driver.lastName}</span>
                      </div>
                      {driver.status === "busy" && (
                        <Badge variant="secondary" className="ml-2">Busy</Badge>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedDriverInfo && (
              <p className="text-sm text-muted-foreground">
                {selectedDriverInfo.email}
              </p>
            )}
          </div>

          {/* Date Selection */}
          <div className="grid gap-2">
            <Label htmlFor="date">Schedule Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  id="date"
                  variant="outline"
                  className={cn(
                    "justify-start text-left font-normal",
                    !scheduledDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {scheduledDate ? format(scheduledDate, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={scheduledDate}
                  onSelect={setScheduledDate}
                  initialFocus
                  disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Time Selection */}
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="time">Start Time</Label>
              <Input
                id="time"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="duration">Duration (minutes)</Label>
              <Input
                id="duration"
                type="number"
                value={estimatedDuration}
                onChange={(e) => setEstimatedDuration(e.target.value)}
                placeholder={route?.estimatedDuration?.toString() || "Est. duration"}
                min={0}
              />
            </div>
          </div>

          {/* Notes */}
          <div className="grid gap-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any special instructions or notes for the driver"
              rows={3}
            />
          </div>

          {/* Summary */}
          {selectedDriver && scheduledDate && (
            <div className="rounded-lg border p-3 space-y-1 bg-muted/30">
              <p className="text-sm font-medium">Assignment Summary</p>
              <p className="text-sm text-muted-foreground">
                {selectedDriverInfo?.firstName} {selectedDriverInfo?.lastName} will be assigned to {route?.name}
              </p>
              <p className="text-sm text-muted-foreground">
                on {format(scheduledDate, "MMMM d, yyyy")} at {startTime}
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleAssign}
            disabled={!selectedDriver || !scheduledDate}
          >
            Assign Driver
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}