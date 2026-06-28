"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { CheckCircle2, Loader2, ArrowRight } from "lucide-react"
import { createMachine } from "../machines/actions"
import { AddProductDialog } from "../products/add-product"
import { getSetupStatus, type SetupStatus } from "./actions"
import { MachineType } from "@/domains/VendingMachine/entities/VendingMachine"
import { toast } from "@/hooks/use-toast"

function StepBadge({ done, n, active }: { done: boolean; n: number; active: boolean }) {
  if (done) {
    return (
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-green-500/15 text-green-600 dark:text-green-400">
        <CheckCircle2 className="h-5 w-5" />
      </span>
    )
  }
  return (
    <span
      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${
        active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
      }`}
    >
      {n}
    </span>
  )
}

export function SetupWizard() {
  const [status, setStatus] = useState<SetupStatus | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Step 1 form state
  const [model, setModel] = useState("")
  const [type, setType] = useState<MachineType>(MachineType.SNACK)
  const [locationName, setLocationName] = useState("")
  const [salesSource, setSalesSource] = useState<"manual" | "telemetry">("manual")
  const [cardReaderId, setCardReaderId] = useState("")
  const [isCreatingMachine, setIsCreatingMachine] = useState(false)

  const refresh = async () => {
    const s = await getSetupStatus()
    setStatus(s)
  }

  useEffect(() => {
    refresh().finally(() => setIsLoading(false))
  }, [])

  const handleCreateMachine = async () => {
    if (!model.trim() || !locationName.trim()) {
      toast({ variant: "destructive", title: "Missing info", description: "Enter a model and a location name." })
      return
    }
    setIsCreatingMachine(true)
    try {
      await createMachine({
        type,
        model: model.trim(),
        locationName: locationName.trim(),
        cardReaderId: salesSource === "telemetry" && cardReaderId.trim() ? cardReaderId.trim() : undefined,
      })
      await refresh()
      toast({ title: "Machine added", description: `${model.trim()} is ready.` })
    } catch (error) {
      console.error("createMachine:", error)
      toast({ variant: "destructive", title: "Error", description: "Failed to add machine." })
    } finally {
      setIsCreatingMachine(false)
    }
  }

  if (isLoading || !status) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const machineDone = !!status.machine
  const productsDone = status.productCount > 0
  const slotsDone = status.hasConfiguredSlots
  const allDone = machineDone && productsDone && slotsDone

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">Set up your vending machine</h1>
        <p className="text-muted-foreground">
          A few quick steps and VendorPro will start tracking sales and telling you what to reorder.
        </p>
      </div>

      {/* Step 1 — Add machine */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <StepBadge n={1} done={machineDone} active={!machineDone} />
            <CardTitle className="text-base">
              {machineDone ? `Machine added — ${status.machine!.model}` : "Add your machine"}
            </CardTitle>
          </div>
        </CardHeader>
        {!machineDone && (
          <CardContent className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="model">Machine model</Label>
                <Input id="model" placeholder="e.g. Vendo 720" value={model} onChange={(e) => setModel(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="type">Machine type</Label>
                <Select value={type} onValueChange={(v) => setType(v as MachineType)}>
                  <SelectTrigger id="type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={MachineType.SNACK}>Snack</SelectItem>
                    <SelectItem value={MachineType.DRINK}>Drink</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="location">Where is it? (location name)</Label>
              <Input id="location" placeholder="e.g. Front lobby" value={locationName} onChange={(e) => setLocationName(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label>How are sales tracked?</Label>
              <RadioGroup value={salesSource} onValueChange={(v) => setSalesSource(v as "manual" | "telemetry")}>
                <label htmlFor="ss-manual" className="flex items-start gap-3 rounded-md border p-3 cursor-pointer">
                  <RadioGroupItem value="manual" id="ss-manual" className="mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">I&apos;ll count when I restock</p>
                    <p className="text-xs text-muted-foreground">VendorPro figures out what sold from your counts. No hardware needed.</p>
                  </div>
                </label>
                <label htmlFor="ss-telemetry" className="flex items-start gap-3 rounded-md border p-3 cursor-pointer">
                  <RadioGroupItem value="telemetry" id="ss-telemetry" className="mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">It has a card reader (Cantaloupe ePort)</p>
                    <p className="text-xs text-muted-foreground">Sales report automatically. Enter the reader&apos;s serial number.</p>
                    {salesSource === "telemetry" && (
                      <Input
                        className="mt-2"
                        placeholder="e.g. VK1001863385"
                        value={cardReaderId}
                        onChange={(e) => setCardReaderId(e.target.value)}
                      />
                    )}
                  </div>
                </label>
              </RadioGroup>
            </div>

            <Button onClick={handleCreateMachine} disabled={isCreatingMachine}>
              {isCreatingMachine ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Add machine
            </Button>
          </CardContent>
        )}
      </Card>

      {/* Step 2 — Add products */}
      <Card className={!machineDone ? "opacity-60" : undefined}>
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <StepBadge n={2} done={productsDone} active={machineDone && !productsDone} />
              <CardTitle className="text-base">
                {productsDone ? `Products added (${status.productCount})` : "Add products"}
              </CardTitle>
            </div>
            {machineDone && <AddProductDialog onSuccess={refresh} />}
          </div>
        </CardHeader>
        {machineDone && !productsDone && (
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Add the snacks or drinks this machine sells. Paste a Sam&apos;s Club / Costco link or enter them manually.
            </p>
          </CardContent>
        )}
      </Card>

      {/* Step 3 — Lay out slots */}
      <Card className={!productsDone ? "opacity-60" : undefined}>
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <StepBadge n={3} done={slotsDone} active={productsDone && !slotsDone} />
              <CardTitle className="text-base">
                {slotsDone ? "Slots laid out" : "Lay out your slots"}
              </CardTitle>
            </div>
            {productsDone && status.machine && (
              <Button asChild variant={slotsDone ? "outline" : "default"}>
                <Link href={`/web/machines/${status.machine.id}/setup?onboarding=1`}>
                  {slotsDone ? "Edit layout" : "Lay out slots"}
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Link>
              </Button>
            )}
          </div>
        </CardHeader>
        {productsDone && !slotsDone && (
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Place each product in the machine&apos;s rows and columns so VendorPro knows what goes where.
            </p>
          </CardContent>
        )}
      </Card>

      <div className="flex items-center justify-between pt-2">
        <Button variant="ghost" asChild>
          <Link href="/web/dashboard">{allDone ? "Done" : "Skip for now"}</Link>
        </Button>
        {allDone && (
          <Button asChild>
            <Link href="/web/dashboard">
              Finish
              <ArrowRight className="h-4 w-4 ml-2" />
            </Link>
          </Button>
        )}
      </div>
    </div>
  )
}
