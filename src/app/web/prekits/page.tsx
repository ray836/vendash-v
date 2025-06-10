"use client"

import { useState, useEffect } from "react"
import { Search, Filter, Plus } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { PreKitsList } from "./prekits-list"
import { PreKitDetailsDialog } from "./prekit-details-dialog"
import { getOrgPreKits } from "./actions"

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
}

interface PreKit {
  id: string
  machineId: string
  status: "OPEN" | "PICKED" | "STOCKED"
  createdAt: Date
  items: PreKitItem[]
}

export default function PreKitsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedPreKit, setSelectedPreKit] = useState<PreKit | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [preKits, setPreKits] = useState<PreKit[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchPreKits = async () => {
    try {
      setIsLoading(true)
      const result = await getOrgPreKits("1") // TODO: Replace with actual orgId
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

  const filteredPreKits = preKits.filter((preKit) =>
    preKit.machineId.toLowerCase().includes(searchQuery.toLowerCase())
  )

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
        <Button>
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
                placeholder="Search by machine ID..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button variant="outline">
              <Filter className="mr-2 h-4 w-4" />
              Filter
            </Button>
          </div>
        </CardContent>
      </Card>

      <PreKitsList
        preKits={filteredPreKits}
        onPreKitClick={handlePreKitClick}
      />

      <PreKitDetailsDialog
        preKit={selectedPreKit}
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onPreKitPicked={handlePreKitPicked}
      />
    </div>
  )
}
