"use client"

import { useState, useEffect } from "react"
import { Search, Plus, Route, Unplug, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { PreKitsList } from "./prekits-list"
import { PreKitDetailsDialog } from "./prekit-details-dialog"
import { getOrgPreKits, getOrgMachines, generatePreKit } from "./actions"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"

interface PreKitItem {
  id: string
  preKitId: string
  productId: string
  quantity: number
  slotId: string
  productImage: string
  productName: string
  currentQuantity: number
  capacity: number
  slotCode: string
  inStock?: number
}

interface PreKit {
  id: string
  machineId: string
  status: "OPEN" | "PICKED" | "STOCKED"
  createdAt: Date
  items: PreKitItem[]
  routeId?: string | null
  routeName?: string | null
  locationName?: string | null
}

export default function PreKitsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedPreKit, setSelectedPreKit] = useState<PreKit | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [preKits, setPreKits] = useState<PreKit[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showStocked, setShowStocked] = useState(false)

  // Generate dialog state
  const [isGenerateOpen, setIsGenerateOpen] = useState(false)
  const [machines, setMachines] = useState<{ id: string; locationId: string }[]>([])
  const [selectedMachineId, setSelectedMachineId] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [generateError, setGenerateError] = useState<string | null>(null)

  const fetchPreKits = async () => {
    try {
      setIsLoading(true)
      const result = await getOrgPreKits()
      if (result.success && result.data) {
        setPreKits(
          result.data.map((preKit) => ({
            ...preKit,
            createdAt: new Date(), // TODO: Get actual createdAt from the server
          }))
        )
      } else {
        setError(result.error || "Failed to fetch pre-kits")
      }
    } catch (error) {
      console.error("Error fetching pre-kits:", error)
      setError("Failed to fetch pre-kits")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchPreKits()
  }, [])

  const handlePreKitClick = (preKit: PreKit) => {
    setSelectedPreKit(preKit)
    setIsDialogOpen(true)
  }

  const handlePreKitPicked = () => {
    fetchPreKits()
  }

  const handlePreKitStocked = () => {
    fetchPreKits()
  }

  const handlePreKitDeleted = () => {
    fetchPreKits()
  }

  const handleOpenGenerate = async () => {
    setGenerateError(null)
    setSelectedMachineId("")
    setIsGenerateOpen(true)
    const result = await getOrgMachines()
    if (result.success && result.data) setMachines(result.data)
  }

  const handleGenerate = async () => {
    if (!selectedMachineId) return
    setIsGenerating(true)
    setGenerateError(null)
    const result = await generatePreKit(selectedMachineId)
    setIsGenerating(false)
    if (!result.success) {
      setGenerateError(result.error ?? "Failed to generate pre-kit")
      return
    }
    setIsGenerateOpen(false)
    fetchPreKits()
  }

  const filteredPreKits = preKits.filter((preKit) => {
    if (!showStocked && preKit.status === "STOCKED") return false
    return preKit.machineId.toLowerCase().includes(searchQuery.toLowerCase())
  })

  // Group pre-kits by route
  const groupedPreKits = filteredPreKits.reduce((acc, preKit) => {
    const routeKey = preKit.routeName || "No Route"
    if (!acc[routeKey]) {
      acc[routeKey] = {
        routeName: preKit.routeName || "No Route",
        routeId: preKit.routeId || null,
        preKits: []
      }
    }
    acc[routeKey].preKits.push(preKit)
    return acc
  }, {} as Record<string, { routeName: string; routeId: string | null; preKits: PreKit[] }>)

  // Convert to array and sort (routes with names first, then "No Route")
  const sortedGroups = Object.values(groupedPreKits).sort((a, b) => {
    if (a.routeName === "No Route") return 1
    if (b.routeName === "No Route") return -1
    return a.routeName.localeCompare(b.routeName)
  })

  if (isLoading) {
    return <div>Loading...</div>
  }

  if (error) {
    return <div>Error: {error}</div>
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Pre-Kits</h1>
        <Button onClick={handleOpenGenerate}>
          <Plus className="mr-2 h-4 w-4" />
          Create Pre-Kit
        </Button>
      </div>

      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by machine ID or route..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground whitespace-nowrap">
              <Switch
                id="show-stocked"
                checked={showStocked}
                onCheckedChange={setShowStocked}
              />
              <Label htmlFor="show-stocked">Show stocked</Label>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-6">
        {sortedGroups.map((group) => {
          const isUnassigned = group.routeName === "No Route"
          // If there's only one group and it's unassigned, skip the section header entirely
          const hideHeader = isUnassigned && sortedGroups.length === 1
          return (
            <Card key={group.routeId || "no-route"}>
              {!hideHeader && (
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {isUnassigned
                        ? <Unplug className="h-5 w-5 text-muted-foreground" />
                        : <Route className="h-5 w-5 text-primary" />
                      }
                      <CardTitle className={`text-xl ${isUnassigned ? "text-muted-foreground" : ""}`}>
                        {isUnassigned ? "Unassigned" : group.routeName}
                      </CardTitle>
                    </div>
                    <Badge variant="secondary">
                      {group.preKits.length} pre-kit{group.preKits.length !== 1 ? 's' : ''}
                    </Badge>
                  </div>
                </CardHeader>
              )}
              <CardContent className={hideHeader ? "pt-6" : undefined}>
                <PreKitsList
                  preKits={group.preKits}
                  onPreKitClick={handlePreKitClick}
                />
              </CardContent>
            </Card>
          )
        })}

        {sortedGroups.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">No pre-kits found</p>
            </CardContent>
          </Card>
        )}
      </div>

      <PreKitDetailsDialog
        preKit={selectedPreKit}
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onPreKitPicked={handlePreKitPicked}
        onPreKitStocked={handlePreKitStocked}
        onPreKitDeleted={handlePreKitDeleted}
      />

      <Dialog open={isGenerateOpen} onOpenChange={setIsGenerateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create Pre-Kit</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Machine</Label>
              <Select value={selectedMachineId} onValueChange={setSelectedMachineId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a machine" />
                </SelectTrigger>
                <SelectContent>
                  {machines.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.id}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <p className="text-sm text-muted-foreground">
              Slots at 30% capacity or below will be included in the pre-kit.
            </p>
            {generateError && (
              <p className="text-sm text-destructive">{generateError}</p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsGenerateOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleGenerate} disabled={!selectedMachineId || isGenerating}>
              {isGenerating ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Generating...</> : "Generate"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
