"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { PublicVendingMachineDTO } from "@/domains/VendingMachine/schemas/vendingMachineDTOs"

interface MachineSettingsDialogProps {
  machine: PublicVendingMachineDTO
  onUpdate: (cardReaderId: string) => Promise<void>
  locations: { id: string; name: string }[]
  onSaveMachineInfo: (info: {
    model: string
    notes: string
    locationId: string
  }) => Promise<void>
  isSavingInfo: boolean
}

export function MachineSettingsDialog({
  machine,
  onUpdate,
  locations,
  onSaveMachineInfo,
  isSavingInfo,
}: MachineSettingsDialogProps) {
  const { toast } = useToast()
  const [isSaving, setIsSaving] = useState(false)
  const [cardReaderId, setCardReaderId] = useState(machine.cardReaderId || "")
  const [machineInfo, setMachineInfo] = useState({
    model: machine.model || "",
    notes: machine.notes || "",
    locationId: machine.locationId || "",
  })
  console.log(locations)
  console.log("iiiiikkkkkiiaaaa")

  const handleCardReaderUpdate = async (newCardReaderId: string) => {
    try {
      setIsSaving(true)
      await onUpdate(newCardReaderId)
      toast({
        title: "Success",
        description: "Card reader ID updated successfully",
      })
    } catch {
      toast({
        title: "Error",
        description: "Failed to update card reader ID",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleMachineInfoUpdate = async () => {
    await onSaveMachineInfo(machineInfo)
  }

  return (
    <div className="space-y-6 p-4">
      {/* Machine Information Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Machine Information</h3>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="model">Machine Model</Label>
            <Input
              id="model"
              value={machineInfo.model}
              onChange={(e) =>
                setMachineInfo((prev) => ({ ...prev, model: e.target.value }))
              }
              placeholder="Enter machine model"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={machineInfo.notes}
              onChange={(e) =>
                setMachineInfo((prev) => ({ ...prev, notes: e.target.value }))
              }
              placeholder="Enter machine notes"
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="locationId">Location</Label>
            <Select
              value={machineInfo.locationId}
              onValueChange={(value) =>
                setMachineInfo((prev) => ({ ...prev, locationId: value }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a location" />
              </SelectTrigger>
              <SelectContent>
                {locations.map((loc) => (
                  <SelectItem key={loc.id} value={loc.id}>
                    {loc.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            onClick={handleMachineInfoUpdate}
            disabled={isSavingInfo}
            className="w-full"
          >
            {isSavingInfo ? "Saving..." : "Save Machine Info"}
          </Button>
        </div>
      </div>
      <Separator />
      {/* Card Reader Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Card Reader Settings</h3>
        <div className="space-y-2">
          <Label htmlFor="cardReaderId">Card Reader ID</Label>
          <div className="flex gap-2">
            <Input
              id="cardReaderId"
              value={cardReaderId}
              onChange={(e) => setCardReaderId(e.target.value)}
              placeholder="Enter card reader ID"
            />
            <Button
              onClick={() => handleCardReaderUpdate(cardReaderId)}
              disabled={isSaving}
            >
              {isSaving ? "Saving..." : "Save"}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            This ID is used to associate transactions with this machine
          </p>
        </div>
      </div>
    </div>
  )
}
