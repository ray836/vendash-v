"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"

const CONFIGS: Record<string, {
  emoji: string
  label: string
  unit: string
  purchaseRate: number
  avgTx: number
  min: number
  max: number
  defaultVal: number
}> = {
  hotel:      { emoji: "🏨", label: "Hotel / Motel",     unit: "guests/day",    purchaseRate: 0.08, avgTx: 2.75, min: 10,  max: 500,  defaultVal: 80  },
  laundromat: { emoji: "👗", label: "Laundromat",         unit: "customers/day", purchaseRate: 0.15, avgTx: 2.00, min: 10,  max: 300,  defaultVal: 60  },
  gym:        { emoji: "🏋️", label: "Gym / Fitness",     unit: "members/day",   purchaseRate: 0.10, avgTx: 2.75, min: 10,  max: 500,  defaultVal: 100 },
  office:     { emoji: "🏢", label: "Office Building",    unit: "employees",     purchaseRate: 0.20, avgTx: 2.00, min: 5,   max: 300,  defaultVal: 50  },
  hospital:   { emoji: "🏥", label: "Hospital / Clinic",  unit: "visitors/day",  purchaseRate: 0.08, avgTx: 2.50, min: 20,  max: 1000, defaultVal: 150 },
  barbershop: { emoji: "💈", label: "Barbershop / Salon", unit: "clients/day",   purchaseRate: 0.12, avgTx: 2.00, min: 5,   max: 150,  defaultVal: 30  },
}

function fmt(n: number) {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 })
}

export function EarningsCalculator() {
  const [businessType, setBusinessType] = useState("hotel")
  const [visitors, setVisitors] = useState(CONFIGS["hotel"].defaultVal)

  const cfg = CONFIGS[businessType]

  const monthlyGross = visitors * cfg.purchaseRate * cfg.avgTx * 30
  const monthlyProfit = monthlyGross * 0.40
  const profitLow = Math.round(monthlyProfit / 10) * 10
  const profitHigh = Math.round((monthlyProfit * 1.30) / 10) * 10
  const annualLow = profitLow * 12
  const annualHigh = profitHigh * 12

  const handleTypeChange = (key: string) => {
    setBusinessType(key)
    setVisitors(CONFIGS[key].defaultVal)
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="text-center mb-10">
        <h2 className="text-3xl font-bold mb-3">How much could your machine earn?</h2>
        <p className="text-muted-foreground">
          Select your business type and drag the slider to match your daily traffic.
        </p>
      </div>

      {/* Business type selector */}
      <div className="flex flex-wrap gap-2 justify-center mb-8">
        {Object.entries(CONFIGS).map(([key, val]) => (
          <button
            key={key}
            onClick={() => handleTypeChange(key)}
            className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
              businessType === key
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border/50 bg-muted/20 text-muted-foreground hover:border-border hover:text-foreground"
            }`}
          >
            <span>{val.emoji}</span>
            {val.label}
          </button>
        ))}
      </div>

      {/* Slider */}
      <div className="mb-8 px-2">
        <div className="flex items-center justify-between mb-3">
          <label className="text-sm text-muted-foreground">Daily {cfg.unit}</label>
          <span className="text-2xl font-bold tabular-nums">
            {visitors.toLocaleString()}
            <span className="text-sm font-normal text-muted-foreground ml-1.5">{cfg.unit}</span>
          </span>
        </div>
        <input
          type="range"
          min={cfg.min}
          max={cfg.max}
          step={cfg.max <= 150 ? 1 : cfg.max <= 500 ? 5 : 10}
          value={visitors}
          onChange={(e) => setVisitors(Number(e.target.value))}
          className="w-full h-2 rounded-full appearance-none cursor-pointer accent-primary bg-muted"
        />
        <div className="flex justify-between text-xs text-muted-foreground mt-1.5">
          <span>{cfg.min}</span>
          <span>{cfg.max.toLocaleString()}</span>
        </div>
      </div>

      {/* Results card */}
      <div className="rounded-2xl border border-border/50 bg-muted/20 p-8 text-center space-y-6">
        <div>
          <p className="text-sm text-muted-foreground mb-1">Estimated monthly profit</p>
          <p className="text-5xl font-bold text-green-400 tabular-nums">
            {fmt(profitLow)} – {fmt(profitHigh)}
            <span className="text-xl font-normal text-muted-foreground ml-2">/ month</span>
          </p>
        </div>

        <div className="border-t border-border/30 pt-6 grid sm:grid-cols-2 gap-4">
          <div className="rounded-xl bg-muted/30 p-4">
            <p className="text-xs text-muted-foreground mb-1">Annual earnings (1 machine)</p>
            <p className="text-2xl font-bold tabular-nums">{fmt(annualLow)} – {fmt(annualHigh)}</p>
          </div>
          <div className="rounded-xl bg-primary/5 border border-primary/20 p-4">
            <p className="text-xs text-muted-foreground mb-1">Annual earnings (2 machines)</p>
            <p className="text-2xl font-bold text-primary tabular-nums">{fmt(annualLow * 2)} – {fmt(annualHigh * 2)}</p>
          </div>
        </div>

        <p className="text-xs text-muted-foreground">
          * Estimates based on industry averages for {cfg.label.toLowerCase()} locations.
          Profit calculated at ~40% margin after wholesale product costs.
          Actual results vary by product mix, pricing, and foot traffic.
        </p>

        <Button asChild size="lg" className="w-full sm:w-auto">
          <Link href="/sign-up">
            Start tracking your real earnings
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>
    </div>
  )
}
