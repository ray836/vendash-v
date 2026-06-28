"use client"

import { useState, useRef } from "react"

export interface ProductLine {
  id: string
  name: string
  data: number[]
}

interface Props {
  labels: string[]
  products: ProductLine[]
  viewWidth?: number
  viewHeight?: number
}

const COLORS = ["#22c55e", "#3b82f6", "#f59e0b", "#a855f7", "#ec4899"]
const PAD = { top: 8, right: 16, bottom: 28, left: 52 }

function buildPath(xs: number[], ys: number[]): string {
  if (xs.length === 0) return ""
  return xs.map((x, i) => `${i === 0 ? "M" : "L"} ${x} ${ys[i]}`).join(" ")
}

interface HoverState {
  idx: number
  mouseX: number  // px relative to container
  mouseY: number  // px relative to container
}

export function TopProductsLineChart({ labels, products, viewWidth = 560, viewHeight = 190 }: Props) {
  const [hover, setHover] = useState<HoverState | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const n = labels.length
  if (n === 0 || products.length === 0) {
    return <p className="text-sm text-muted-foreground py-6 text-center">No data for this period</p>
  }

  const CW = viewWidth - PAD.left - PAD.right
  const CH = viewHeight - PAD.top - PAD.bottom

  const maxValue = products.reduce((m, p) => Math.max(m, ...p.data), 0) || 10
  const maxY = maxValue * 1.1

  const xOf = (i: number) => PAD.left + (n > 1 ? (i / (n - 1)) * CW : CW / 2)
  const yOf = (v: number) => PAD.top + CH - (v / maxY) * CH

  const yTicks = Array.from({ length: 5 }, (_, i) => (maxY / 4) * i)

  const pixelsPerPoint = CW / Math.max(n - 1, 1)
  const xInterval = Math.max(1, Math.ceil(22 / pixelsPerPoint))

  function handleMouseMove(e: React.MouseEvent<SVGSVGElement>) {
    const rect = e.currentTarget.getBoundingClientRect()
    const relX = e.clientX - rect.left
    const relY = e.clientY - rect.top
    const svgX = (relX / rect.width) * viewWidth

    if (svgX < PAD.left || svgX > viewWidth - PAD.right) {
      setHover(null)
      return
    }
    const fraction = (svgX - PAD.left) / CW
    const idx = Math.max(0, Math.min(n - 1, Math.round(fraction * (n - 1))))
    setHover({ idx, mouseX: relX, mouseY: relY })
  }

  const crosshairX = hover !== null ? xOf(hover.idx) : null

  return (
    <div className="w-full relative" ref={containerRef}>
      {/* Legend */}
      <div className="flex flex-wrap gap-x-4 gap-y-1 mb-3">
        {products.map((p, i) => (
          <div key={p.id} className="flex items-center gap-1.5 text-xs min-w-0">
            <span className="inline-block w-3 h-0.5 shrink-0 rounded-full" style={{ backgroundColor: COLORS[i] }} />
            <span className="truncate max-w-[140px] text-muted-foreground">{p.name}</span>
          </div>
        ))}
      </div>

      <svg
        viewBox={`0 0 ${viewWidth} ${viewHeight}`}
        className="w-full overflow-visible cursor-crosshair"
        style={{ aspectRatio: `${viewWidth} / ${viewHeight}` }}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHover(null)}
        aria-label="Top products revenue chart"
      >
        {/* Y gridlines + labels */}
        {yTicks.map((v) => {
          const y = yOf(v)
          const label = v >= 1000 ? `$${(v / 1000).toFixed(1)}k` : `$${v.toFixed(0)}`
          return (
            <g key={v}>
              <line x1={PAD.left} y1={y} x2={viewWidth - PAD.right} y2={y}
                stroke="#888" strokeOpacity={0.15} strokeWidth={1} />
              <text x={PAD.left - 6} y={y} fontSize={9} fill="#888" textAnchor="end" dominantBaseline="middle">
                {label}
              </text>
            </g>
          )
        })}

        {/* X labels */}
        {labels.map((lbl, i) => {
          if (i % xInterval !== 0 && i !== n - 1) return null
          return (
            <text key={i} x={xOf(i)} y={viewHeight - PAD.bottom + 12}
              fontSize={9} fill="#888" textAnchor="middle">
              {lbl}
            </text>
          )
        })}

        {/* Crosshair */}
        {crosshairX !== null && (
          <line
            x1={crosshairX} y1={PAD.top}
            x2={crosshairX} y2={PAD.top + CH}
            stroke="#888" strokeOpacity={0.4} strokeWidth={1} strokeDasharray="3 3"
          />
        )}

        {/* Product lines + dots */}
        {products.map((p, pi) => {
          const xs = p.data.map((_, i) => xOf(i))
          const ys = p.data.map((v) => yOf(v))
          const color = COLORS[pi]
          return (
            <g key={p.id}>
              <path d={buildPath(xs, ys)} fill="none" stroke={color}
                strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" opacity={0.9} />
              {/* Hover dot */}
              {hover !== null && (
                <circle cx={xs[hover.idx]} cy={ys[hover.idx]} r={4}
                  fill={color} stroke="white" strokeWidth={1.5} />
              )}
              {/* Endpoint dot when not hovering */}
              {hover === null && (
                <circle cx={xs[p.data.length - 1]} cy={ys[p.data.length - 1]} r={3}
                  fill={color} stroke="white" strokeWidth={1.5} />
              )}
            </g>
          )
        })}
      </svg>

      {/* Tooltip */}
      {hover !== null && (() => {
        const containerWidth = containerRef.current?.offsetWidth ?? 500
        const tooltipWidth = 180
        const flipLeft = hover.mouseX + tooltipWidth + 16 > containerWidth
        const left = flipLeft ? hover.mouseX - tooltipWidth - 12 : hover.mouseX + 12
        const top = Math.max(0, hover.mouseY - 60)

        return (
          <div
            className="absolute z-10 pointer-events-none rounded-lg border bg-background shadow-lg px-3 py-2 text-xs"
            style={{ left, top, width: tooltipWidth }}
          >
            <p className="font-semibold mb-1.5 text-foreground">{labels[hover.idx]}</p>
            {products.map((p, i) => (
              <div key={p.id} className="flex items-center justify-between gap-2 py-0.5">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="inline-block w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: COLORS[i] }} />
                  <span className="truncate text-muted-foreground">{p.name.split(" ").slice(0, 2).join(" ")}</span>
                </div>
                <span className="font-mono font-medium shrink-0">
                  ${p.data[hover.idx].toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        )
      })()}
    </div>
  )
}
